import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getDocumentDigits } from "@/lib/document";

type SaleMetricsInput = {
  totalValue: Prisma.Decimal | number | string;
  status?: string | null;
  confirmedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

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
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
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
      qualifiedBy: true,
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
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export type CustomerSalesSummary = {
  confirmedSalesCount: number;
  totalConfirmedValue: string;
  lastConfirmedSaleAt: Date | null;
};

export function getConfirmedSalesMetrics(sales: SaleMetricsInput[]) {
  const confirmedSales = sales.filter((sale) => sale.status === "CONFIRMED");

  if (confirmedSales.length === 0) {
    return {
      confirmedSalesCount: 0,
      totalConfirmedValue: null,
      lastConfirmedSaleAt: null,
    };
  }

  const totalConfirmedValue = confirmedSales
    .reduce((sum, sale) => sum + Number(sale.totalValue.toString()), 0)
    .toFixed(2);

  const lastConfirmedSaleAt = confirmedSales.reduce<Date | null>((latest, sale) => {
    const candidateValue = sale.confirmedAt ?? sale.createdAt;

    if (!candidateValue) {
      return latest;
    }

    const candidate = new Date(candidateValue);

    if (!latest || candidate > latest) {
      return candidate;
    }

    return latest;
  }, null);

  return {
    confirmedSalesCount: confirmedSales.length,
    totalConfirmedValue,
    lastConfirmedSaleAt,
  };
}

export async function getCustomerSalesSummaryForLead(input: {
  clientId: string;
  phone?: string | null;
  document?: string | null;
}) {
  const phoneDigits = getPhoneDigits(input.phone);
  const documentDigits = getDocumentDigits(input.document);

  if (!phoneDigits && !documentDigits) {
    return null;
  }

  const matchingLeads = await prisma.lead.findMany({
    where: {
      clientId: input.clientId,
      OR: [
        ...(documentDigits ? [{ document: documentDigits }] : []),
        ...(phoneDigits ? [{ phone: { contains: phoneDigits } }] : []),
      ],
    },
    select: {
      id: true,
      phone: true,
      document: true,
    },
  });

  const matchingLeadIds = matchingLeads
    .filter((lead) => {
      const samePhone =
        phoneDigits && getPhoneDigits(lead.phone) === phoneDigits;
      const sameDocument =
        documentDigits &&
        getDocumentDigits(lead.document) === documentDigits;

      return Boolean(samePhone || sameDocument);
    })
    .map((lead) => lead.id);

  if (matchingLeadIds.length === 0) {
    return null;
  }

  const matchingSales = await prisma.sale.findMany({
    where: {
      clientId: input.clientId,
      status: "CONFIRMED",
      leadId: {
        in: matchingLeadIds,
      },
    },
    select: {
      totalValue: true,
      status: true,
      confirmedAt: true,
      createdAt: true,
    },
  });

  const metrics = getConfirmedSalesMetrics(matchingSales);

  if (metrics.confirmedSalesCount === 0 || !metrics.totalConfirmedValue) {
    return null;
  }

  return {
    confirmedSalesCount: metrics.confirmedSalesCount,
    totalConfirmedValue: metrics.totalConfirmedValue,
    lastConfirmedSaleAt: metrics.lastConfirmedSaleAt,
  } satisfies CustomerSalesSummary;
}
