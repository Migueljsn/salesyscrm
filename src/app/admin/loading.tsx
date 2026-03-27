import { AppShell } from "@/components/app-shell";
import { LoadingPanel } from "@/components/loading-panel";

export default function Loading() {
  return (
    <AppShell
      eyebrow="Carregando"
      title="Carregando aguarde"
      description="Estamos preparando o painel administrativo."
      role="ADMIN"
      userName="Carregando..."
      userEmail="aguarde@carregando.local"
      clientName="Acesso global"
    >
      <LoadingPanel description="Estamos consolidando clientes, leads, vendas e pendencias administrativas." />
    </AppShell>
  );
}
