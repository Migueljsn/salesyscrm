import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireUser();

  if (user.role !== "CLIENT" || !user.clientId) {
    return (
      <AppShell
        eyebrow="Configuracoes"
        title="Configuracoes do cliente"
        role={user.role}
        userName={user.fullName}
        userEmail={user.email}
        clientName={user.client?.name}
      >
        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6 text-sm text-stone-300">
          Esta area de configuracoes esta disponivel apenas para usuarios de cliente.
        </section>
      </AppShell>
    );
  }

  const settings = await prisma.clientSettings.findUnique({
    where: { clientId: user.clientId },
  });

  return (
    <AppShell
      eyebrow="Configuracoes"
      title="Captura e tracking"
      description="Aqui o cliente define a chave da landing page e prepara a configuracao de Purchase para a Meta."
      role={user.role}
      userName={user.fullName}
      userEmail={user.email}
      clientName={user.client?.name}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Integracoes
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Landing page + Meta</h2>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            A landing page deve enviar a chave de captura abaixo. Os campos de
            pixel e token ja ficam salvos para a proxima etapa do Purchase.
          </p>

          <div className="mt-6">
            <SettingsForm
              leadCaptureKey={settings?.leadCaptureKey ?? ""}
              pixelId={settings?.pixelId}
              metaAccessToken={settings?.metaAccessToken}
              metaTestEventCode={settings?.metaTestEventCode}
              purchaseTrackingEnabled={settings?.purchaseTrackingEnabled ?? false}
            />
          </div>
        </section>

        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/60 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Payload esperado
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[1.5rem] border border-stone-800 bg-stone-950/70 p-4 text-xs leading-6 text-stone-300">
{`{
  "leadCaptureKey": "...",
  "name": "Nome",
  "phone": "5511999999999",
  "document": "12345678900",
  "documentType": "cpf",
  "state": "PI",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "campanha",
  "utm_content": "criativo",
  "utm_term": "termo",
  "fbclid": "..."
}`}
          </pre>
        </aside>
      </div>
    </AppShell>
  );
}
