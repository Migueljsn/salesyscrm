import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import {
  buildWhatsAppUrl,
  getCustomerSalesSummaryForLead,
  getLeadScope,
  getScopedLeadById,
} from "@/lib/leads";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { LeadStatusForm } from "../status-form";
import { LeadNotesForm } from "../notes-form";
import { DeleteLeadModal } from "../delete-lead-modal";
import { QualifyLeadForm } from "../qualify-lead-form";
import { SaleForm } from "./sale-form";
import { RetrySaleTrackingForm } from "./retry-sale-tracking-form";

function toDateTimeLocalValue(value?: Date | string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const [{ user }, { leadId }] = await Promise.all([getLeadScope(), params]);
  const lead = await getScopedLeadById(leadId);

  if (!lead) {
    notFound();
  }

  const customerSalesSummary = await getCustomerSalesSummaryForLead({
    clientId: lead.clientId,
    phone: lead.phone,
    document: lead.document,
  });

  const leadWhatsappUrl = buildWhatsAppUrl(lead.phone);

  return (
    <AppShell
      eyebrow="Lead"
      title={lead.name}
      description="Detalhe operacional da lead, com historico comercial e base pronta para evoluir para venda."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-6">
          <article className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard label="Telefone" value={lead.phone} />
              <InfoCard label="Documento" value={lead.document || "-"} />
              <InfoCard label="UF" value={lead.state || "-"} />
              <StatusInfoCard label="Status atual" value={lead.status} />
              <InfoCard
                label="Lead qualificada"
                value={lead.isQualified ? "Sim" : "Nao"}
              />
              <InfoCard
                label="Valor"
                value={formatCurrency(
                  lead.sales[0]?.totalValue?.toString() ??
                    lead.conversionValue?.toString(),
                )}
              />
              <InfoCard label="Criada em" value={formatDateTime(lead.createdAt)} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoCard label="Cliente" value={lead.client.name} />
              <InfoCard
                label="Responsavel"
                value={lead.assignedTo?.fullName || "Nao atribuido"}
              />
              <InfoCard
                label="Proximo contato"
                value={lead.nextContactAt ? formatDateTime(lead.nextContactAt) : "-"}
              />
              <InfoCard
                label="Qualificada em"
                value={lead.qualifiedAt ? formatDateTime(lead.qualifiedAt) : "-"}
              />
              <InfoCard
                label="Qualificada por"
                value={lead.qualifiedBy?.fullName || "-"}
              />
            </div>

            {leadWhatsappUrl ? (
              <div className="mt-6">
                <a
                  href={leadWhatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/20"
                >
                  Abrir conversa no WhatsApp
                </a>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
                Origem
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard label="UTM Source" value={lead.utmSource || "-"} />
                <InfoCard label="UTM Medium" value={lead.utmMedium || "-"} />
                <InfoCard label="UTM Campaign" value={lead.utmCampaign || "-"} />
                <InfoCard label="UTM Content" value={lead.utmContent || "-"} />
                <InfoCard label="UTM Term" value={lead.utmTerm || "-"} />
                <InfoCard label="FBCLID" value={lead.fbclid || "-"} />
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Historico
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Linha do tempo</h2>

            <div className="mt-6 grid gap-4">
              {lead.history.length === 0 ? (
                <EmptyState
                  title="Sem historico"
                  description="Os movimentos de status desta lead aparecerao aqui conforme a operacao avancar."
                />
              ) : (
                lead.history.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300">
                        {entry.previousStatus || "INICIO"}
                      </span>
                      <span className="text-stone-500">→</span>
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
                        {entry.nextStatus}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-stone-300">
                      {entry.notes || "Sem observacao neste movimento."}
                    </p>
                    <p className="mt-3 text-xs text-stone-500">
                      {formatDateTime(entry.createdAt)} ·{" "}
                      {entry.changedBy?.fullName || "Sistema"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Vendas
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Resumo atual</h2>
            {lead.sales.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Sem venda vinculada"
                  description="Registre a primeira venda para confirmar internamente e disparar o Purchase no backend."
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {lead.sales.map((sale) => {
                  return (
                  <div
                    key={sale.id}
                    className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-100">
                          {formatCurrency(sale.totalValue.toString())}
                        </p>
                        <div className="mt-2">
                          <StatusPill status={sale.status} />
                        </div>
                      </div>
                      <p className="text-xs text-stone-500">
                        {formatDateTime(sale.createdAt)}
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoCard label="Comprador" value={sale.buyerName} />
                      <InfoCard label="Telefone" value={sale.buyerPhone} />
                      <InfoCard label="Endereco" value={sale.buyerAddress || "-"} />
                      <InfoCard
                        label="Confirmada em"
                        value={sale.confirmedAt ? formatDateTime(sale.confirmedAt) : "-"}
                      />
                    </div>
                    <div className="mt-4 rounded-[1.25rem] border border-stone-800 bg-stone-900/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                            Tracking
                          </p>
                          <div className="mt-3">
                            <StatusPill
                              status={sale.trackingStatus || "PENDENTE"}
                              compact
                            />
                          </div>
                        </div>
                        <div className="text-sm text-stone-400">
                          <p>
                            Ultimo envio:{" "}
                            <span className="text-stone-200">
                              {sale.trackingSentAt
                                ? formatDateTime(sale.trackingSentAt)
                                : "-"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {sale.trackingError ? (
                        <div className="mt-4 rounded-[1rem] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                          <p className="font-semibold text-red-100">
                            Falha no envio do Purchase
                          </p>
                          <p className="mt-2 leading-6">{sale.trackingError}</p>
                        </div>
                      ) : null}

                      {sale.trackingResponse ? (
                        <details className="mt-4 rounded-[1rem] border border-stone-800 bg-stone-950/60 p-4">
                          <summary className="cursor-pointer text-sm font-semibold text-stone-200">
                            Ver resposta do tracking
                          </summary>
                          <pre className="mt-3 overflow-x-auto text-xs leading-6 text-stone-400">
                            {JSON.stringify(sale.trackingResponse, null, 2)}
                          </pre>
                        </details>
                      ) : null}

                      <div className="mt-4">
                        <RetrySaleTrackingForm
                          saleId={sale.id}
                          disabled={sale.status !== "CONFIRMED"}
                        />
                      </div>
                    </div>
                    {sale.items.length > 0 ? (
                      <div className="mt-4 rounded-[1.25rem] border border-stone-800 bg-stone-900/50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                          Itens
                        </p>
                        <ul className="mt-3 grid gap-2 text-sm text-stone-200">
                          {sale.items.map((item) => (
                            <li key={item.id}>• {item.description}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Qualificacao
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Lead Qualificada</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Estado atual
                </p>
                <div className="mt-3">
                  <StatusPill
                    status={lead.isQualified ? "LEAD QUALIFICADA" : "NAO QUALIFICADA"}
                    compact
                  />
                </div>
                <div className="mt-4 grid gap-2 text-sm text-stone-300">
                  <p>
                    Qualificada em:{" "}
                    {lead.qualifiedAt ? formatDateTime(lead.qualifiedAt) : "-"}
                  </p>
                  <p>Responsavel: {lead.qualifiedBy?.fullName || "-"}</p>
                  <p>
                    Tracking: {lead.qualifiedTrackingStatus || "PENDENTE"}
                  </p>
                  <p>
                    Enviado em:{" "}
                    {lead.qualifiedTrackingSentAt
                      ? formatDateTime(lead.qualifiedTrackingSentAt)
                      : "-"}
                  </p>
                </div>
              </div>

              {lead.qualifiedTrackingError ? (
                <div className="rounded-[1.25rem] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  <p className="font-semibold text-red-100">
                    Falha no envio de QualifiedLead
                  </p>
                  <p className="mt-2 leading-6">{lead.qualifiedTrackingError}</p>
                </div>
              ) : null}

              {lead.qualifiedTrackingResponse ? (
                <details className="rounded-[1.25rem] border border-stone-800 bg-stone-950/60 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-stone-200">
                    Ver resposta do tracking
                  </summary>
                  <pre className="mt-3 overflow-x-auto text-xs leading-6 text-stone-400">
                    {JSON.stringify(lead.qualifiedTrackingResponse, null, 2)}
                  </pre>
                </details>
              ) : null}

              {!lead.isQualified ? <QualifyLeadForm leadId={lead.id} /> : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Venda
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Registrar venda</h2>
            {lead.isQualified ? (
              <div className="mt-5">
                <SaleForm
                  leadId={lead.id}
                  defaultName={lead.name}
                  defaultPhone={lead.phone}
                  defaultAddress={lead.addressLine}
                  customerSalesSummary={customerSalesSummary}
                />
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4 text-sm leading-6 text-stone-300">
                A venda so pode ser registrada depois que esta lead for marcada
                como <strong className="text-stone-100">Lead Qualificada</strong>.
                Use o card de qualificacao acima para liberar esta etapa.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Status
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Atualizar jornada</h2>
            <div className="mt-5">
              <LeadStatusForm
                leadId={lead.id}
                currentStatus={lead.status}
                currentNextContactAt={toDateTimeLocalValue(lead.nextContactAt)}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Observacoes
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Contexto comercial</h2>
            <div className="mt-5">
              <LeadNotesForm leadId={lead.id} notes={lead.notes} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Zona de risco
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Excluir lead</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Use esta opcao apenas quando a lead tiver sido criada incorretamente ou
              nao deva mais existir no CRM.
            </p>
            <div className="mt-5">
              <DeleteLeadModal leadId={lead.id} leadName={lead.name} />
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-3 text-sm leading-6 text-stone-100 break-words">{value}</p>
    </div>
  );
}

function StatusInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <div className="mt-3">
        <StatusPill status={value} compact />
      </div>
    </div>
  );
}
