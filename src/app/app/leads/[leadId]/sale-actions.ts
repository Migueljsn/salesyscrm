"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SaleStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { resolveInboxItems } from "@/lib/inbox";
import { getCustomerSalesSummaryForLead } from "@/lib/leads";
import { getRequestOrigin } from "@/lib/url";
import { processSalePurchaseTracking } from "@/lib/purchase-tracking";
import {
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
  confirmRepeatSale: z.enum(["true", "false"]).default("false"),
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
    confirmRepeatSale: formData.get("confirmRepeatSale") ?? "false",
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

  if (!lead.isQualified) {
    return {
      error: "A venda so pode ser registrada depois que a lead for qualificada.",
    };
  }

  const totalValue = parseCurrencyInput(parsed.data.totalValue);

  if (!totalValue) {
    return { error: "Valor total invalido." };
  }

  const items = parseSaleItems(parsed.data.items);

  if (items.length === 0) {
    return { error: "Informe pelo menos um item." };
  }

  const previousSalesSummary = await getCustomerSalesSummaryForLead({
    clientId: lead.clientId,
    phone: lead.phone,
    document: lead.document,
  });

  if (
    previousSalesSummary &&
    previousSalesSummary.confirmedSalesCount > 0 &&
    parsed.data.confirmRepeatSale !== "true"
  ) {
    return {
      error:
        "Este cliente ja possui vendas registradas. Confirme o cadastro para somar a recompra ao historico.",
    };
  }

  const origin = await getRequestOrigin();

  const sale = await prisma.sale.create({
    data: {
      clientId: lead.clientId,
      leadId: lead.id,
      createdById: user.id,
      status: SaleStatus.CONFIRMED,
      confirmedAt: new Date(),
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
    },
  });

  if (lead.status !== "VENDA REALIZADA") {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "VENDA REALIZADA",
        nextContactAt: null,
        history: {
          create: {
            previousStatus: lead.status,
            nextStatus: "VENDA REALIZADA",
            notes: "Venda registrada e confirmada internamente pelo vendedor.",
            changedById: user.id,
          },
        },
      },
    });
  }

  await resolveInboxItems({
    type: "FOLLOW_UP_DUE",
    leadId: lead.id,
  });

  await processSalePurchaseTracking({
    saleId: sale.id,
    eventSourceUrl: `${origin}/app/leads/${lead.id}`,
  }).catch(() => undefined);

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
    },
  });

  if (!sale) {
    return { error: "Venda nao encontrada." };
  }

  const origin = await getRequestOrigin();
  const saleContextUrl = `${origin}/app/leads/${sale.leadId}`;

  try {
    const { trackingResult } = await processSalePurchaseTracking({
      saleId: sale.id,
      eventSourceUrl: saleContextUrl,
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
