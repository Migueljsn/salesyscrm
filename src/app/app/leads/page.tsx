import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getConfirmedSalesMetrics,
  listScopedLeads,
  getLeadScope,
} from "@/lib/leads";
import { leadStatuses } from "@/lib/lead-status";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { buildWhatsAppUrl } from "@/lib/leads";
import { ExternalLink, MessageCircle, Filter, Search } from "lucide-react";
import { CreateLeadModal } from "./create-lead-modal";
import { DeleteLeadModal } from "./delete-lead-modal";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;

  const { user } = await getLeadScope();
  const [leads, clients] = await Promise.all([
    listScopedLeads(search, status),
    user.role === "ADMIN"
      ? prisma.client.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <AppShell
      eyebrow="Leads"
      title="Operação de leads"
      description="Cadastre leads manualmente, acompanhe o status comercial e prepare a base para o fluxo de venda."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-5">
          <div className="flex flex-col gap-4 border-b border-stone-800 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
                Lista
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Leads recentes</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
              <form className="grid gap-3 md:col-span-3 md:grid-cols-subgrid">
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    name="search"
                    defaultValue={search ?? ""}
                    placeholder="Buscar por nome, telefone ou documento"
                    className="h-11 w-full rounded-2xl border border-stone-700 bg-stone-950/80 pl-10 pr-4 outline-none focus:border-amber-400"
                  />
                </div>
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
                  className="flex h-11 items-center gap-2 rounded-2xl bg-stone-800 px-4 font-semibold text-stone-100 transition hover:bg-stone-700"
                >
                  <Filter size={14} />
                  Filtrar
                </button>
              </form>

              <CreateLeadModal
                clients={clients}
                isAdmin={user.role === "ADMIN"}
                defaultClientId={user.clientId}
              />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="mt-5 grid gap-4 md:hidden">
            {leads.length === 0 ? (
              <EmptyState
                title="Nenhuma lead encontrada"
                description="Ajuste os filtros ou crie uma nova lead manualmente para alimentar a operação."
              />
            ) : (
              leads.map((lead) =>
                (() => {
                  const metrics = getConfirmedSalesMetrics(lead.sales);
                  const leadValue =
                    metrics.totalConfirmedValue
                      ? metrics.totalConfirmedValue
                      : lead.conversionValue?.toString();
                  const whatsappUrl = buildWhatsAppUrl(lead.phone);

                  return (
                    <article
                      key={lead.id}
                      className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-stone-100">{lead.name}</p>
                          <p className="text-sm text-stone-400">
                            {lead.document || "Documento não informado"}
                          </p>
                        </div>
                        <StatusPill status={lead.status} />
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-stone-300">
                        <p>Cliente: {lead.client.name}</p>
                        <p>Qtd compras: {metrics.confirmedSalesCount}</p>
                        <p>Valor: {formatCurrency(leadValue)}</p>
                        <p>Criada em: {formatDateTime(lead.createdAt)}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/app/leads/${lead.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                        >
                          <ExternalLink size={11} />
                          Abrir
                        </Link>
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/20"
                          >
                            <MessageCircle size={11} />
                            WhatsApp
                          </a>
                        ) : null}
                        <DeleteLeadModal
                          leadId={lead.id}
                          leadName={lead.name}
                          buttonLabel="Excluir"
                          buttonClassName="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20"
                        />
                      </div>
                    </article>
                  );
                })()
              )
            )}
          </div>

          {/* Desktop table */}
          <div className="mt-5 hidden overflow-hidden rounded-[1.5rem] border border-stone-800 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-950/80 text-stone-400">
                  <tr>
                    <HeaderCell>Lead</HeaderCell>
                    <HeaderCell>Status</HeaderCell>
                    <HeaderCell>Cliente</HeaderCell>
                    <HeaderCell>Qtd compras</HeaderCell>
                    <HeaderCell>Valor</HeaderCell>
                    <HeaderCell>Criada em</HeaderCell>
                    <HeaderCell></HeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10">
                        <EmptyState
                          title="Nenhuma lead encontrada"
                          description="Ajuste os filtros ou crie uma nova lead manualmente para alimentar a operação."
                        />
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) =>
                      (() => {
                        const metrics = getConfirmedSalesMetrics(lead.sales);
                        const leadValue =
                          metrics.totalConfirmedValue
                            ? metrics.totalConfirmedValue
                            : lead.conversionValue?.toString();
                        const whatsappUrl = buildWhatsAppUrl(lead.phone);

                        return (
                          <tr
                            key={lead.id}
                            className="border-t border-stone-800 bg-stone-900/30"
                          >
                            <td className="px-4 py-4">
                              <p className="font-medium text-stone-100">{lead.name}</p>
                              <p className="text-stone-400">
                                {lead.document || "Documento não informado"}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <StatusPill status={lead.status} />
                            </td>
                            <td className="px-4 py-4 text-stone-300">
                              {lead.client.name}
                            </td>
                            <td className="px-4 py-4 text-stone-300">
                              {metrics.confirmedSalesCount}
                            </td>
                            <td className="px-4 py-4 text-stone-300">
                              {formatCurrency(leadValue)}
                            </td>
                            <td className="px-4 py-4 text-stone-300">
                              {formatDateTime(lead.createdAt)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {whatsappUrl ? (
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/20"
                                  >
                                    <MessageCircle size={11} />
                                    WhatsApp
                                  </a>
                                ) : null}
                                <Link
                                  href={`/app/leads/${lead.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                                >
                                  <ExternalLink size={11} />
                                  Abrir
                                </Link>
                                <DeleteLeadModal
                                  leadId={lead.id}
                                  leadName={lead.name}
                                  buttonLabel="Excluir"
                                  buttonClassName="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })()
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function HeaderCell({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
