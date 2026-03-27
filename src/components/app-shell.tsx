import Link from "next/link";
import { ReactNode } from "react";
import { logoutAction } from "@/app/login/actions";
import { InboxMenu } from "@/components/inbox-menu";

type AppShellProps = {
  title: string;
  eyebrow: string;
  description?: string;
  role: "ADMIN" | "CLIENT";
  userName: string;
  userEmail: string;
  clientName?: string | null;
  children: ReactNode;
};

export function AppShell({
  title,
  eyebrow,
  description,
  role,
  userName,
  userEmail,
  clientName,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-stone-950 px-4 py-6 text-stone-50 md:px-6 md:py-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-stone-800 bg-stone-900/70 p-5 lg:sticky lg:top-6 lg:h-fit">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
            Fonil Sales System
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{userName}</h2>
          <p className="mt-1 text-sm text-stone-400">{userEmail}</p>
          {role === "ADMIN" ? (
            <p className="mt-1 text-sm text-stone-400">
              {clientName ?? "Acesso global"}
            </p>
          ) : null}

          <nav className="mt-8 grid gap-2 text-sm">
            <NavLink href="/app">Visão geral</NavLink>
            {role === "CLIENT" ? <NavLink href="/app/leads">Leads</NavLink> : null}
            <NavLink href={role === "ADMIN" ? "/admin/reports" : "/app/reports"}>
              Relatorios
            </NavLink>
            <NavLink href="/app/profile">Meu perfil</NavLink>
            {role === "CLIENT" ? (
              <NavLink href="/app/settings">
                Configuracoes
              </NavLink>
            ) : null}
            {role === "ADMIN" ? (
              <>
                <NavLink href="/admin">Admin</NavLink>
                <NavLink href="/admin/clients">Clientes</NavLink>
              </>
            ) : null}
          </nav>

          <form action={logoutAction} className="mt-8">
            <button
              type="submit"
              className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm font-medium text-stone-200 transition hover:border-stone-500 hover:bg-stone-800"
            >
              Sair
            </button>
          </form>
        </aside>

        <section className="min-w-0">
          <header className="rounded-[2rem] border border-stone-800 bg-stone-900/60 px-6 py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-amber-300">
                  {eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
                {description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
                    {description}
                  </p>
                ) : null}
              </div>

              <InboxMenu />
            </div>
          </header>

          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-2xl px-4 py-3 text-stone-200 transition hover:bg-stone-800 hover:text-white"
    >
      {children}
    </Link>
  );
}
