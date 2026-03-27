import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getDocumentDigits } from "@/lib/document";

export function getPhoneDigits(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone?: string | null, text?: string) {
  const phoneDigits = getPhoneDigits(phone);

  if (!phoneDigits) {
    return null;
  }

  const fullPhone =
    phoneDigits.length <= 11 ? `55${phoneDigits}` : phoneDigits;
  const baseUrl = `https://wa.me/${fullPhone}`;

  if (!text) {
    return baseUrl;
  }

  return `${baseUrl}?text=${encodeURIComponent(text)}`;
}

export async function findDuplicateLeadByContact({
  clientId,
  phone,
  document,
}: {
  clientId: string;
  phone?: string | null;
  document?: string | null;
}) {
  const phoneDigits = getPhoneDigits(phone);
  const documentDigits = getDocumentDigits(document);

  if (!phoneDigits && !documentDigits) {
    return null;
  }

  const candidates = await prisma.lead.findMany({
    where: { clientId },
    select: {
      id: true,
      name: true,
      phone: true,
      document: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    candidates.find((candidate) => {
      const samePhone =
        phoneDigits && getPhoneDigits(candidate.phone) === phoneDigits;
      const sameDocument =
        documentDigits &&
        getDocumentDigits(candidate.document) === documentDigits;

      return Boolean(samePhone || sameDocument);
    }) ?? null
  );
}

export async function getLeadScope() {
  const user = await requireUser();

  return {
    user,
    where: user.role === "ADMIN" ? {} : { clientId: user.clientId ?? "__none__" },
  };
}

export async function listScopedLeads(search?: string, status?: string) {
  const { where } = await getLeadScope();

  const filters: Prisma.LeadWhereInput = {
    ...where,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { document: { contains: search } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  return prisma.lead.findMany({
    where: filters,
    include: {
      client: true,
      assignedTo: true,
      sales: {
        select: {
          id: true,
          totalValue: true,
          status: true,
          confirmedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getScopedLeadById(leadId: string) {
  const { where } = await getLeadScope();

  return prisma.lead.findFirst({
    where: {
      id: leadId,
      ...where,
    },
    include: {
      client: true,
      assignedTo: true,
      history: {
        include: {
          changedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
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
