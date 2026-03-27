import { AppShell } from "@/components/app-shell";
import { LoadingPanel } from "@/components/loading-panel";

export default function Loading() {
  return (
    <AppShell
      eyebrow="Carregando"
      title="Carregando aguarde"
      description="Estamos preparando a visao autenticada do CRM."
      role="CLIENT"
      userName="Carregando..."
      userEmail="aguarde@carregando.local"
    >
      <LoadingPanel description="Estamos buscando leads, vendas, tarefas e metricas desta conta." />
    </AppShell>
  );
}
