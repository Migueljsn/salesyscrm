import { headers } from "next/headers";

function parseForwardedIp(value?: string | null) {
  if (!value) {
    return null;
  }

  const [firstIp] = value.split(",").map((part) => part.trim()).filter(Boolean);

  return firstIp || null;
}

export async function getRequestClientContext() {
  const requestHeaders = await headers();

  return {
    clientIpAddress:
      parseForwardedIp(requestHeaders.get("x-forwarded-for")) ??
      requestHeaders.get("x-real-ip"),
    clientUserAgent: requestHeaders.get("user-agent"),
  };
}
