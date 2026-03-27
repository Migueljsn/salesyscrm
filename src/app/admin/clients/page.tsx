import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";
import { CreateClientModal } from "./create-client-modal";

export default async function AdminClientsPage() {
  const user = await requireAdmin();
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "CLIENT" },
        select: {
          email: true,
        },
        take: 1,
      },
    },
  });

  return (
    <AppShell
      eyebrow="Admin"
      title="Clientes"
      description="Crie novos clientes da plataforma e acompanhe a base ativa."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Base de clientes
          </p>
              <p className="mt-2 text-sm text-stone-300">
                Acesse cada cliente para entrar na operacao dele sem misturar dados.
              </p>
            </div>
            <CreateClientModal />
          </div>

          <div className="mt-5 grid gap-4">
            {clients.length === 0 ? (
              <EmptyState
                title="Sem clientes cadastrados"
                description="Os novos clientes criados pelo admin aparecerao aqui."
              />
            ) : (
              clients.map((client) => (
                <article
                  key={client.id}
                  className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-5 transition hover:border-stone-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-lg font-semibold text-stone-100 underline-offset-4 transition hover:text-amber-200 hover:underline"
                      >
                        {client.name}
                      </Link>
                      <p className="mt-1 text-sm text-stone-400">
                        {client.users[0]?.email ?? "-"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        client.isActive
                          ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-200"
                          : "border-red-500/20 bg-red-500/15 text-red-200"
                      }`}
                    >
                      {client.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <InfoRow label="Nome" value={client.name} />
                    <InfoRow
                      label="Criado em"
                      value={formatDateTime(client.createdAt)}
                    />
                    <InfoRow
                      label="Status"
                      value={client.isActive ? "Ativo" : "Inativo"}
                    />
                  </div>

                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-800 bg-stone-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-3 text-sm text-stone-100">{value}</p>
    </div>
  );
}
