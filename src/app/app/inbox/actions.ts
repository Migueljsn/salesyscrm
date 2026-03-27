"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InboxItemStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inboxActionSchema = z.object({
  itemId: z.string().min(1),
});

async function getScopedInboxItem(itemId: string) {
  const user = await requireUser();

  const item = await prisma.inboxItem.findFirst({
    where: {
      id: itemId,
      audience: user.role,
      ...(user.role === "CLIENT" ? { clientId: user.clientId ?? "__none__" } : {}),
    },
    select: {
      id: true,
    },
  });

  return item;
}

export async function resolveInboxItemAction(formData: FormData) {
  const parsed = inboxActionSchema.safeParse({
    itemId: formData.get("itemId"),
  });

  if (!parsed.success) {
    throw new Error("Item invalido.");
  }

  const item = await getScopedInboxItem(parsed.data.itemId);

  if (!item) {
    throw new Error("Item nao encontrado.");
  }

  await prisma.inboxItem.update({
    where: { id: item.id },
    data: {
      status: InboxItemStatus.RESOLVED,
      resolvedAt: new Date(),
    },
  });

  revalidatePath("/app/inbox");
}

export async function dismissInboxItemAction(formData: FormData) {
  const parsed = inboxActionSchema.safeParse({
    itemId: formData.get("itemId"),
  });

  if (!parsed.success) {
    throw new Error("Item invalido.");
  }

  const item = await getScopedInboxItem(parsed.data.itemId);

  if (!item) {
    throw new Error("Item nao encontrado.");
  }

  await prisma.inboxItem.update({
    where: { id: item.id },
    data: {
      status: InboxItemStatus.DISMISSED,
      resolvedAt: new Date(),
    },
  });

  revalidatePath("/app/inbox");
}
