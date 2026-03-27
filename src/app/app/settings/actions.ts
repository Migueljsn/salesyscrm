"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const settingsSchema = z.object({
  leadCaptureKey: z.string().trim().min(6, "Informe uma chave valida."),
  pixelId: z.string().trim().optional(),
  metaAccessToken: z.string().trim().optional(),
  metaTestEventCode: z.string().trim().optional(),
  purchaseTrackingEnabled: z.string().optional(),
});

export type SettingsActionState = {
  error?: string;
  success?: string;
};

export async function updateSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await requireUser();

  if (user.role !== "CLIENT" || !user.clientId) {
    return { error: "Apenas clientes podem editar estas configuracoes." };
  }

  const parsed = settingsSchema.safeParse({
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
      where: { clientId: user.clientId },
      update: {
        leadCaptureKey: parsed.data.leadCaptureKey,
        pixelId: parsed.data.pixelId || null,
        metaAccessToken: parsed.data.metaAccessToken || null,
        metaTestEventCode: parsed.data.metaTestEventCode || null,
        purchaseTrackingEnabled:
          parsed.data.purchaseTrackingEnabled === "on",
      },
      create: {
        clientId: user.clientId,
        leadCaptureKey: parsed.data.leadCaptureKey,
        pixelId: parsed.data.pixelId || null,
        metaAccessToken: parsed.data.metaAccessToken || null,
        metaTestEventCode: parsed.data.metaTestEventCode || null,
        purchaseTrackingEnabled:
          parsed.data.purchaseTrackingEnabled === "on",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("unique constraint")
    ) {
      return { error: "Essa chave de captura ja esta em uso." };
    }

    return { error: "Nao foi possivel salvar as configuracoes." };
  }

  revalidatePath("/app/settings");

  return { success: "Configuracoes salvas com sucesso." };
}
