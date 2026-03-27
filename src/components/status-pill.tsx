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
    status === "APPROVED"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/20"
      : status === "CONTATO FEITO" ||
          status === "PENDING_CONFIRMATION" ||
          status === "PENDING" ||
          status === "FOLLOW_UP_DUE"
        ? "bg-sky-500/15 text-sky-200 border-sky-500/20"
          : status === "FAILED" ||
            status === "CANCELLED" ||
            status === "EXPIRED" ||
            status === "REJECTED"
          ? "bg-red-500/15 text-red-200 border-red-500/20"
          : "bg-stone-700/40 text-stone-200 border-stone-600";

  return (
    <span
      className={`inline-flex rounded-full border font-medium ${compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"} ${tone}`}
    >
      {status}
    </span>
  );
}
