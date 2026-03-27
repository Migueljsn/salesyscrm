import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getDateRange(period: string | undefined) {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case "7d":
      start.setDate(now.getDate() - 6);
      break;
    case "90d":
      start.setDate(now.getDate() - 89);
      break;
    case "30d":
    default:
      start.setDate(now.getDate() - 29);
      break;
  }

  start.setHours(0, 0, 0, 0);

  return { start, end: now };
}

function buildScopedSaleWhere(clientId?: string | null, extra?: Prisma.SaleWhereInput) {
  return {
    ...(clientId ? { clientId } : {}),
    ...extra,
  };
}

export async function getScopedDashboardMetrics(clientId?: string | null) {
  const leadWhere = clientId ? { clientId } : {};
  const saleWhere = clientId ? { clientId } : {};
  const confirmedSaleWhere = buildScopedSaleWhere(clientId, { status: "CONFIRMED" });

  const [
    leadCount,
    saleCount,
    confirmedSales,
    latestLead,
    leadsByStatusRaw,
    recentSales,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.sale.count({ where: saleWhere }),
    prisma.sale.findMany({
      where: confirmedSaleWhere,
      select: {
        totalValue: true,
      },
    }),
    prisma.lead.findFirst({
      where: leadWhere,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, status: true, createdAt: true },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: leadWhere,
      _count: {
        status: true,
      },
      orderBy: {
        _count: {
          status: "desc",
        },
      },
    }),
    prisma.sale.findMany({
      where: saleWhere,
      include: {
        lead: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const confirmedRevenue = confirmedSales.reduce(
    (sum, sale) => sum + Number(sale.totalValue),
    0,
  );

  return {
    leadCount,
    saleCount,
    confirmedSaleCount: confirmedSales.length,
    confirmedRevenue,
    latestLead,
    leadsByStatus: leadsByStatusRaw.map((entry) => ({
      status: entry.status,
      count: entry._count.status,
    })),
    recentSales,
    conversionRate:
      leadCount > 0 ? (confirmedSales.length / leadCount) * 100 : 0,
  };
}

export async function getReportData({
  clientId,
  period,
  status,
}: {
  clientId?: string | null;
  period?: string;
  status?: string;
}) {
  const { start, end } = getDateRange(period);

  const leadWhere: Prisma.LeadWhereInput = {
    ...(clientId ? { clientId } : {}),
    createdAt: {
      gte: start,
      lte: end,
    },
    ...(status ? { status } : {}),
  };

  const saleWhere: Prisma.SaleWhereInput = {
    ...(clientId ? { clientId } : {}),
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  const [leads, sales, statusBreakdown] = await Promise.all([
    prisma.lead.findMany({
      where: leadWhere,
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.sale.findMany({
      where: saleWhere,
      include: {
        lead: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: leadWhere,
      _count: {
        status: true,
      },
      orderBy: {
        _count: {
          status: "desc",
        },
      },
    }),
  ]);

  const confirmedSales = sales.filter((sale) => sale.status === "CONFIRMED");
  const confirmedRevenue = confirmedSales.reduce(
    (sum, sale) => sum + Number(sale.totalValue),
    0,
  );

  return {
    period: { start, end },
    leads,
    sales,
    confirmedSales,
    confirmedRevenue,
    conversionRate: leads.length > 0 ? (confirmedSales.length / leads.length) * 100 : 0,
    statusBreakdown: statusBreakdown.map((entry) => ({
      status: entry.status,
      count: entry._count.status,
    })),
  };
}
