import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#31220b_0%,#15100b_34%,#090806_72%,#050404_100%)] px-6 py-14 text-stone-50">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_60%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl items-center gap-10 xl:grid-cols-[minmax(0,1.1fr)_480px]">
        <section className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.32em] text-amber-300">
            WPP Purchase CRM
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-50 md:text-5xl">
            Login seguro para operar leads, vendas e confirmações pós-venda.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-300">
            Entre com o acesso da sua empresa para acompanhar leads, gerar links
            de confirmação e registrar conversões no mesmo fluxo operacional.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-stone-800 bg-stone-900/45 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                Preenchimento
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                O navegador pode preencher email e senha automaticamente. O sistema
                também pode lembrar o último email usado neste dispositivo.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-stone-800 bg-stone-900/45 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                Acesso
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Admin e cliente entram pela mesma porta. O escopo e as permissões
                são carregados depois da autenticação.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full rounded-[2.25rem] border border-stone-800 bg-stone-900/82 p-8 shadow-2xl shadow-black/35 backdrop-blur md:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300">
            Acesso ao painel
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Entrar no sistema
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            Use o email e a senha configurados para sua conta. O preenchimento
            automático já está preparado para agilizar os próximos acessos.
          </p>

          <LoginForm />
        </section>
      </div>
    </main>
  );
}
