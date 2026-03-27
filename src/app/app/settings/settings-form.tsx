"use client";

import { useActionState } from "react";
import {
  updateSettingsAction,
  type SettingsActionState,
} from "./actions";

const initialState: SettingsActionState = {};

export function SettingsForm({
  leadCaptureKey,
  pixelId,
  metaAccessToken,
  metaTestEventCode,
  purchaseTrackingEnabled,
}: {
  leadCaptureKey: string;
  pixelId?: string | null;
  metaAccessToken?: string | null;
  metaTestEventCode?: string | null;
  purchaseTrackingEnabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    updateSettingsAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Chave de captura de leads</span>
        <input
          name="leadCaptureKey"
          defaultValue={leadCaptureKey}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Pixel ID</span>
        <input
          name="pixelId"
          defaultValue={pixelId ?? ""}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          placeholder="Ex.: 123456789012345"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Meta Access Token</span>
        <textarea
          name="metaAccessToken"
          rows={4}
          defaultValue={metaAccessToken ?? ""}
          className="rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 outline-none focus:border-amber-400"
          placeholder="Cole o token da Conversions API"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Test Event Code</span>
        <input
          name="metaTestEventCode"
          defaultValue={metaTestEventCode ?? ""}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          placeholder="Opcional"
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-200">
        <input
          type="checkbox"
          name="purchaseTrackingEnabled"
          defaultChecked={purchaseTrackingEnabled}
          className="mt-1 h-4 w-4"
        />
        <span>Ativar disparo de Purchase pela configuracao deste cliente.</span>
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
        {isPending ? "Salvando..." : "Salvar configuracoes"}
      </button>
    </form>
  );
}
