"use client";

import { useActionState } from "react";
import {
  resetClientPasswordAction,
  type ResetPasswordState,
} from "./actions";

const initialState: ResetPasswordState = {};

export function ResetClientPasswordForm({ clientId }: { clientId: string }) {
  const [state, formAction, isPending] = useActionState(
    resetClientPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="clientId" value={clientId} />

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Nova senha</span>
        <input
          type="text"
          name="password"
          placeholder="Nova senha do cliente"
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
          {state.password ? <p className="mt-2">Senha: {state.password}</p> : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-2xl border border-stone-700 px-4 font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Redefinindo..." : "Resetar senha"}
      </button>
    </form>
  );
}
