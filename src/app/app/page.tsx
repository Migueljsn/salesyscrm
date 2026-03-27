import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { getScopedDashboardMetrics } from "@/lib/analytics";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function AppPage() {
  const user = await requireUser();
  const metrics = await getScopedDashboardMetrics(
    user.role === "CLIENT" ? user.clientId : undefined,
  );

  return (
    <AppShell
      eyebrow="Visão geral"
      title={user.role === "ADMIN" ? "Painel administrativo" : "Painel do cliente"}
      description="Base autenticada do CRM com escopo por perfil. A partir daqui o sistema ja opera leads de forma segura."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Leads" value={metrics.leadCount} />
        <MetricCard label="Vendas" value={metrics.saleCount} />
        <MetricCard
          label="Confirmadas"
          value={metrics.confirmedSaleCount}
          helper={`${metrics.conversionRate.toFixed(1)}% de conversao`}
        />
        <MetricCard
          label="Faturamento"
          value={formatCurrency(metrics.confirmedRevenue)}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Leads por status
          </p>
          <div className="mt-5 grid gap-3">
            {metrics.leadsByStatus.length === 0 ? (
              <EmptyState
                title="Sem leads ainda"
                description="Assim que os primeiros leads entrarem no funil, o panorama por status aparecera aqui."
              />
            ) : (
              metrics.leadsByStatus.map((entry) => (
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
          <div className="flex flex-col gap-2 border-b border-stone-800 pb-4">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Ultimas vendas
            </p>
            <p className="text-sm text-stone-300">
              {metrics.latestLead
                ? `Ultima lead criada: ${metrics.latestLead.name} em ${formatDateTime(metrics.latestLead.createdAt)}`
                : "Nenhuma lead criada ainda."}
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {metrics.recentSales.length === 0 ? (
              <EmptyState
                title="Sem vendas ainda"
                description="Quando uma lead virar venda, ela aparecera aqui como ultimo movimento comercial."
              />
            ) : (
              metrics.recentSales.map((sale) => (
                <article
                  key={sale.id}
                  className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-100">{sale.lead.name}</p>
                      <p className="text-sm text-stone-400">{sale.client.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-100">
                        {formatCurrency(sale.totalValue.toString())}
                      </p>
                      <div className="mt-2">
                        <StatusPill status={sale.status} compact />
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
