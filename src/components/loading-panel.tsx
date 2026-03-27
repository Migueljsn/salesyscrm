export function LoadingPanel({
  eyebrow = "Carregando",
  title = "Carregando aguarde",
  description = "Estamos buscando as informacoes mais recentes para montar esta tela.",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-stone-800 bg-stone-900/70 p-8 text-stone-50 shadow-2xl shadow-black/20">
      <p className="text-xs uppercase tracking-[0.28em] text-amber-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">
        {title}
        <span className="loading-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
        {description}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-5"
          >
            <div className="h-3 w-24 rounded-full bg-stone-800/90" />
            <div className="mt-4 h-8 w-20 rounded-full bg-stone-800/80" />
            <div className="mt-5 h-3 w-full rounded-full bg-stone-900" />
            <div className="mt-2 h-3 w-3/4 rounded-full bg-stone-900" />
          </div>
        ))}
      </div>
    </div>
  );
}
