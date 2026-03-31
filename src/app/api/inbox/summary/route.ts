import { NextResponse } from "next/server";
import { InboxItemStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { syncCustomerLifecycleInboxItems } from "@/lib/customer-intelligence";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  await syncCustomerLifecycleInboxItems(
    user.role === "CLIENT" ? user.clientId : undefined,
  );

  const now = new Date();
  const where = {
    audience: user.role,
    status: InboxItemStatus.OPEN,
    OR: [{ visibleFrom: null }, { visibleFrom: { lte: now } }],
    ...(user.role === "CLIENT" ? { clientId: user.clientId ?? "__none__" } : {}),
  };

  const [openCount, unseenCount, items] = await Promise.all([
    prisma.inboxItem.count({ where }),
    prisma.inboxItem.count({
      where: {
        ...where,
        viewedAt: null,
      },
    }),
    prisma.inboxItem.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        createdAt: true,
        dueAt: true,
        clientId: true,
        leadId: true,
        saleId: true,
        profileChangeRequestId: true,
      },
    }),
  ]);

  return NextResponse.json({
    openCount,
    unseenCount,
    items,
    role: user.role,
  });
}
