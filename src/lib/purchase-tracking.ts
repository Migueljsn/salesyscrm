import { Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrUpdateOpenInboxItem, resolveInboxItems } from "@/lib/inbox";
import { sendMetaPurchaseEvent } from "@/lib/meta";

type ProcessSalePurchaseTrackingInput = {
  saleId: string;
  eventSourceUrl: string;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
};

export async function processSalePurchaseTracking({
  saleId,
  eventSourceUrl,
  clientIpAddress,
  clientUserAgent,
}: ProcessSalePurchaseTrackingInput) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      lead: true,
      items: true,
      client: {
        include: {
          settings: true,
        },
      },
      confirmation: true,
    },
  });

  if (!sale) {
    throw new Error("Venda nao encontrada.");
  }

  if (sale.status !== SaleStatus.CONFIRMED) {
    throw new Error("A venda precisa estar confirmada para enviar o Purchase.");
  }

  const trackingResult = await sendMetaPurchaseEvent({
    sale,
    settings:
      sale.client.settings ??
      ({
        clientId: sale.clientId,
        leadCaptureKey: "",
        pixelId: null,
        metaAccessToken: null,
        metaTestEventCode: null,
        purchaseTrackingEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: "__missing__",
      } as NonNullable<typeof sale.client.settings>),
    eventSourceUrl,
    clientIpAddress,
    clientUserAgent,
  });

  await prisma.sale.update({
    where: { id: saleId },
    data: {
      trackingStatus: trackingResult.ok
        ? "SENT"
        : trackingResult.skipped
          ? "SKIPPED"
          : "FAILED",
      trackingSentAt: trackingResult.ok ? new Date() : null,
      trackingError: trackingResult.ok ? null : trackingResult.error,
      trackingResponse:
        "responseBody" in trackingResult
          ? ((trackingResult.responseBody ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull)
          : Prisma.JsonNull,
    },
  });

  if (trackingResult.ok || trackingResult.skipped) {
    await resolveInboxItems({
      type: "TRACKING_ERROR",
      saleId,
    });
  } else {
    await createOrUpdateOpenInboxItem({
      type: "TRACKING_ERROR",
      audience: "ADMIN",
      title: "Erro no envio de Purchase",
      description: `Falha no tracking da venda da lead ${sale.lead.name}.`,
      clientId: sale.clientId,
      leadId: sale.leadId,
      saleId,
    });
  }

  return {
    sale,
    trackingResult,
  };
}
