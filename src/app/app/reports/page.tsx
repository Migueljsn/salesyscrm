import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { requireUser } from "@/lib/auth";
import { getReportData } from "@/lib/analytics";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { leadStatuses } from "@/lib/lead-status";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "30d";
  const status = typeof params.status === "string" ? params.status : undefined;

  const report = await getReportData({
    clientId: user.role === "CLIENT" ? user.clientId : undefined,
    period,
    status,
  });

  return (
    <AppShell
      eyebrow="Relatorios"
      title="Desempenho da operacao"
      description="Filtros por periodo e status para acompanhar volume, conversao e faturamento confirmado."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <section className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-5">
        <form className="grid gap-3 md:grid-cols-[220px_220px_auto]">
          <select
            name="period"
            defaultValue={period}
            className="h-11 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          >
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
            <option value="90d">Ultimos 90 dias</option>
          </select>

          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-11 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          >
            <option value="">Todos os status</option>
            {leadStatuses.map((leadStatus) => (
              <option key={leadStatus} value={leadStatus}>
                {leadStatus}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-11 rounded-2xl bg-amber-300 px-4 font-semibold text-stone-950"
          >
            Atualizar relatorio
          </button>
        </form>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="Leads" value={report.leads.length} />
        <MetricCard label="Vendas confirmadas" value={report.confirmedSales.length} />
        <MetricCard
          label="Conversao"
          value={`${report.conversionRate.toFixed(1)}%`}
        />
        <MetricCard
          label="Faturamento"
          value={formatCurrency(report.confirmedRevenue)}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Breakdown por status
          </p>
          <div className="mt-5 grid gap-3">
            {report.statusBreakdown.length === 0 ? (
              <EmptyState
                title="Sem dados"
                description="Nenhuma lead encontrada para o periodo e status selecionados."
              />
            ) : (
              report.statusBreakdown.map((entry) => (
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
            Ultimas vendas
          </p>
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-stone-800">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-950/80 text-stone-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Lead</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10"
                      >
                        <EmptyState
                          title="Nenhuma venda encontrada"
                          description="Tente ampliar o periodo ou remover o filtro de status."
                        />
                      </td>
                    </tr>
                  ) : (
                    report.sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-t border-stone-800 bg-stone-900/30"
                      >
                        <td className="px-4 py-4 text-stone-100">{sale.lead.name}</td>
                        <td className="px-4 py-4 text-stone-300">{sale.client.name}</td>
                        <td className="px-4 py-4 text-stone-300">
                          <StatusPill status={sale.status} compact />
                        </td>
                        <td className="px-4 py-4 text-stone-300">
                          {formatCurrency(sale.totalValue.toString())}
                        </td>
                        <td className="px-4 py-4 text-stone-300">
                          {formatDateTime(sale.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
