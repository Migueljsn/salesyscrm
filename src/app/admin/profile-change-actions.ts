"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveInboxItems } from "@/lib/inbox";
import { supabaseAdmin } from "@/lib/supabase/admin";

const requestIdSchema = z.object({
  requestId: z.string().trim().min(1, "Solicitacao invalida."),
});

const rejectRequestSchema = requestIdSchema.extend({
  rejectionReason: z
    .string()
    .trim()
    .min(3, "Informe o motivo da recusa.")
    .max(300, "Motivo muito longo."),
});

async function loadPendingRequest(requestId: string) {
  return prisma.profileChangeRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: true,
    },
  });
}

export async function approveProfileChangeRequest(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = requestIdSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Solicitacao invalida.");
  }

  const request = await loadPendingRequest(parsed.data.requestId);

  if (!request || request.status !== "PENDING") {
    throw new Error("Esta solicitacao nao esta mais pendente.");
  }

  const emailInUse = await prisma.user.findFirst({
    where: {
      email: request.requestedEmail,
      NOT: { id: request.requesterId },
    },
    select: { id: true },
  });

  if (emailInUse) {
    throw new Error("O email solicitado ja esta em uso por outro usuario.");
  }

  if (request.requester.authUserId) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      request.requester.authUserId,
      {
        email: request.requestedEmail,
        user_metadata: {
          full_name: request.requestedFullName,
        },
      },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: request.requesterId },
      data: {
        fullName: request.requestedFullName,
        email: request.requestedEmail,
      },
    }),
    ...(request.requester.role === "CLIENT" && request.requester.clientId
      ? [
          prisma.client.update({
            where: { id: request.requester.clientId },
            data: {
              name: request.requestedFullName,
            },
          }),
        ]
      : []),
    prisma.profileChangeRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewerId: admin.id,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    }),
  ]);

  await resolveInboxItems({
    type: "PROFILE_CHANGE_PENDING",
    profileChangeRequestId: request.id,
  });

  revalidatePath("/admin");
  revalidatePath("/app/profile");
  revalidatePath("/app/inbox");
}

export async function rejectProfileChangeRequest(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = rejectRequestSchema.safeParse({
    requestId: formData.get("requestId"),
    rejectionReason: formData.get("rejectionReason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos.");
  }

  const request = await loadPendingRequest(parsed.data.requestId);

  if (!request || request.status !== "PENDING") {
    throw new Error("Esta solicitacao nao esta mais pendente.");
  }

  await prisma.profileChangeRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      rejectionReason: parsed.data.rejectionReason,
      reviewerId: admin.id,
      reviewedAt: new Date(),
    },
  });

  await resolveInboxItems({
    type: "PROFILE_CHANGE_PENDING",
    profileChangeRequestId: request.id,
  });

  revalidatePath("/admin");
  revalidatePath("/app/profile");
  revalidatePath("/app/inbox");
}
