"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
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

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="saleId" value={saleId} />
      <button
        type="submit"
        disabled={disabled || isPending}
        className="flex items-center gap-2 rounded-2xl border border-stone-700 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Reprocessando..." : "Reprocessar Purchase"}
      </button>
    </form>
  );
}
