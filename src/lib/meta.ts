import crypto from "node:crypto";
import type { ClientSettings, Lead, Sale, SaleItem } from "@prisma/client";

type MetaPurchaseInput = {
  sale: Sale & {
    items: SaleItem[];
    lead: Lead;
  };
  settings: ClientSettings;
  eventSourceUrl: string;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function splitName(fullName: string) {
  const normalized = normalizeName(fullName);
  const parts = normalized.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts[parts.length - 1] : null,
  };
}

function buildUserData({
  sale,
  clientIpAddress,
  clientUserAgent,
}: Pick<MetaPurchaseInput, "sale" | "clientIpAddress" | "clientUserAgent">) {
  const phone = normalizePhone(sale.buyerPhone);
  const { firstName, lastName } = splitName(sale.buyerName);

  return {
    ...(phone ? { ph: [sha256(phone)] } : {}),
    ...(firstName ? { fn: [sha256(firstName)] } : {}),
    ...(lastName ? { ln: [sha256(lastName)] } : {}),
    external_id: [sha256(sale.leadId)],
    ...(sale.lead.fbclid
      ? { fbc: `fb.1.${Math.floor(sale.createdAt.getTime() / 1000)}.${sale.lead.fbclid}` }
      : {}),
    ...(clientIpAddress ? { client_ip_address: clientIpAddress } : {}),
    ...(clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
  };
}

export async function sendMetaPurchaseEvent({
  sale,
  settings,
  eventSourceUrl,
  clientIpAddress,
  clientUserAgent,
}: MetaPurchaseInput) {
  if (
    !settings.purchaseTrackingEnabled ||
    !settings.pixelId ||
    !settings.metaAccessToken
  ) {
    return {
      ok: false,
      skipped: true,
      error: "Tracking desativado ou configuracao incompleta.",
    };
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: sale.metaEventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: buildUserData({ sale, clientIpAddress, clientUserAgent }),
        custom_data: {
          currency: sale.currency,
          value: Number(sale.totalValue),
          order_id: sale.id,
          content_name: sale.items.map((item) => item.description).join(", "),
          contents: sale.items.map((item) => ({
            id: item.id,
            quantity: 1,
            item_price: Number(sale.totalValue),
            title: item.description,
          })),
        },
      },
    ],
    ...(settings.metaTestEventCode
      ? { test_event_code: settings.metaTestEventCode }
      : {}),
  };

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${settings.pixelId}/events?access_token=${settings.metaAccessToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  let responseBody: unknown = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    const message =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "error" in responseBody
        ? JSON.stringify(responseBody)
        : `Meta returned ${response.status}`;

    return {
      ok: false,
      skipped: false,
      error: message,
      responseBody,
    };
  }

  return {
    ok: true,
    skipped: false,
    responseBody,
  };
}
