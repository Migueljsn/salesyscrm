import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
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
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}
