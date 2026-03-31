"use client";

import { useActionState } from "react";
import { qualifyLeadAction, type LeadActionState } from "./actions";

const initialState: LeadActionState = {};

export function QualifyLeadForm({
  leadId,
  disabled,
}: {
  leadId: string;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    qualifyLeadAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="leadId" value={leadId} />

      {state.error ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || isPending}
        className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Marcando..." : "Marcar como Lead Qualificada"}
      </button>
    </form>
  );
}
