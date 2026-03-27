import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { ProfileRequestForm } from "./profile-request-form";

export default async function ProfilePage() {
  const user = await requireUser();

  const requests = await prisma.profileChangeRequest.findMany({
    where: {
      requesterId: user.id,
    },
    include: {
      reviewer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  const pendingRequest = requests.find((request) => request.status === "PENDING");

  return (
    <AppShell
      eyebrow="Meu perfil"
      title="Alteracoes do usuario"
      description="As alteracoes do nome da empresa e do email de acesso ficam pendentes ate aprovacao de um administrador."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Dados atuais
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Nome da empresa</p>
              <p className="mt-3 text-sm text-stone-100">{user.fullName}</p>
            </article>
            <article className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Email</p>
              <p className="mt-3 text-sm text-stone-100">{user.email}</p>
            </article>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-stone-800 bg-stone-950/40 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Solicitar alteracao
            </p>
            {pendingRequest ? (
              <div className="mt-4 rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                Existe uma solicitacao pendente criada em{" "}
                {formatDateTime(pendingRequest.createdAt)}. Aguarde a analise do
                administrador antes de enviar outra.
              </div>
            ) : null}

            <div className="mt-5">
              <ProfileRequestForm
                fullName={user.fullName}
                email={user.email}
                disabled={Boolean(pendingRequest)}
              />
            </div>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Historico
          </p>
          <div className="mt-5 grid gap-4">
            {requests.length === 0 ? (
              <EmptyState
                title="Sem solicitacoes"
                description="As alteracoes de perfil enviadas por voce aparecerao aqui."
              />
            ) : (
              requests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill status={request.status} compact />
                    <p className="text-xs text-stone-500">
                      {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-stone-300">
                      <p>Empresa solicitada: {request.requestedFullName}</p>
                    <p>Email solicitado: {request.requestedEmail}</p>
                    {request.reviewer ? (
                      <p>Avaliado por: {request.reviewer.fullName}</p>
                    ) : null}
                    {request.rejectionReason ? (
                      <p>Motivo: {request.rejectionReason}</p>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
