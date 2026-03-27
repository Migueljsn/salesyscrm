import { NextRequest, NextResponse } from "next/server";
import { InboxItemStatus } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const viewSchema = z.object({
  itemId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = viewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Item invalido." }, { status: 400 });
  }

  await prisma.inboxItem.updateMany({
    where: {
      id: parsed.data.itemId,
      audience: user.role,
      status: InboxItemStatus.OPEN,
      ...(user.role === "CLIENT" ? { clientId: user.clientId ?? "__none__" } : {}),
    },
    data: {
      viewedAt: new Date(),
      status: InboxItemStatus.RESOLVED,
      resolvedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
