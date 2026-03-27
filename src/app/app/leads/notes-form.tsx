"use client";

import { useActionState } from "react";
import { updateLeadNotesAction, type LeadActionState } from "./actions";

const initialState: LeadActionState = {};

export function LeadNotesForm({
  leadId,
  notes,
}: {
  leadId: string;
  notes?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateLeadNotesAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Observacoes internas</span>
        <textarea
          name="notes"
          rows={5}
          defaultValue={notes ?? ""}
          className="rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 outline-none focus:border-amber-400"
          placeholder="Negociacao, objecoes, proximo passo..."
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-2xl border border-stone-700 px-4 font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800 disabled:opacity-70"
      >
        {isPending ? "Salvando..." : "Salvar observacoes"}
      </button>
    </form>
  );
}
