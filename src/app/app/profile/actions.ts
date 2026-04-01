"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createOrUpdateOpenInboxItem } from "@/lib/inbox";
import { encryptRequestedPassword } from "@/lib/password-request";
import { supabaseAdmin } from "@/lib/supabase/admin";

const profileRequestSchema = z.object({
  requestedFullName: z.string().trim().min(3, "Informe o nome completo."),
  requestedEmail: z.email("Informe um email valido."),
  requestedPassword: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || ""),
});

const adminPasswordSchema = z.object({
  password: z
    .string()
    .trim()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha informada e muito longa."),
  confirmPassword: z.string().trim(),
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
    requestedPassword: formData.get("requestedPassword") || undefined,
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

  const requestsPasswordChange = parsed.data.requestedPassword.length > 0;

  if (
    requestsPasswordChange &&
    parsed.data.requestedPassword.length < 8
  ) {
    return { error: "A nova senha precisa ter pelo menos 8 caracteres." };
  }

  if (
    parsed.data.requestedFullName === user.fullName &&
    parsed.data.requestedEmail === user.email &&
    !requestsPasswordChange
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
      requestsPasswordChange,
      requestedPasswordEncrypted: requestsPasswordChange
        ? encryptRequestedPassword(parsed.data.requestedPassword)
        : null,
    },
  });

  await createOrUpdateOpenInboxItem({
    type: "PROFILE_CHANGE_PENDING",
    audience: "ADMIN",
    title: "Alteracao de perfil pendente",
    description: `${user.fullName} solicitou aprovacao para alterar dados de acesso${requestsPasswordChange ? " e senha" : ""}.`,
    clientId: user.clientId,
    profileChangeRequestId: request.id,
  });

  revalidatePath("/app/profile");
  revalidatePath("/admin");
  revalidatePath("/app/inbox");

  return { success: "Solicitacao enviada para aprovacao." };
}

export async function updateAdminPasswordAction(
  _prevState: ProfileRequestState,
  formData: FormData,
): Promise<ProfileRequestState> {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    return { error: "Apenas administradores podem alterar a propria senha diretamente." };
  }

  const parsed = adminPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "A confirmacao da senha nao confere." };
  }

  if (!user.authUserId) {
    return { error: "Usuario sem vinculacao com o Supabase Auth." };
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.authUserId, {
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/profile");

  return { success: "Senha atualizada com sucesso." };
}
