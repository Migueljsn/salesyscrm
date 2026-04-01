"use client";

import { useActionState } from "react";
import {
  submitProfileChangeRequest,
  type ProfileRequestState,
} from "./actions";

const initialState: ProfileRequestState = {};

export function ProfileRequestForm({
  fullName,
  email,
  disabled,
}: {
  fullName: string;
  email: string;
  disabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    submitProfileChangeRequest,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Nome da empresa</span>
        <input
          name="requestedFullName"
          defaultValue={fullName}
          disabled={disabled}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Email</span>
        <input
          type="email"
          name="requestedEmail"
          defaultValue={email}
          disabled={disabled}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Nova senha</span>
        <input
          type="password"
          name="requestedPassword"
          disabled={disabled}
          placeholder="Opcional, minimo 8 caracteres"
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
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
        disabled={disabled || isPending}
        className="h-12 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {disabled
          ? "Aguardando aprovacao"
          : isPending
            ? "Enviando..."
            : "Solicitar alteracao"}
      </button>
    </form>
  );
}
