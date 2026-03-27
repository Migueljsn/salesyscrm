"use client";

import { useActionState } from "react";
import {
  regenerateLeadCaptureKeyAction,
  type RegenerateLeadCaptureKeyState,
  type UpdateClientSettingsState,
  updateClientSettingsByAdminAction,
} from "./actions";

const initialSettingsState: UpdateClientSettingsState = {};
const initialRegenerateState: RegenerateLeadCaptureKeyState = {};

export function EditClientSettingsForm({
  clientId,
  leadCaptureKey,
  pixelId,
  metaAccessToken,
  metaTestEventCode,
  purchaseTrackingEnabled,
}: {
  clientId: string;
  leadCaptureKey: string;
  pixelId?: string | null;
  metaAccessToken?: string | null;
  metaTestEventCode?: string | null;
  purchaseTrackingEnabled: boolean;
}) {
  const [settingsState, settingsAction, isSaving] = useActionState(
    updateClientSettingsByAdminAction,
    initialSettingsState,
  );
  const [regenerateState, regenerateAction, isRegenerating] = useActionState(
    regenerateLeadCaptureKeyAction,
    initialRegenerateState,
  );

  const currentLeadCaptureKey = regenerateState.leadCaptureKey ?? leadCaptureKey;

  return (
    <div className="grid gap-5">
      <form action={settingsAction} className="grid gap-5">
        <input type="hidden" name="clientId" value={clientId} />

        <div className="grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm text-stone-300">Lead capture key</span>
            <input
              name="leadCaptureKey"
              defaultValue={currentLeadCaptureKey}
              key={currentLeadCaptureKey}
              className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
              required
            />
          </label>

          <button
            formAction={regenerateAction}
            type="submit"
            disabled={isRegenerating}
            className="h-12 rounded-2xl border border-stone-700 px-4 font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRegenerating ? "Gerando..." : "Regenerar chave"}
          </button>
        </div>

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

        {settingsState.error ? (
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {settingsState.error}
          </p>
        ) : null}

        {settingsState.success ? (
          <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {settingsState.success}
          </p>
        ) : null}

        {regenerateState.error ? (
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {regenerateState.error}
          </p>
        ) : null}

        {regenerateState.success ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <p className="font-semibold">{regenerateState.success}</p>
            {regenerateState.leadCaptureKey ? (
              <p className="mt-2 break-all">{regenerateState.leadCaptureKey}</p>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="h-12 rounded-2xl bg-amber-300 px-4 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Salvando..." : "Salvar configuracoes"}
        </button>
      </form>
    </div>
  );
}
