import { InboxItemStatus, type InboxItemType, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrUpdateOpenInboxItem } from "@/lib/inbox";
import { getDocumentDigits } from "@/lib/document";
import { getPhoneDigits } from "@/lib/leads";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const customerLifecycleThresholds = {
  activeDays: 35,
  riskDays: 90,
  loyalPurchaseCount: 3,
  championValue: 1500,
  championPurchasesLast30Days: 2,
} as const;

export type CustomerSegmentKey =
  | "CAMPEAO"
  | "FIEL"
  | "EM_RISCO"
  | "INATIVO"
  | "NOVO_COMPRADOR";

export type CustomerLifecycleSummary = {
  clientId: string;
  leadId: string;
  customerKey: string;
  displayName: string;
  document: string | null;
  phone: string;
  confirmedSalesCount: number;
  totalConfirmedValue: number;
  purchasesLast30Days: number;
  lastConfirmedSaleAt: Date;
  daysSinceLastPurchase: number;
  segment: CustomerSegmentKey;
};

function getCustomerKey({
  phone,
  document,
}: {
  phone?: string | null;
  document?: string | null;
}) {
  const documentDigits = getDocumentDigits(document);
  const phoneDigits = getPhoneDigits(phone);

  if (documentDigits) {
    return `document:${documentDigits}`;
  }

  if (phoneDigits) {
    return `phone:${phoneDigits}`;
  }

  return null;
}

function diffInDays(date: Date, reference = new Date()) {
  return Math.floor((reference.getTime() - date.getTime()) / 86_400_000);
}

export function classifyCustomerLifecycle({
  confirmedSalesCount,
  totalConfirmedValue,
  purchasesLast30Days,
  lastConfirmedSaleAt,
}: {
  confirmedSalesCount: number;
  totalConfirmedValue: number;
  purchasesLast30Days: number;
  lastConfirmedSaleAt: Date;
}) {
  const daysSinceLastPurchase = diffInDays(lastConfirmedSaleAt);

  if (
    daysSinceLastPurchase <= customerLifecycleThresholds.activeDays &&
    confirmedSalesCount >= customerLifecycleThresholds.loyalPurchaseCount &&
    totalConfirmedValue >= customerLifecycleThresholds.championValue &&
    purchasesLast30Days >= customerLifecycleThresholds.championPurchasesLast30Days
  ) {
    return {
      segment: "CAMPEAO" as const,
      daysSinceLastPurchase,
    };
  }

  if (
    daysSinceLastPurchase <= customerLifecycleThresholds.activeDays &&
    confirmedSalesCount >= customerLifecycleThresholds.loyalPurchaseCount
  ) {
    return {
      segment: "FIEL" as const,
      daysSinceLastPurchase,
    };
  }

  if (
    daysSinceLastPurchase > customerLifecycleThresholds.activeDays &&
    daysSinceLastPurchase <= customerLifecycleThresholds.riskDays &&
    confirmedSalesCount >= 2
  ) {
    return {
      segment: "EM_RISCO" as const,
      daysSinceLastPurchase,
    };
  }

  if (
    daysSinceLastPurchase > customerLifecycleThresholds.riskDays &&
    confirmedSalesCount >= 1
  ) {
    return {
      segment: "INATIVO" as const,
      daysSinceLastPurchase,
    };
  }

  return {
    segment: "NOVO_COMPRADOR" as const,
    daysSinceLastPurchase,
  };
}

export async function getCustomerLifecycleSummaries({
  clientId,
}: {
  clientId?: string | null;
} = {}) {
  const leads = await prisma.lead.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      sales: {
        some: {
          status: "CONFIRMED",
        },
      },
    },
    select: {
      id: true,
      clientId: true,
      name: true,
      phone: true,
      document: true,
      createdAt: true,
      sales: {
        where: {
          status: "CONFIRMED",
        },
        select: {
          id: true,
          totalValue: true,
          confirmedAt: true,
          createdAt: true,
        },
      },
    },
  });

  const summaries = new Map<
    string,
    Omit<CustomerLifecycleSummary, "segment" | "daysSinceLastPurchase">
  >();
  const cutoffLast30Days = new Date();
  cutoffLast30Days.setDate(cutoffLast30Days.getDate() - 30);

  for (const lead of leads) {
    const customerKey = getCustomerKey({
      phone: lead.phone,
      document: lead.document,
    });

    if (!customerKey) {
      continue;
    }

    const current =
      summaries.get(customerKey) ??
      {
        clientId: lead.clientId,
        leadId: lead.id,
        customerKey,
        displayName: lead.name,
        document: lead.document,
        phone: lead.phone,
        confirmedSalesCount: 0,
        totalConfirmedValue: 0,
        purchasesLast30Days: 0,
        lastConfirmedSaleAt: new Date(0),
      };

    for (const sale of lead.sales) {
      const saleDate = sale.confirmedAt ?? sale.createdAt;
      current.confirmedSalesCount += 1;
      current.totalConfirmedValue += Number(sale.totalValue);

      if (saleDate >= cutoffLast30Days) {
        current.purchasesLast30Days += 1;
      }

      if (saleDate > current.lastConfirmedSaleAt) {
        current.lastConfirmedSaleAt = saleDate;
        current.leadId = lead.id;
        current.displayName = lead.name;
      }
    }

    if (!current.document && lead.document) {
      current.document = lead.document;
    }

    summaries.set(customerKey, current);
  }

  return Array.from(summaries.values())
    .filter((summary) => summary.confirmedSalesCount > 0)
    .map((summary) => {
      const classification = classifyCustomerLifecycle(summary);

      return {
        ...summary,
        ...classification,
      } satisfies CustomerLifecycleSummary;
    })
    .sort((left, right) => {
      return right.lastConfirmedSaleAt.getTime() - left.lastConfirmedSaleAt.getTime();
    });
}

export async function getCustomerLifecycleSummaryForLead(input: {
  clientId: string;
  phone?: string | null;
  document?: string | null;
}) {
  const customerKey = getCustomerKey(input);

  if (!customerKey) {
    return null;
  }

  const summaries = await getCustomerLifecycleSummaries({
    clientId: input.clientId,
  });

  return summaries.find((summary) => summary.customerKey === customerKey) ?? null;
}

export async function getCustomerLifecycleOverview(clientId?: string | null) {
  const summaries = await getCustomerLifecycleSummaries({ clientId });

  const breakdown = summaries.reduce<Record<CustomerSegmentKey, number>>(
    (accumulator, summary) => {
      accumulator[summary.segment] += 1;
      return accumulator;
    },
    {
      CAMPEAO: 0,
      FIEL: 0,
      EM_RISCO: 0,
      INATIVO: 0,
      NOVO_COMPRADOR: 0,
    },
  );

  return {
    summaries,
    breakdown,
    actionableCustomers: summaries
      .filter((summary) =>
        summary.segment === "EM_RISCO" || summary.segment === "INATIVO",
      )
      .sort((left, right) => right.daysSinceLastPurchase - left.daysSinceLastPurchase)
      .slice(0, 8),
  };
}

export async function syncCustomerLifecycleInboxItems(clientId?: string | null) {
  const summaries = await getCustomerLifecycleSummaries({ clientId });
  const actionableSummaries = summaries.filter(
    (summary) =>
      summary.segment === "EM_RISCO" || summary.segment === "INATIVO",
  );

  const desiredItems: Array<{
    key: string;
    type: InboxItemType;
    audience: UserRole;
    title: string;
    description: string;
    clientId: string;
    leadId: string;
  }> = actionableSummaries.flatMap((summary) => {
    const type: InboxItemType =
      summary.segment === "INATIVO"
        ? "CUSTOMER_REACTIVATION_DUE"
        : "CUSTOMER_AT_RISK";

    const title =
      summary.segment === "INATIVO"
        ? "Cliente pronto para reativacao"
        : "Cliente em risco de queda";

    const description =
      summary.segment === "INATIVO"
        ? `${summary.displayName} está há ${summary.daysSinceLastPurchase} dias sem comprar. Última compra em ${formatDateTime(summary.lastConfirmedSaleAt)} e acumulado de ${formatCurrency(summary.totalConfirmedValue)}.`
        : `${summary.displayName} está há ${summary.daysSinceLastPurchase} dias sem comprar. Acompanhe antes de virar inativo.`;

    return [
      {
        key: `${type}:CLIENT:${summary.leadId}`,
        type,
        audience: "CLIENT" as const,
        title,
        description,
        clientId: summary.clientId,
        leadId: summary.leadId,
      },
      {
        key: `${type}:ADMIN:${summary.leadId}`,
        type,
        audience: "ADMIN" as const,
        title,
        description,
        clientId: summary.clientId,
        leadId: summary.leadId,
      },
    ];
  });

  const desiredKeys = new Set(desiredItems.map((item) => item.key));

  const existingOpenItems = await prisma.inboxItem.findMany({
    where: {
      status: InboxItemStatus.OPEN,
      type: {
        in: ["CUSTOMER_AT_RISK", "CUSTOMER_REACTIVATION_DUE"],
      },
      ...(clientId ? { clientId } : {}),
    },
    select: {
      id: true,
      type: true,
      audience: true,
      leadId: true,
    },
  });

  await Promise.all(
    existingOpenItems.map((item) => {
      const itemKey = `${item.type}:${item.audience}:${item.leadId ?? "none"}`;

      if (desiredKeys.has(itemKey)) {
        return Promise.resolve();
      }

      return prisma.inboxItem.update({
        where: { id: item.id },
        data: {
          status: InboxItemStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      });
    }),
  );

  await Promise.all(
    desiredItems.map((item) =>
      createOrUpdateOpenInboxItem({
        type: item.type,
        audience: item.audience,
        title: item.title,
        description: item.description,
        clientId: item.clientId,
        leadId: item.leadId,
      }),
    ),
  );
}
