"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leadStatuses } from "@/lib/lead-status";
import { requireUser } from "@/lib/auth";
import { detectDocumentType, getDocumentDigits } from "@/lib/document";
import { findDuplicateLeadByContact } from "@/lib/leads";
import { createOrUpdateOpenInboxItem, resolveInboxItems } from "@/lib/inbox";
import { getRequestClientContext } from "@/lib/request-context";
import { getRequestOrigin } from "@/lib/url";
import { sendMetaQualifiedLeadEvent } from "@/lib/meta";

const baseLeadSchema = z.object({
  clientId: z.string().optional(),
  name: z.string().trim().min(2, "Informe o nome da lead."),
  phone: z.string().trim().min(8, "Informe o telefone."),
  document: z.string().trim().optional(),
  documentType: z.string().trim().optional(),
  state: z.string().trim().max(2).optional(),
  addressLine: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(leadStatuses).default("CREATED"),
  conversionValue: z.string().trim().optional(),
  utmSource: z.string().trim().optional(),
  utmMedium: z.string().trim().optional(),
  utmCampaign: z.string().trim().optional(),
  utmContent: z.string().trim().optional(),
  utmTerm: z.string().trim().optional(),
  fbclid: z.string().trim().optional(),
});

const statusUpdateSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(leadStatuses),
  notes: z.string().trim().optional(),
  nextContactAt: z.string().trim().optional(),
});

const deleteLeadSchema = z.object({
  leadId: z.string().min(1),
  confirmationText: z.string().trim(),
});

const qualifyLeadSchema = z.object({
  leadId: z.string().min(1),
});

export type LeadActionState = {
  error?: string;
  success?: string;
};

function parseNextContactAt(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function parseDecimal(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const numeric = Number(normalized);

  if (Number.isNaN(numeric)) {
    return null;
  }

  return new Prisma.Decimal(numeric);
}

export async function createLeadAction(
  _prevState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const user = await requireUser();

  const parsed = baseLeadSchema.safeParse({
    clientId: formData.get("clientId")?.toString() || undefined,
    name: formData.get("name"),
    phone: formData.get("phone"),
    document: formData.get("document") || undefined,
    documentType: formData.get("documentType") || undefined,
    state: formData.get("state") || undefined,
    addressLine: formData.get("addressLine") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status") || undefined,
    conversionValue: formData.get("conversionValue") || undefined,
    utmSource: formData.get("utmSource") || undefined,
    utmMedium: formData.get("utmMedium") || undefined,
    utmCampaign: formData.get("utmCampaign") || undefined,
    utmContent: formData.get("utmContent") || undefined,
    utmTerm: formData.get("utmTerm") || undefined,
    fbclid: formData.get("fbclid") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const clientId =
    user.role === "ADMIN" ? parsed.data.clientId : user.clientId ?? undefined;

  if (!clientId) {
    return { error: "Cliente nao identificado para criar a lead." };
  }

  const conversionValue = parseDecimal(parsed.data.conversionValue);
  const documentDigits = getDocumentDigits(parsed.data.document);
  const documentType =
    detectDocumentType(parsed.data.document) ?? parsed.data.documentType ?? null;

  if (conversionValue === null) {
    return { error: "Valor de conversao invalido." };
  }

  if (parsed.data.document && !documentType) {
    return { error: "Documento invalido. Informe um CPF ou CNPJ valido." };
  }

  const duplicateLead = await findDuplicateLeadByContact({
    clientId,
    phone: parsed.data.phone,
    document: documentDigits || null,
  });

  if (duplicateLead) {
    return {
      error: `Ja existe uma lead com este telefone ou documento: ${duplicateLead.name}.`,
    };
  }

  const lead = await prisma.lead.create({
    data: {
      clientId,
      assignedToId: user.role === "CLIENT" ? user.id : null,
      name: parsed.data.name,
      phone: parsed.data.phone,
      document: documentDigits || null,
      documentType,
      state: parsed.data.state || null,
      addressLine: parsed.data.addressLine || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      conversionValue,
      utmSource: parsed.data.utmSource || null,
      utmMedium: parsed.data.utmMedium || null,
      utmCampaign: parsed.data.utmCampaign || null,
      utmContent: parsed.data.utmContent || null,
      utmTerm: parsed.data.utmTerm || null,
      fbclid: parsed.data.fbclid || null,
      history: {
        create: {
          previousStatus: null,
          nextStatus: parsed.data.status,
          notes: "Lead criada no CRM.",
          changedById: user.id,
        },
      },
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/leads");
  redirect(`/app/leads/${lead.id}`);
}

export async function updateLeadStatusAction(
  _prevState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const user = await requireUser();
  const parsed = statusUpdateSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
    nextContactAt: formData.get("nextContactAt") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: parsed.data.leadId,
      ...(user.role === "ADMIN" ? {} : { clientId: user.clientId ?? "__none__" }),
    },
  });

  if (!lead) {
    return { error: "Lead nao encontrada." };
  }

  const nextContactAt = parseNextContactAt(parsed.data.nextContactAt);

  if (nextContactAt === undefined) {
    return { error: "Data de proximo contato invalida." };
  }

  await prisma.lead.update({
    where: {
      id: lead.id,
    },
    data: {
      status: parsed.data.status,
      nextContactAt:
        parsed.data.status === "VENDA REALIZADA" ? null : nextContactAt,
      history: {
        create: {
          previousStatus: lead.status,
          nextStatus: parsed.data.status,
          notes: parsed.data.notes || null,
          changedById: user.id,
        },
      },
    },
  });

  if (parsed.data.status === "VENDA REALIZADA" || !nextContactAt) {
    await resolveInboxItems({
      type: "FOLLOW_UP_DUE",
      leadId: lead.id,
    });
  } else {
    await createOrUpdateOpenInboxItem({
      type: "FOLLOW_UP_DUE",
      audience: "CLIENT",
      title: "Follow-up pendente",
      description: `Retomar contato com a lead ${lead.name}.`,
      clientId: lead.clientId,
      leadId: lead.id,
      visibleFrom: nextContactAt,
      dueAt: nextContactAt,
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${lead.id}`);
  revalidatePath("/app/inbox");

  return { success: "Status atualizado com sucesso." };
}

export async function updateLeadNotesAction(
  _prevState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const user = await requireUser();
  const leadId = formData.get("leadId")?.toString();
  const notes = formData.get("notes")?.toString().trim();

  if (!leadId) {
    return { error: "Lead invalida." };
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      ...(user.role === "ADMIN" ? {} : { clientId: user.clientId ?? "__none__" }),
    },
  });

  if (!lead) {
    return { error: "Lead nao encontrada." };
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      notes: notes || null,
    },
  });

  revalidatePath(`/app/leads/${lead.id}`);
  revalidatePath("/app/leads");

  return { success: "Observações salvas com sucesso." };
}

export async function qualifyLeadAction(
  _prevState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const user = await requireUser();
  const parsed = qualifyLeadSchema.safeParse({
    leadId: formData.get("leadId"),
  });

  if (!parsed.success) {
    return { error: "Lead invalida." };
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: parsed.data.leadId,
      ...(user.role === "ADMIN" ? {} : { clientId: user.clientId ?? "__none__" }),
    },
  });

  if (!lead) {
    return { error: "Lead nao encontrada." };
  }

  if (lead.isQualified) {
    return { error: "Esta lead ja foi marcada como qualificada." };
  }

  const qualifiedMetaEventId = crypto.randomUUID();

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      isQualified: true,
      qualifiedAt: new Date(),
      qualifiedById: user.id,
      qualifiedMetaEventId,
      history: {
        create: {
          previousStatus: lead.status,
          nextStatus: lead.status,
          notes: "Lead marcada como qualificada.",
          changedById: user.id,
        },
      },
    },
  });

  const [origin, requestClientContext] = await Promise.all([
    getRequestOrigin(),
    getRequestClientContext(),
  ]);
  const clientSettings = await prisma.clientSettings.findUnique({
    where: { clientId: lead.clientId },
  });

  if (clientSettings) {
    try {
      const trackingResult = await sendMetaQualifiedLeadEvent({
        lead: {
          ...lead,
          isQualified: true,
          qualifiedAt: new Date(),
          qualifiedById: user.id,
          qualifiedMetaEventId,
          qualifiedTrackingStatus: null,
          qualifiedTrackingSentAt: null,
          qualifiedTrackingError: null,
          qualifiedTrackingResponse: null,
        },
        settings: clientSettings,
        eventSourceUrl: `${origin}/app/leads/${lead.id}`,
        eventId: qualifiedMetaEventId,
        clientIpAddress: requestClientContext.clientIpAddress,
        clientUserAgent: requestClientContext.clientUserAgent,
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          qualifiedTrackingStatus: trackingResult.ok
            ? "SENT"
            : trackingResult.skipped
              ? "SKIPPED"
              : "FAILED",
          qualifiedTrackingSentAt: trackingResult.ok ? new Date() : null,
          qualifiedTrackingError: trackingResult.ok ? null : trackingResult.error,
          qualifiedTrackingResponse:
            "responseBody" in trackingResult
              ? ((trackingResult.responseBody ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull)
              : Prisma.JsonNull,
        },
      });
    } catch (error) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          qualifiedTrackingStatus: "FAILED",
          qualifiedTrackingError:
            error instanceof Error
              ? error.message
              : "Falha ao enviar QualifiedLead.",
        },
      });
    }
  } else {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        qualifiedTrackingStatus: "SKIPPED",
        qualifiedTrackingError: "Cliente sem configuracao de tracking.",
      },
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${lead.id}`);

  return { success: "Lead qualificada com sucesso." };
}

export async function deleteLeadAction(
  _prevState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const user = await requireUser();
  const parsed = deleteLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    confirmationText: formData.get("confirmationText"),
  });

  if (!parsed.success) {
    return { error: "Dados invalidos." };
  }

  if (parsed.data.confirmationText !== "EXCLUIR") {
    return { error: 'Para confirmar, digite exatamente "EXCLUIR".' };
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: parsed.data.leadId,
      ...(user.role === "ADMIN" ? {} : { clientId: user.clientId ?? "__none__" }),
    },
    select: {
      id: true,
    },
  });

  if (!lead) {
    return { error: "Lead nao encontrada." };
  }

  await prisma.lead.delete({
    where: { id: lead.id },
  });

  revalidatePath("/app");
  revalidatePath("/app/leads");
  redirect("/app/leads");
}
