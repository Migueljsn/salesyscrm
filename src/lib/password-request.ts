import crypto from "node:crypto";

function getCipherKey() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptRequestedPassword(password: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getCipherKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptRequestedPassword(payload: string) {
  const [ivBase64, authTagBase64, encryptedBase64] = payload.split(".");

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Payload de senha invalido.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getCipherKey(),
    Buffer.from(ivBase64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
