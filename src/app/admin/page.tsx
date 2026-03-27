import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { getScopedDashboardMetrics } from "@/lib/analytics";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
} from "./profile-change-actions";

export default async function AdminPage() {
  const user = await requireAdmin();
  const dashboard = await getScopedDashboardMetrics();

  const [
    clientCount,
    userCount,
    leadCount,
    saleCount,
    recentClients,
    pendingProfileRequests,
    recentProfileRequests,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.user.count(),
    prisma.lead.count(),
    prisma.sale.count(),
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        _count: {
          select: {
            leads: true,
            users: true,
          },
        },
      },
    }),
    prisma.profileChangeRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        requester: {
          include: {
            client: true,
          },
        },
      },
      take: 10,
    }),
    prisma.profileChangeRequest.findMany({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"],
        },
      },
      orderBy: { reviewedAt: "desc" },
      include: {
        requester: {
          include: {
            client: true,
          },
        },
        reviewer: true,
      },
      take: 6,
    }),
  ]);

  return (
    <AppShell
      eyebrow="Admin"
      title="Visao inicial da plataforma"
      description="Monitoramento global da operacao, com contagem consolidada e clientes ativos na base."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Clientes" value={clientCount} />
        <MetricCard label="Usuarios" value={userCount} />
        <MetricCard label="Leads" value={leadCount} />
        <MetricCard label="Vendas" value={saleCount} />
        <MetricCard label="Confirmadas" value={dashboard.confirmedSaleCount} />
        <MetricCard
          label="Faturamento"
          value={formatCurrency(dashboard.confirmedRevenue)}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Leads por status
          </p>
          <div className="mt-5 grid gap-3">
            {dashboard.leadsByStatus.length === 0 ? (
              <EmptyState
                title="Sem leads ainda"
                description="O painel global exibira o funil assim que os clientes comecarem a gerar dados."
              />
            ) : (
              dashboard.leadsByStatus.map((entry) => (
                <div
                  key={entry.status}
                  className="rounded-[1.25rem] border border-stone-800 bg-stone-950/60 p-4"
                >
                  <StatusPill status={entry.status} compact />
                  <p className="mt-3 text-2xl font-semibold">{entry.count}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
          Clientes recentes
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentClients.length === 0 ? (
            <EmptyState
              title="Sem clientes cadastrados"
              description="Assim que novos clientes forem adicionados, eles aparecerao neste painel."
            />
          ) : (
            recentClients.map((client) => (
              <article
                key={client.id}
                className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-5"
              >
                <h2 className="text-lg font-semibold">{client.name}</h2>
                <p className="mt-1 text-sm text-stone-500">{client.slug}</p>
                <div className="mt-5 flex gap-3 text-sm text-stone-300">
                  <span>{client._count.users} usuario(s)</span>
                  <span>{client._count.leads} lead(s)</span>
                </div>
              </article>
            ))
          )}
        </div>
        </section>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
                Alteracoes de perfil pendentes
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Aprove ou recuse alteracoes de nome e email enviadas pelos clientes.
              </p>
            </div>
            <StatusPill status={`PENDENTES: ${pendingProfileRequests.length}`} compact />
          </div>

          <div className="mt-5 grid gap-4">
            {pendingProfileRequests.length === 0 ? (
              <EmptyState
                title="Nenhuma solicitacao pendente"
                description="As alteracoes de perfil enviadas pelos clientes aparecerao aqui para aprovacao."
              />
            ) : (
              pendingProfileRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-stone-100">
                        {request.requester.fullName}
                      </h2>
                      <p className="mt-1 text-sm text-stone-400">
                        {request.requester.client?.name ?? "Sem cliente"}
                      </p>
                    </div>
                    <StatusPill status={request.status} compact />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-300">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                        Dados atuais
                      </p>
                      <p className="mt-3">Nome: {request.currentFullName}</p>
                      <p className="mt-1">Email: {request.currentEmail}</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-300">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                        Dados solicitados
                      </p>
                      <p className="mt-3">Nome: {request.requestedFullName}</p>
                      <p className="mt-1">Email: {request.requestedEmail}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-stone-500">
                    Solicitado em {formatDateTime(request.createdAt)}
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)]">
                    <form action={approveProfileChangeRequest}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-emerald-200"
                      >
                        Aprovar alteracao
                      </button>
                    </form>

                    <form action={rejectProfileChangeRequest} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input
                        name="rejectionReason"
                        placeholder="Motivo da recusa"
                        className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 text-sm outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20"
                      >
                        Reprovar
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
            Ultimas decisoes
          </p>
          <div className="mt-5 grid gap-4">
            {recentProfileRequests.length === 0 ? (
              <EmptyState
                title="Sem aprovacoes ainda"
                description="As solicitacoes aprovadas ou recusadas aparecerao aqui."
              />
            ) : (
              recentProfileRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-stone-100">
                      {request.requester.fullName}
                    </h2>
                    <StatusPill status={request.status} compact />
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-stone-400">
                    <p>{request.requester.client?.name ?? "Sem cliente"}</p>
                    <p>{request.requestedEmail}</p>
                    {request.reviewer ? (
                      <p>Avaliado por {request.reviewer.fullName}</p>
                    ) : null}
                    {request.reviewedAt ? (
                      <p>{formatDateTime(request.reviewedAt)}</p>
                    ) : null}
                    {request.rejectionReason ? (
                      <p className="text-red-200">Motivo: {request.rejectionReason}</p>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
