import crypto from "node:crypto";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

function generatePassword() {
  return crypto.randomBytes(9).toString("base64url");
}

async function ensureAuthUser({ email, password, fullName, role }) {
  const { data: existingUsers, error: listError } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (listError) {
    throw listError;
  }

  const existing = existingUsers.users.find((user) => user.email === email);

  if (existing) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      existing.id,
      {
        email,
        password,
        user_metadata: {
          full_name: fullName,
          role,
        },
      },
    );

    if (error || !data.user) {
      throw error ?? new Error(`Falha ao atualizar usuario ${email}`);
    }

    return data.user;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Falha ao criar usuario ${email}`);
  }

  return data.user;
}

async function main() {
  const adminPassword = generatePassword();
  const clientPassword = generatePassword();

  const client = await prisma.client.upsert({
    where: { slug: "cliente-demo" },
    update: { name: "Cliente Demo" },
    create: {
      name: "Cliente Demo",
      slug: "cliente-demo",
    },
  });

  await prisma.clientSettings.upsert({
    where: { clientId: client.id },
    update: {
      leadCaptureKey: "braveo-demo-form-key",
    },
    create: {
      clientId: client.id,
      leadCaptureKey: "braveo-demo-form-key",
    },
  });

  const adminEmail = "admin@wpppurchasecrm.com";
  const clientEmail = "cliente.demo@wpppurchasecrm.com";

  const [adminAuthUser, clientAuthUser] = await Promise.all([
    ensureAuthUser({
      email: adminEmail,
      password: adminPassword,
      fullName: "Administrador da Plataforma",
      role: "ADMIN",
    }),
    ensureAuthUser({
      email: clientEmail,
      password: clientPassword,
      fullName: "Cliente Demo",
      role: "CLIENT",
    }),
  ]);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      authUserId: adminAuthUser.id,
      fullName: "Administrador da Plataforma",
      role: "ADMIN",
      clientId: null,
      isActive: true,
    },
    create: {
      authUserId: adminAuthUser.id,
      email: adminEmail,
      fullName: "Administrador da Plataforma",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: clientEmail },
    update: {
      authUserId: clientAuthUser.id,
      fullName: "Cliente Demo",
      role: "CLIENT",
      clientId: client.id,
      isActive: true,
    },
    create: {
      authUserId: clientAuthUser.id,
      email: clientEmail,
      fullName: "Cliente Demo",
      role: "CLIENT",
      clientId: client.id,
    },
  });

  console.log("ADMIN_EMAIL=" + adminEmail);
  console.log("ADMIN_PASSWORD=" + adminPassword);
  console.log("CLIENT_EMAIL=" + clientEmail);
  console.log("CLIENT_PASSWORD=" + clientPassword);
  console.log("CLIENT_LEAD_CAPTURE_KEY=braveo-demo-form-key");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
