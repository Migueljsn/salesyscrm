"use client";

import { useActionState } from "react";
import {
  retrySaleTrackingAction,
  type RetrySaleTrackingState,
} from "./sale-actions";

const initialState: RetrySaleTrackingState = {};

export function RetrySaleTrackingForm({
  saleId,
  disabled,
}: {
  saleId: string;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    retrySaleTrackingAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="saleId" value={saleId} />

      {state.error ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || isPending}
        className="rounded-2xl border border-stone-700 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Reprocessando..." : "Reprocessar Purchase"}
      </button>
    </form>
  );
}
