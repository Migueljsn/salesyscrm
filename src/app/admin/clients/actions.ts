"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

const createClientSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa."),
  email: z.email("Informe um email valido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha informada e muito longa."),
});

export type CreateClientState = {
  error?: string;
  success?: string;
  credentials?: {
    companyName: string;
    email: string;
    password: string;
    leadCaptureKey: string;
  };
};

const clientActionSchema = z.object({
  clientId: z.string().min(1, "Cliente invalido."),
});

const resetPasswordSchema = clientActionSchema.extend({
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha informada e muito longa."),
});

const updateClientAccountSchema = clientActionSchema.extend({
  companyName: z.string().trim().min(2, "Informe o nome da empresa."),
  email: z.email("Informe um email valido."),
});

const updateClientSettingsSchema = clientActionSchema.extend({
  leadCaptureKey: z.string().trim().min(6, "Informe uma chave valida."),
  pixelId: z.string().trim().optional(),
  metaAccessToken: z.string().trim().optional(),
  metaTestEventCode: z.string().trim().optional(),
  purchaseTrackingEnabled: z.string().optional(),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function createUniqueSlug(companyName: string) {
  const baseSlug = slugify(companyName) || "cliente";
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.client.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

function createLeadCaptureKey(slug: string) {
  return `${slug}-${crypto.randomBytes(6).toString("hex")}`;
}

async function createUniqueLeadCaptureKey(slug: string) {
  let leadCaptureKey = createLeadCaptureKey(slug);

  while (
    await prisma.clientSettings.findUnique({
      where: { leadCaptureKey },
      select: { id: true },
    })
  ) {
    leadCaptureKey = createLeadCaptureKey(slug);
  }

  return leadCaptureKey;
}

export async function createClientAction(
  _prevState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  await requireAdmin();

  const parsed = createClientSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const email = parsed.data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "Ja existe um usuario com este email." };
  }

  const { data: listedUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  });

  if (listError) {
    return { error: listError.message };
  }

  const existingAuthUser = listedUsers.users.find((user) => user.email === email);

  if (existingAuthUser) {
    return { error: "Ja existe um usuario no Supabase Auth com este email." };
  }

  const slug = await createUniqueSlug(parsed.data.companyName);
  const leadCaptureKey = await createUniqueLeadCaptureKey(slug);

  const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.companyName,
      role: "CLIENT",
    },
  });

  if (createAuthError || !authData.user) {
    return { error: createAuthError?.message ?? "Falha ao criar o login do cliente." };
  }

  let clientId: string | null = null;

  try {
    const client = await prisma.client.create({
      data: {
        name: parsed.data.companyName,
        slug,
      },
    });

    clientId = client.id;

    await prisma.$transaction([
      prisma.clientSettings.create({
        data: {
          clientId: client.id,
          leadCaptureKey,
        },
      }),
      prisma.user.create({
        data: {
          authUserId: authData.user.id,
          email,
          fullName: parsed.data.companyName,
          role: "CLIENT",
          clientId: client.id,
          isActive: true,
        },
      }),
    ]);
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    if (clientId) {
      await prisma.client.delete({
        where: { id: clientId },
      }).catch(() => undefined);
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "Falha ao criar o cliente na base interna.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");

  return {
    success: "Cliente criado com sucesso.",
    credentials: {
      companyName: parsed.data.companyName,
      email,
      password: parsed.data.password,
      leadCaptureKey,
    },
  };
}

export async function toggleClientStatusAction(formData: FormData) {
  await requireAdmin();

  const parsed = clientActionSchema.safeParse({
    clientId: formData.get("clientId"),
  });

  if (!parsed.success) {
    throw new Error("Cliente invalido.");
  }

  const client = await prisma.client.findUnique({
    where: { id: parsed.data.clientId },
    include: {
      users: {
        where: { role: "CLIENT" },
        select: { id: true, isActive: true },
      },
    },
  });

  if (!client) {
    throw new Error("Cliente nao encontrado.");
  }

  const nextStatus = !client.isActive;

  await prisma.$transaction([
    prisma.client.update({
      where: { id: client.id },
      data: { isActive: nextStatus },
    }),
    ...client.users.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: { isActive: nextStatus },
      }),
    ),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${client.id}`);
}

export type UpdateClientAccountState = {
  error?: string;
  success?: string;
};

export async function updateClientAccountAction(
  _prevState: UpdateClientAccountState,
  formData: FormData,
): Promise<UpdateClientAccountState> {
  await requireAdmin();

  const parsed = updateClientAccountSchema.safeParse({
    clientId: formData.get("clientId"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const email = parsed.data.email.toLowerCase();
  const clientUser = await prisma.user.findFirst({
    where: {
      clientId: parsed.data.clientId,
      role: "CLIENT",
    },
    select: {
      id: true,
      authUserId: true,
      email: true,
    },
  });

  if (!clientUser) {
    return { error: "Usuario principal do cliente nao encontrado." };
  }

  const emailOwner = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: clientUser.id },
    },
    select: { id: true },
  });

  if (emailOwner) {
    return { error: "Ja existe um usuario com este email." };
  }

  if (clientUser.authUserId) {
    const { data: listedUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });

    if (listError) {
      return { error: listError.message };
    }

    const authEmailOwner = listedUsers.users.find(
      (user) => user.email?.toLowerCase() === email && user.id !== clientUser.authUserId,
    );

    if (authEmailOwner) {
      return { error: "Ja existe um usuario no Supabase Auth com este email." };
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(clientUser.authUserId, {
      email,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.companyName,
        role: "CLIENT",
      },
    });

    if (error) {
      return { error: error.message };
    }
  }

  await prisma.$transaction([
    prisma.client.update({
      where: { id: parsed.data.clientId },
      data: {
        name: parsed.data.companyName,
      },
    }),
    prisma.user.update({
      where: { id: clientUser.id },
      data: {
        fullName: parsed.data.companyName,
        email,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  revalidatePath("/app");
  revalidatePath("/app/profile");

  return { success: "Dados do cliente atualizados com sucesso." };
}

export type UpdateClientSettingsState = {
  error?: string;
  success?: string;
};

export async function updateClientSettingsByAdminAction(
  _prevState: UpdateClientSettingsState,
  formData: FormData,
): Promise<UpdateClientSettingsState> {
  await requireAdmin();

  const parsed = updateClientSettingsSchema.safeParse({
    clientId: formData.get("clientId"),
    leadCaptureKey: formData.get("leadCaptureKey"),
    pixelId: formData.get("pixelId") || undefined,
    metaAccessToken: formData.get("metaAccessToken") || undefined,
    metaTestEventCode: formData.get("metaTestEventCode") || undefined,
    purchaseTrackingEnabled:
      formData.get("purchaseTrackingEnabled")?.toString() || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  try {
    await prisma.clientSettings.upsert({
      where: { clientId: parsed.data.clientId },
      update: {
        leadCaptureKey: parsed.data.leadCaptureKey,
        pixelId: parsed.data.pixelId || null,
        metaAccessToken: parsed.data.metaAccessToken || null,
        metaTestEventCode: parsed.data.metaTestEventCode || null,
        purchaseTrackingEnabled: parsed.data.purchaseTrackingEnabled === "on",
      },
      create: {
        clientId: parsed.data.clientId,
        leadCaptureKey: parsed.data.leadCaptureKey,
        pixelId: parsed.data.pixelId || null,
        metaAccessToken: parsed.data.metaAccessToken || null,
        metaTestEventCode: parsed.data.metaTestEventCode || null,
        purchaseTrackingEnabled: parsed.data.purchaseTrackingEnabled === "on",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("unique constraint")
    ) {
      return { error: "Essa chave de captura ja esta em uso." };
    }

    return { error: "Nao foi possivel salvar as configuracoes do cliente." };
  }

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  revalidatePath("/app/settings");

  return { success: "Configuracoes atualizadas com sucesso." };
}

export type RegenerateLeadCaptureKeyState = {
  error?: string;
  success?: string;
  leadCaptureKey?: string;
};

export async function regenerateLeadCaptureKeyAction(
  _prevState: RegenerateLeadCaptureKeyState,
  formData: FormData,
): Promise<RegenerateLeadCaptureKeyState> {
  await requireAdmin();

  const parsed = clientActionSchema.safeParse({
    clientId: formData.get("clientId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Cliente invalido." };
  }

  const client = await prisma.client.findUnique({
    where: { id: parsed.data.clientId },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!client) {
    return { error: "Cliente nao encontrado." };
  }

  const leadCaptureKey = await createUniqueLeadCaptureKey(client.slug);

  await prisma.clientSettings.upsert({
    where: { clientId: client.id },
    update: { leadCaptureKey },
    create: {
      clientId: client.id,
      leadCaptureKey,
    },
  });

  revalidatePath(`/admin/clients/${client.id}`);
  revalidatePath("/app/settings");

  return {
    success: "Lead capture key regenerada com sucesso.",
    leadCaptureKey,
  };
}

export type ResetPasswordState = {
  error?: string;
  success?: string;
  password?: string;
};

export async function resetClientPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  await requireAdmin();

  const parsed = resetPasswordSchema.safeParse({
    clientId: formData.get("clientId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const clientUser = await prisma.user.findFirst({
    where: {
      clientId: parsed.data.clientId,
      role: "CLIENT",
    },
    select: {
      id: true,
      authUserId: true,
    },
  });

  if (!clientUser?.authUserId) {
    return { error: "Usuario principal do cliente nao encontrado." };
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    clientUser.authUserId,
    {
      password: parsed.data.password,
    },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/clients/${parsed.data.clientId}`);

  return {
    success: "Senha redefinida com sucesso.",
    password: parsed.data.password,
  };
}
