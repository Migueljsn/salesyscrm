"use client";

import { useActionState } from "react";
import {
  type ProfileRequestState,
  updateAdminPasswordAction,
} from "./actions";

const initialState: ProfileRequestState = {};

export function AdminPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updateAdminPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Nova senha</span>
        <input
          type="password"
          name="password"
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Confirmar nova senha</span>
        <input
          type="password"
          name="confirmPassword"
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
        className="h-12 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Atualizando..." : "Atualizar senha"}
      </button>
    </form>
  );
}
