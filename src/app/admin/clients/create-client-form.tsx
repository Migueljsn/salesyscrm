"use client";

import { useActionState } from "react";
import { createClientAction, type CreateClientState } from "./actions";

const initialState: CreateClientState = {};

export function CreateClientForm() {
  const [state, formAction, isPending] = useActionState(
    createClientAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Nome da empresa</span>
        <input
          name="companyName"
          placeholder="Rio Piranhas"
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Email de acesso</span>
        <input
          type="email"
          name="email"
          placeholder="cliente@empresa.com"
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Senha inicial</span>
        <input
          type="text"
          name="password"
          placeholder="Senha inicial do cliente"
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
          <p className="font-semibold">{state.success}</p>
          {state.credentials ? (
            <div className="mt-3 grid gap-1 text-emerald-50">
              <p>Empresa: {state.credentials.companyName}</p>
              <p>Email: {state.credentials.email}</p>
              <p>Senha: {state.credentials.password}</p>
              <p>Lead capture key: {state.credentials.leadCaptureKey}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Criando cliente..." : "Criar cliente"}
      </button>
    </form>
  );
}
