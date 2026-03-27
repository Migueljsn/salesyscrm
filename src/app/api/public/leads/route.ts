import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { detectDocumentType, getDocumentDigits } from "@/lib/document";
import { findDuplicateLeadByContact } from "@/lib/leads";

const leadSchema = z.object({
  leadCaptureKey: z.string().trim().min(6),
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  document: z.string().trim().min(11),
  documentType: z.enum(["cpf", "cnpj"]).optional(),
  state: z.string().trim().min(2).max(2),
  addressLine: z.string().trim().optional(),
  utm_source: z.string().trim().optional(),
  utm_medium: z.string().trim().optional(),
  utm_campaign: z.string().trim().optional(),
  utm_content: z.string().trim().optional(),
  utm_term: z.string().trim().optional(),
  fbclid: z.string().trim().optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Private-Network": "true",
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message ?? "Payload invalido." },
      400,
    );
  }

  const settings = await prisma.clientSettings.findUnique({
    where: { leadCaptureKey: parsed.data.leadCaptureKey },
    include: {
      client: true,
    },
  });

  if (!settings || !settings.client.isActive) {
    return json({ error: "Chave de captura invalida." }, 403);
  }

  const document = getDocumentDigits(parsed.data.document);
  const documentType =
    detectDocumentType(parsed.data.document) ?? parsed.data.documentType ?? null;

  if (!documentType) {
    return json({ error: "Documento invalido." }, 400);
  }

  const duplicateLead = await findDuplicateLeadByContact({
    clientId: settings.clientId,
    phone: parsed.data.phone,
    document,
  });

  if (duplicateLead) {
    return json({
      ok: true,
      duplicate: true,
      lead: {
        id: duplicateLead.id,
        name: duplicateLead.name,
        phone: duplicateLead.phone,
        createdAt: duplicateLead.createdAt,
      },
    });
  }

  const lead = await prisma.lead.create({
    data: {
      clientId: settings.clientId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      document,
      documentType,
      state: parsed.data.state.toUpperCase(),
      addressLine: parsed.data.addressLine || null,
      status: "CREATED",
      utmSource: parsed.data.utm_source || null,
      utmMedium: parsed.data.utm_medium || null,
      utmCampaign: parsed.data.utm_campaign || null,
      utmContent: parsed.data.utm_content || null,
      utmTerm: parsed.data.utm_term || null,
      fbclid: parsed.data.fbclid || null,
      history: {
        create: {
          previousStatus: null,
          nextStatus: "CREATED",
          notes: "Lead recebida pela landing page.",
        },
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  return json({
    ok: true,
    lead,
  });
}
