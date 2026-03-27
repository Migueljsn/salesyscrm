"use client";

import { useState } from "react";
import { useActionState } from "react";
import { leadStatuses } from "@/lib/lead-status";
import { updateLeadStatusAction, type LeadActionState } from "./actions";

const initialState: LeadActionState = {};

export function LeadStatusForm({
  leadId,
  currentStatus,
  currentNextContactAt,
}: {
  leadId: string;
  currentStatus: string;
  currentNextContactAt?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateLeadStatusAction,
    initialState,
  );
  const [nextContactAt, setNextContactAt] = useState(currentNextContactAt ?? "");

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Novo status</span>
        <select
          name="status"
          defaultValue={currentStatus}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
        >
          {leadStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Observacao do movimento</span>
        <textarea
          name="notes"
          rows={3}
          className="rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 outline-none focus:border-amber-400"
          placeholder="Ex.: confirmou interesse, pediu novo retorno, venda fechada..."
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Proximo contato</span>
        <input
          type="datetime-local"
          name="nextContactAt"
          value={nextContactAt}
          onChange={(event) => setNextContactAt(event.target.value)}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
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
        className="h-11 rounded-2xl bg-amber-300 px-4 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-70"
      >
        {isPending ? "Atualizando..." : "Atualizar status"}
      </button>
    </form>
  );
}
