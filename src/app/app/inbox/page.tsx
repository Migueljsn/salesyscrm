import { InboxItemStatus } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { InboxContextLink } from "./inbox-context-link";
import {
  dismissInboxItemAction,
  resolveInboxItemAction,
} from "./actions";

export default async function InboxPage() {
  const user = await requireUser();
  const now = new Date();
  const openItems = await prisma.inboxItem.findMany({
    where: {
      audience: user.role,
      status: InboxItemStatus.OPEN,
      OR: [{ visibleFrom: null }, { visibleFrom: { lte: now } }],
      ...(user.role === "CLIENT" ? { clientId: user.clientId ?? "__none__" } : {}),
    },
    orderBy: [
      { dueAt: "asc" },
      { createdAt: "desc" },
    ],
  });

  const historyItems = await prisma.inboxItem.findMany({
    where: {
      audience: user.role,
      status: {
        in: [InboxItemStatus.RESOLVED, InboxItemStatus.DISMISSED],
      },
      ...(user.role === "CLIENT" ? { clientId: user.clientId ?? "__none__" } : {}),
    },
    orderBy: {
      resolvedAt: "desc",
    },
    take: 12,
  });

  return (
    <AppShell
      eyebrow={user.role === "ADMIN" ? "Notificacoes" : "Tarefas"}
      title={user.role === "ADMIN" ? "Caixa de notificacoes" : "Caixa de tarefas"}
      description={
        user.role === "ADMIN"
          ? "Pendencias administrativas e alertas relevantes da plataforma."
          : "Pendencias operacionais do cliente e acoes que exigem acompanhamento."
      }
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
                Abertos
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {openItems.length} item(ns) pendente(s)
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {openItems.length === 0 ? (
              <EmptyState
                title="Caixa vazia"
                description="Nao ha pendencias abertas neste momento."
              />
            ) : (
              openItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-stone-100">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-stone-300">
                        {item.description || "Sem descricao adicional."}
                      </p>
                    </div>
                    <StatusPill status={item.type} compact />
                  </div>

                  <div className="mt-4 grid gap-1 text-xs text-stone-500">
                    <p>Criado em {formatDateTime(item.createdAt)}</p>
                    {item.dueAt ? <p>Vence em {formatDateTime(item.dueAt)}</p> : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {getItemHref(user.role, item) ? (
                      <InboxContextLink
                        itemId={item.id}
                        href={getItemHref(user.role, item)!}
                        className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
                      >
                        Abrir contexto
                      </InboxContextLink>
                    ) : null}
                    <form action={resolveInboxItemAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/20"
                      >
                        Concluir
                      </button>
                    </form>
                    <form action={dismissInboxItemAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-2xl border border-stone-700 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                      >
                        Arquivar
                      </button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Historico
          </p>
          <div className="mt-5 grid gap-4">
            {historyItems.length === 0 ? (
              <EmptyState
                title="Sem historico ainda"
                description="Os itens resolvidos ou arquivados aparecerao aqui."
              />
            ) : (
              historyItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-stone-100">
                      {item.title}
                    </h2>
                    <StatusPill status={item.status} compact />
                  </div>
                  <p className="mt-3 text-sm text-stone-400">
                    {item.description || "Sem descricao adicional."}
                  </p>
                  <p className="mt-3 text-xs text-stone-500">
                    {item.resolvedAt
                      ? `Resolvido em ${formatDateTime(item.resolvedAt)}`
                      : `Criado em ${formatDateTime(item.createdAt)}`}
                  </p>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function getItemHref(
  role: "ADMIN" | "CLIENT",
  item: {
    clientId: string | null;
    leadId: string | null;
    saleId: string | null;
    profileChangeRequestId: string | null;
    type: string;
  },
) {
  if (role === "ADMIN") {
    if (item.type === "PROFILE_CHANGE_PENDING") {
      return "/admin";
    }

    if (item.clientId) {
      return `/admin/clients/${item.clientId}`;
    }
  }

  if (item.leadId) {
    return `/app/leads/${item.leadId}`;
  }

  return null;
}
