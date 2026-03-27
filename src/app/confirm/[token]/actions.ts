"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ConfirmationLinkStatus, SaleStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveInboxItems } from "@/lib/inbox";
import { getRequestOrigin } from "@/lib/url";
import { processSalePurchaseTracking } from "@/lib/purchase-tracking";
import {
  getSaleConfirmationByToken,
  isConfirmationExpired,
  markLinkExpired,
  type SaleActionState,
} from "@/lib/sales";

const confirmSchema = z.object({
  token: z.string().min(1),
  accepted: z
    .string()
    .refine((value) => value === "on", "Voce precisa confirmar que os dados da compra estao corretos."),
});

export async function confirmSaleAction(
  _prevState: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  const parsed = confirmSchema.safeParse({
    token: formData.get("token"),
    accepted: formData.get("accepted"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confirmacao invalida." };
  }

  const link = await getSaleConfirmationByToken(parsed.data.token);

  if (!link) {
    return { error: "Link de confirmacao invalido." };
  }

  if (link.status !== ConfirmationLinkStatus.ACTIVE) {
    return { error: "Este link nao esta mais disponivel para confirmacao." };
  }

  if (isConfirmationExpired(link.expiresAt)) {
    await markLinkExpired(link.id, link.saleId);
    revalidatePath(`/confirm/${parsed.data.token}`);
    return { error: "Este link expirou." };
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip");
  const userAgent = requestHeaders.get("user-agent");
  const origin = await getRequestOrigin();

  await prisma.$transaction(async (tx) => {
    await tx.saleConfirmationLink.update({
      where: { id: link.id },
      data: {
        status: ConfirmationLinkStatus.CONFIRMED,
        usedAt: new Date(),
        lastIp: ip || null,
        userAgent: userAgent || null,
      },
    });

    await tx.sale.update({
      where: { id: link.saleId },
      data: {
        status: SaleStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    if (link.sale.lead.status !== "VENDA REALIZADA") {
      await tx.lead.update({
        where: { id: link.sale.leadId },
        data: {
          status: "VENDA REALIZADA",
          history: {
            create: {
              previousStatus: link.sale.lead.status,
              nextStatus: "VENDA REALIZADA",
              notes: "Venda confirmada pelo cliente no link pos-venda.",
            },
          },
        },
      });
    }
  });

  await resolveInboxItems({
    type: "SALE_CONFIRMATION_PENDING",
    saleId: link.saleId,
  });

  await processSalePurchaseTracking({
    saleId: link.saleId,
    eventSourceUrl: `${origin}/confirm/${parsed.data.token}`,
    clientIpAddress: ip,
    clientUserAgent: userAgent,
  }).catch(async (error) => {
    await prisma.sale.update({
      where: { id: link.saleId },
      data: {
        trackingStatus: "FAILED",
        trackingSentAt: null,
        trackingError:
          error instanceof Error ? error.message : "Falha ao enviar Purchase.",
      },
    });
  });

  revalidatePath(`/confirm/${parsed.data.token}`);
  revalidatePath(`/app/leads/${link.sale.leadId}`);
  revalidatePath("/app/leads");
  revalidatePath("/app");
  revalidatePath("/app/inbox");

  return { success: "Compra confirmada com sucesso." };
}
