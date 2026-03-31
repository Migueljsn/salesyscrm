const statusLabels: Record<string, string> = {
  // Lead statuses
  CREATED: "Nova lead",
  "CONTATO FEITO": "Contato feito",
  "SEM RESPOSTA": "Sem resposta",
  "TENTATIVA 2": "Tentativa 2",
  "TENTATIVA 3": "Tentativa 3",
  CADASTRADO: "Cadastrado",
  "VENDA REALIZADA": "Venda realizada",
  // Lead qualification
  "LEAD QUALIFICADA": "Lead qualificada",
  "NAO QUALIFICADA": "Não qualificada",
  // Sale statuses
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  DRAFT: "Rascunho",
  PENDING_CONFIRMATION: "Aguardando confirmação",
  EXPIRED: "Expirado",
  // Tracking statuses
  SENT: "Enviado",
  FAILED: "Falha",
  SKIPPED: "Ignorado",
  PENDENTE: "Pendente",
  // Profile change statuses
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  PENDING: "Pendente",
  // Inbox statuses
  RESOLVED: "Resolvido",
  DISMISSED: "Arquivado",
  OPEN: "Aberto",
  // Inbox types
  PROFILE_CHANGE_PENDING: "Mudança de perfil",
  TRACKING_ERROR: "Erro de rastreio",
  FOLLOW_UP_DUE: "Follow-up pendente",
  CUSTOMER_AT_RISK: "Cliente em risco",
  CUSTOMER_REACTIVATION_DUE: "Reativação",
  // Customer intelligence
  CAMPEAO: "Campeão",
  FIEL: "Fiel",
  EM_RISCO: "Em risco",
  INATIVO: "Inativo",
  NOVO_COMPRADOR: "Novo comprador",
};

export function StatusPill({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const tone =
    status === "VENDA REALIZADA" ||
    status === "CONFIRMED" ||
    status === "APPROVED" ||
    status === "SENT" ||
    status === "RESOLVED" ||
    status === "LEAD QUALIFICADA" ||
    status === "CAMPEAO"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/20"
      : status === "CONTATO FEITO" ||
          status === "PENDING_CONFIRMATION" ||
          status === "PENDING" ||
          status === "FOLLOW_UP_DUE" ||
          status === "PROFILE_CHANGE_PENDING" ||
          status === "OPEN" ||
          status === "FIEL"
        ? "bg-sky-500/15 text-sky-200 border-sky-500/20"
        : status === "FAILED" ||
            status === "CANCELLED" ||
            status === "EXPIRED" ||
            status === "REJECTED" ||
            status === "TRACKING_ERROR" ||
            status === "CUSTOMER_REACTIVATION_DUE" ||
            status === "INATIVO"
          ? "bg-red-500/15 text-red-200 border-red-500/20"
          : status === "SKIPPED" ||
              status === "NAO QUALIFICADA" ||
              status === "DISMISSED" ||
              status === "NOVO_COMPRADOR"
            ? "bg-stone-600/30 text-stone-300 border-stone-600/40"
            : status === "CUSTOMER_AT_RISK" || status === "EM_RISCO"
              ? "bg-amber-500/15 text-amber-200 border-amber-500/20"
            : "bg-stone-700/40 text-stone-200 border-stone-600";

  const label = statusLabels[status] ?? status;

  return (
    <span
      className={`inline-flex rounded-full border font-medium ${compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"} ${tone}`}
    >
      {label}
    </span>
  );
}
