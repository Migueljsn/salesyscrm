"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
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

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Observações internas</span>
        <textarea
          name="notes"
          rows={5}
          defaultValue={notes ?? ""}
          className="rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 outline-none focus:border-amber-400"
          placeholder="Negociação, objeções, próximo passo..."
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-2xl border border-stone-700 px-4 font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800 disabled:opacity-70"
      >
        {isPending ? "Salvando..." : "Salvar observações"}
      </button>
    </form>
  );
}
