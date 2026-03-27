export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-stone-800 bg-stone-900/50 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <h2 className="mt-3 text-4xl font-semibold">{value}</h2>
      {helper ? <p className="mt-3 text-sm text-stone-300">{helper}</p> : null}
    </article>
  );
}
