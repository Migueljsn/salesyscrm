import { InboxItemStatus, InboxItemType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UpsertInboxItemInput = {
  type: InboxItemType;
  audience: UserRole;
  title: string;
  description?: string | null;
  clientId?: string | null;
  leadId?: string | null;
  saleId?: string | null;
  profileChangeRequestId?: string | null;
  visibleFrom?: Date | null;
  dueAt?: Date | null;
};

function buildReferenceWhere(input: UpsertInboxItemInput) {
  if (input.profileChangeRequestId) {
    return {
      profileChangeRequestId: input.profileChangeRequestId,
    };
  }

  if (input.saleId) {
    return {
      saleId: input.saleId,
    };
  }

  if (input.leadId) {
    return {
      leadId: input.leadId,
    };
  }

  if (input.clientId) {
    return {
      clientId: input.clientId,
    };
  }

  return {};
}

export async function createOrUpdateOpenInboxItem(input: UpsertInboxItemInput) {
  const existing = await prisma.inboxItem.findFirst({
    where: {
      type: input.type,
      audience: input.audience,
      status: InboxItemStatus.OPEN,
      ...buildReferenceWhere(input),
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return prisma.inboxItem.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        description: input.description ?? null,
        visibleFrom: input.visibleFrom ?? null,
        dueAt: input.dueAt ?? null,
        viewedAt: null,
      },
    });
  }

  return prisma.inboxItem.create({
    data: {
      type: input.type,
      audience: input.audience,
      title: input.title,
      description: input.description ?? null,
      clientId: input.clientId ?? null,
      leadId: input.leadId ?? null,
      saleId: input.saleId ?? null,
      profileChangeRequestId: input.profileChangeRequestId ?? null,
      visibleFrom: input.visibleFrom ?? null,
      dueAt: input.dueAt ?? null,
      viewedAt: null,
    },
  });
}

export async function resolveInboxItems(where: {
  type?: InboxItemType;
  clientId?: string | null;
  leadId?: string | null;
  saleId?: string | null;
  profileChangeRequestId?: string | null;
}) {
  await prisma.inboxItem.updateMany({
    where: {
      status: InboxItemStatus.OPEN,
      ...(where.type ? { type: where.type } : {}),
      ...(where.clientId ? { clientId: where.clientId } : {}),
      ...(where.leadId ? { leadId: where.leadId } : {}),
      ...(where.saleId ? { saleId: where.saleId } : {}),
      ...(where.profileChangeRequestId
        ? { profileChangeRequestId: where.profileChangeRequestId }
        : {}),
    },
    data: {
      status: InboxItemStatus.RESOLVED,
      resolvedAt: new Date(),
    },
  });
}
