import crypto from "node:crypto";
import { ConfirmationLinkStatus, Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type SaleActionState = {
  error?: string;
  success?: string;
};

export function parseCurrencyInput(value?: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const numeric = Number(normalized);

  if (Number.isNaN(numeric)) {
    return null;
  }

  return new Prisma.Decimal(numeric);
}

export function parseSaleItems(rawItems: string) {
  return rawItems
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createConfirmationToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function createMetaEventId() {
  return crypto.randomUUID();
}

export async function getScopedLeadForSale(leadId: string) {
  const user = await requireUser();

  return prisma.lead.findFirst({
    where: {
      id: leadId,
      ...(user.role === "ADMIN" ? {} : { clientId: user.clientId ?? "__none__" }),
    },
    include: {
      client: true,
      sales: {
        include: {
          items: true,
          confirmation: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function getSaleConfirmationByToken(token: string) {
  return prisma.saleConfirmationLink.findUnique({
    where: { token },
    include: {
      sale: {
        include: {
          lead: true,
          client: true,
          items: true,
          confirmation: true,
        },
      },
    },
  });
}

export function isConfirmationExpired(expiresAt?: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() < Date.now());
}

export async function markLinkExpired(linkId: string, saleId: string) {
  await prisma.$transaction([
    prisma.saleConfirmationLink.update({
      where: { id: linkId },
      data: {
        status: ConfirmationLinkStatus.EXPIRED,
      },
    }),
    prisma.sale.update({
      where: { id: saleId },
      data: {
        status: SaleStatus.EXPIRED,
      },
    }),
  ]);
}
