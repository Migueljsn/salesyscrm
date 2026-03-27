import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leadStatuses } from "@/lib/lead-status";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/leads";
import { CreateLeadModal } from "@/app/app/leads/create-lead-modal";
import { DeleteLeadModal } from "@/app/app/leads/delete-lead-modal";
import { EditClientAccountForm } from "../edit-client-account-form";
import { EditClientSettingsForm } from "../edit-client-settings-form";
import { ResetClientPasswordForm } from "../reset-client-password-form";
import { toggleClientStatusAction } from "../actions";

export default async function AdminClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdmin();
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const search = typeof query.search === "string" ? query.search : undefined;
  const status = typeof query.status === "string" ? query.status : undefined;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      users: {
        where: { role: "CLIENT" },
        select: {
          email: true,
        },
        take: 1,
      },
      settings: {
        select: {
          leadCaptureKey: true,
          pixelId: true,
          metaAccessToken: true,
          metaTestEventCode: true,
          purchaseTrackingEnabled: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const leads = await prisma.lead.findMany({
    where: {
      clientId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { document: { contains: search } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    },
    include: {
      sales: {
        select: {
          totalValue: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AppShell
      eyebrow="Admin"
      title={client.name}
      description="Operacao isolada do cliente para navegacao das leads e acesso rapido ao contexto da conta."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <div className="grid gap-8 min-[1700px]:grid-cols-[minmax(0,1fr)_380px] min-[1700px]:items-start">
      <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-6 lg:p-7">
        <div className="grid gap-6 border-b border-stone-800 pb-6 lg:pb-7">
          <div>
            <Link
              href="/admin/clients"
              className="text-sm text-stone-400 transition hover:text-stone-200"
            >
              ← Voltar para clientes
            </Link>
            <h2 className="mt-3 text-2xl font-semibold">{client.name}</h2>
            <div className="mt-3 grid gap-2 text-sm text-stone-400">
              <p>Email: {client.users[0]?.email ?? "-"}</p>
              <p>Criado em: {formatDateTime(client.createdAt)}</p>
              <p className="break-all">
                Lead capture key: {client.settings?.leadCaptureKey ?? "-"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 xl:max-w-4xl">
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_220px_auto]">
              <input
                type="text"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Buscar por nome, telefone ou documento"
                className="h-11 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
              />
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
                className="h-11 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 md:col-span-2 xl:col-span-1"
              >
                Filtrar
              </button>
            </form>

            <div className="justify-self-start">
              <CreateLeadModal clients={[client]} isAdmin defaultClientId={client.id} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:hidden">
          {leads.length === 0 ? (
            <EmptyState
              title="Nenhuma lead encontrada"
              description="Ajuste os filtros ou crie uma lead manualmente neste cliente."
            />
          ) : (
            leads.map((lead) => {
              const leadValue =
                lead.sales[0]?.totalValue?.toString() ??
                lead.conversionValue?.toString();
              const whatsappUrl = buildWhatsAppUrl(lead.phone);

              return (
                <article
                  key={lead.id}
                  className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-100">{lead.name}</p>
                      <p className="text-sm text-stone-400">{lead.phone}</p>
                    </div>
                    <StatusPill status={lead.status} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-stone-300">
                    <p>Valor: {formatCurrency(leadValue)}</p>
                    <p>Criada em: {formatDateTime(lead.createdAt)}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/app/leads/${lead.id}`}
                      className="inline-flex rounded-full border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                    >
                      Abrir
                    </Link>
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/20"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                    <DeleteLeadModal
                      leadId={lead.id}
                      leadName={lead.name}
                      buttonLabel="Excluir"
                      buttonClassName="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20"
                    />
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[1.5rem] border border-stone-800 md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-950/80 text-stone-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Criada em</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10">
                      <EmptyState
                        title="Nenhuma lead encontrada"
                        description="Ajuste os filtros ou crie uma lead manualmente neste cliente."
                      />
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const leadValue =
                      lead.sales[0]?.totalValue?.toString() ??
                      lead.conversionValue?.toString();
                    const whatsappUrl = buildWhatsAppUrl(lead.phone);

                    return (
                      <tr
                        key={lead.id}
                        className="border-t border-stone-800 bg-stone-900/30"
                      >
                        <td className="px-4 py-4">
                          <p className="font-medium text-stone-100">{lead.name}</p>
                          <p className="text-stone-400">{lead.phone}</p>
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill status={lead.status} />
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
                                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/20"
                              >
                                WhatsApp
                              </a>
                            ) : null}
                            <Link
                              href={`/app/leads/${lead.id}`}
                              className="rounded-full border border-stone-700 px-3 py-2 text-xs font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                            >
                              Abrir
                            </Link>
                            <DeleteLeadModal
                              leadId={lead.id}
                              leadName={lead.name}
                              buttonLabel="Excluir"
                              buttonClassName="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="grid gap-8">
        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Conta
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Gestao do cliente</h2>
          <div className="mt-6 grid gap-3 text-sm text-stone-300">
            <p>Status atual: {client.isActive ? "Ativo" : "Inativo"}</p>
            <p>Email: {client.users[0]?.email ?? "-"}</p>
          </div>

          <form action={toggleClientStatusAction} className="mt-6">
            <input type="hidden" name="clientId" value={client.id} />
            <button
              type="submit"
              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                client.isActive
                  ? "border border-red-500/30 bg-red-500/10 text-red-100 hover:border-red-400/40 hover:bg-red-500/20"
                  : "bg-emerald-300 text-stone-950 hover:bg-emerald-200"
              }`}
            >
              {client.isActive ? "Inativar cliente" : "Reativar cliente"}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Dados da conta
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Editar cliente</h2>
          <div className="mt-6">
            <EditClientAccountForm
              clientId={client.id}
              companyName={client.name}
              email={client.users[0]?.email ?? ""}
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Credenciais
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Reset de senha</h2>
          <div className="mt-6">
            <ResetClientPasswordForm clientId={client.id} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/55 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Captura e tracking
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Configuracoes do cliente</h2>
          <div className="mt-6">
            <EditClientSettingsForm
              clientId={client.id}
              leadCaptureKey={client.settings?.leadCaptureKey ?? ""}
              pixelId={client.settings?.pixelId}
              metaAccessToken={client.settings?.metaAccessToken}
              metaTestEventCode={client.settings?.metaTestEventCode}
              purchaseTrackingEnabled={
                client.settings?.purchaseTrackingEnabled ?? false
              }
            />
          </div>
        </section>
      </aside>
      </div>
    </AppShell>
  );
}
