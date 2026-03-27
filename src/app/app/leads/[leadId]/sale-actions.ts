"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createOrUpdateOpenInboxItem } from "@/lib/inbox";
import { getRequestOrigin } from "@/lib/url";
import { processSalePurchaseTracking } from "@/lib/purchase-tracking";
import {
  createConfirmationToken,
  createMetaEventId,
  parseCurrencyInput,
  parseSaleItems,
  type SaleActionState,
} from "@/lib/sales";

const createSaleSchema = z.object({
  leadId: z.string().min(1),
  buyerName: z.string().trim().min(2, "Informe o nome do comprador."),
  buyerPhone: z.string().trim().min(8, "Informe o telefone do comprador."),
  buyerAddress: z.string().trim().optional(),
  totalValue: z.string().trim().min(1, "Informe o valor total."),
  items: z.string().trim().min(2, "Informe pelo menos um item."),
});

const retrySaleTrackingSchema = z.object({
  saleId: z.string().min(1, "Venda invalida."),
});

export async function createSaleAction(
  _prevState: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  const user = await requireUser();
  const parsed = createSaleSchema.safeParse({
    leadId: formData.get("leadId"),
    buyerName: formData.get("buyerName"),
    buyerPhone: formData.get("buyerPhone"),
    buyerAddress: formData.get("buyerAddress") || undefined,
    totalValue: formData.get("totalValue"),
    items: formData.get("items"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: parsed.data.leadId,
      ...(user.role === "ADMIN" ? {} : { clientId: user.clientId ?? "__none__" }),
    },
  });

  if (!lead) {
    return { error: "Lead nao encontrada." };
  }

  const totalValue = parseCurrencyInput(parsed.data.totalValue);

  if (!totalValue) {
    return { error: "Valor total invalido." };
  }

  const items = parseSaleItems(parsed.data.items);

  if (items.length === 0) {
    return { error: "Informe pelo menos um item." };
  }

  const sale = await prisma.sale.create({
    data: {
      clientId: lead.clientId,
      leadId: lead.id,
      createdById: user.id,
      totalValue,
      buyerName: parsed.data.buyerName,
      buyerPhone: parsed.data.buyerPhone,
      buyerAddress: parsed.data.buyerAddress || null,
      metaEventId: createMetaEventId(),
      items: {
        create: items.map((description) => ({
          description,
        })),
      },
      confirmation: {
        create: {
          token: createConfirmationToken(),
        },
      },
    },
    include: {
      confirmation: true,
    },
  });

  await createOrUpdateOpenInboxItem({
    type: "SALE_CONFIRMATION_PENDING",
    audience: "CLIENT",
    title: "Venda aguardando confirmacao",
    description: `A lead ${lead.name} possui uma venda aguardando confirmacao do comprador.`,
    clientId: lead.clientId,
    leadId: lead.id,
    saleId: sale.id,
  });

  revalidatePath("/app");
  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${lead.id}`);
  revalidatePath("/app/inbox");

  redirect(`/app/leads/${sale.leadId}`);
}

export type RetrySaleTrackingState = {
  error?: string;
  success?: string;
};

export async function retrySaleTrackingAction(
  _prevState: RetrySaleTrackingState,
  formData: FormData,
): Promise<RetrySaleTrackingState> {
  const user = await requireUser();
  const parsed = retrySaleTrackingSchema.safeParse({
    saleId: formData.get("saleId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Venda invalida." };
  }

  const sale = await prisma.sale.findFirst({
    where: {
      id: parsed.data.saleId,
      ...(user.role === "ADMIN" ? {} : { clientId: user.clientId ?? "__none__" }),
    },
    select: {
      id: true,
      leadId: true,
      confirmation: {
        select: {
          token: true,
        },
      },
    },
  });

  if (!sale) {
    return { error: "Venda nao encontrada." };
  }

  const origin = await getRequestOrigin();
  const confirmationUrl = sale.confirmation?.token
    ? `${origin}/confirm/${sale.confirmation.token}`
    : `${origin}/app/leads/${sale.leadId}`;

  try {
    const { trackingResult } = await processSalePurchaseTracking({
      saleId: sale.id,
      eventSourceUrl: confirmationUrl,
    });

    revalidatePath("/app");
    revalidatePath("/app/inbox");
    revalidatePath(`/app/leads/${sale.leadId}`);
    revalidatePath("/admin");

    if (trackingResult.ok) {
      return { success: "Purchase reenviado com sucesso." };
    }

    return {
      error: trackingResult.error ?? "Nao foi possivel reenviar o Purchase.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao reprocessar o tracking.",
    };
  }
}
