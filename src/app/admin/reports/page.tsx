import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { getReportData } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "30d";
  const status = typeof params.status === "string" ? params.status : undefined;

  const [report, clients] = await Promise.all([
    getReportData({ period, status }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  const clientCards = await Promise.all(
    clients.map(async (client) => {
      const clientReport = await getReportData({
        clientId: client.id,
        period,
        status,
      });

      return {
        ...client,
        leadCount: clientReport.leads.length,
        confirmedSales: clientReport.confirmedSales.length,
        confirmedRevenue: clientReport.confirmedRevenue,
        conversionRate: clientReport.conversionRate,
      };
    }),
  );

  return (
    <AppShell
      eyebrow="Admin"
      title="Relatorios por cliente"
      description="Consolidado global da plataforma com acesso ao detalhamento individual de cada cliente."
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
            <option value="CREATED">CREATED</option>
            <option value="EM ANALISE">EM ANALISE</option>
            <option value="CONTATO FEITO">CONTATO FEITO</option>
            <option value="VENDA REALIZADA">VENDA REALIZADA</option>
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
        <MetricCard label="Conversao" value={`${report.conversionRate.toFixed(1)}%`} />
        <MetricCard label="Faturamento" value={formatCurrency(report.confirmedRevenue)} />
      </section>

      <section className="mt-6 rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
          Clientes
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clientCards.length === 0 ? (
            <EmptyState
              title="Sem clientes cadastrados"
              description="Crie clientes para gerar relatorios individuais."
            />
          ) : (
            clientCards.map((client) => (
              <article
                key={client.id}
                className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-5"
              >
                <h2 className="text-lg font-semibold text-stone-100">{client.name}</h2>
                <p className="mt-1 text-sm text-stone-500">{client.slug}</p>
                <div className="mt-5 grid gap-2 text-sm text-stone-300">
                  <p>{client.leadCount} lead(s)</p>
                  <p>{client.confirmedSales} venda(s) confirmada(s)</p>
                  <p>{formatCurrency(client.confirmedRevenue)}</p>
                  <p>{client.conversionRate.toFixed(1)}% de conversao</p>
                </div>
                <Link
                  href={`/admin/reports/${client.id}?period=${period}${status ? `&status=${encodeURIComponent(status)}` : ""}`}
                  className="mt-5 inline-flex rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
                >
                  Ver relatorio do cliente
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
