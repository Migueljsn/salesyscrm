"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createOrUpdateOpenInboxItem } from "@/lib/inbox";

const profileRequestSchema = z.object({
  requestedFullName: z.string().trim().min(3, "Informe o nome completo."),
  requestedEmail: z.email("Informe um email valido."),
});

export type ProfileRequestState = {
  error?: string;
  success?: string;
};

export async function submitProfileChangeRequest(
  _prevState: ProfileRequestState,
  formData: FormData,
): Promise<ProfileRequestState> {
  const user = await requireUser();

  const parsed = profileRequestSchema.safeParse({
    requestedFullName: formData.get("requestedFullName"),
    requestedEmail: formData.get("requestedEmail"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const hasPendingRequest = await prisma.profileChangeRequest.findFirst({
    where: {
      requesterId: user.id,
      status: "PENDING",
    },
    select: { id: true },
  });

  if (hasPendingRequest) {
    return {
      error: "Ja existe uma solicitacao pendente para este usuario.",
    };
  }

  if (
    parsed.data.requestedFullName === user.fullName &&
    parsed.data.requestedEmail === user.email
  ) {
    return { error: "Nao ha alteracoes para solicitar." };
  }

  const emailInUse = await prisma.user.findFirst({
    where: {
      email: parsed.data.requestedEmail,
      NOT: {
        id: user.id,
      },
    },
    select: { id: true },
  });

  if (emailInUse) {
    return { error: "Este email ja esta em uso por outro usuario." };
  }

  const request = await prisma.profileChangeRequest.create({
    data: {
      requesterId: user.id,
      currentFullName: user.fullName,
      currentEmail: user.email,
      requestedFullName: parsed.data.requestedFullName,
      requestedEmail: parsed.data.requestedEmail,
    },
  });

  await createOrUpdateOpenInboxItem({
    type: "PROFILE_CHANGE_PENDING",
    audience: "ADMIN",
    title: "Alteracao de perfil pendente",
    description: `${user.fullName} solicitou aprovacao para alterar nome/email.`,
    clientId: user.clientId,
    profileChangeRequestId: request.id,
  });

  revalidatePath("/app/profile");
  revalidatePath("/admin");
  revalidatePath("/app/inbox");

  return { success: "Solicitacao enviada para aprovacao." };
}
