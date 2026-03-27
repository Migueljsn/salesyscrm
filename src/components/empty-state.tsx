import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-stone-700 bg-stone-950/50 px-5 py-10 text-center">
      <p className="text-lg font-semibold text-stone-100">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-400">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-stone-950"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
