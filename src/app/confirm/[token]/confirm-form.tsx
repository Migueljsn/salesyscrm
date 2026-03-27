"use client";

import { useActionState } from "react";
import { confirmSaleAction } from "./actions";
import type { SaleActionState } from "@/lib/sales";

const initialState: SaleActionState = {};

export function ConfirmForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    confirmSaleAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex items-start gap-3 rounded-2xl border border-stone-700 bg-stone-950/70 p-4 text-sm leading-6 text-stone-200">
        <input
          type="checkbox"
          name="accepted"
          className="mt-1 h-4 w-4 rounded border-stone-500"
        />
        <span>
          Confirmo que os itens, o valor e os dados desta compra estao corretos.
        </span>
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
        disabled={isPending || Boolean(state.success)}
        className="h-12 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state.success
          ? "Compra confirmada"
          : isPending
            ? "Confirmando..."
            : "Confirmar compra"}
      </button>
    </form>
  );
}
