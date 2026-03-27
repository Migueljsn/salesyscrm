"use client";

import { useActionState } from "react";
import {
  type UpdateClientAccountState,
  updateClientAccountAction,
} from "./actions";

const initialState: UpdateClientAccountState = {};

export function EditClientAccountForm({
  clientId,
  companyName,
  email,
}: {
  clientId: string;
  companyName: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateClientAccountAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="clientId" value={clientId} />

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Nome da empresa</span>
        <input
          type="text"
          name="companyName"
          defaultValue={companyName}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Email de acesso</span>
        <input
          type="email"
          name="email"
          defaultValue={email}
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
        <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-2xl bg-amber-300 px-4 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Salvando..." : "Salvar dados da conta"}
      </button>
    </form>
  );
}
