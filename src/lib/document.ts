export function getDocumentDigits(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

export function detectDocumentType(value?: string | null) {
  const digits = getDocumentDigits(value);

  if (digits.length === 11) {
    return "cpf";
  }

  if (digits.length === 14) {
    return "cnpj";
  }

  return null;
}

export function getDocumentLabel(value?: string | null) {
  const type = detectDocumentType(value);

  if (type === "cpf") {
    return "CPF";
  }

  if (type === "cnpj") {
    return "CNPJ";
  }

  return "Documento";
}
