"use client";

import { useState } from "react";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};
const cachedEmailStorageKey = "crm:last-login-email";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(cachedEmailStorageKey) ?? "";
  });
  const [rememberEmail, setRememberEmail] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return Boolean(window.localStorage.getItem(cachedEmailStorageKey));
  });

  function handleSubmit() {
    if (rememberEmail) {
      window.localStorage.setItem(cachedEmailStorageKey, email.trim());
      return;
    }

    window.localStorage.removeItem(cachedEmailStorageKey);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="mt-8 grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-stone-200">Email</span>
        <input
          className="h-13 rounded-2xl border border-stone-700 bg-stone-950/70 px-4 text-stone-50 outline-none transition placeholder:text-stone-500 focus:border-amber-400"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@empresa.com"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-stone-200">Senha</span>
        <div className="flex h-13 overflow-hidden rounded-2xl border border-stone-700 bg-stone-950/70 transition focus-within:border-amber-400">
          <input
            className="min-w-0 flex-1 px-4 text-stone-50 outline-none placeholder:text-stone-500"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Sua senha"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="px-4 text-sm font-medium text-stone-300 transition hover:bg-stone-800 hover:text-white"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm text-stone-300">
        <input
          type="checkbox"
          checked={rememberEmail}
          onChange={(event) => setRememberEmail(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          Lembrar email neste navegador para preenchimento automático no próximo acesso.
        </span>
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 h-13 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
