"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteLeadAction, type LeadActionState } from "./actions";

const initialState: LeadActionState = {};

export function DeleteLeadModal({
  leadId,
  leadName,
  buttonLabel = "Excluir lead",
  buttonClassName,
}: {
  leadId: string;
  leadName: string;
  buttonLabel?: string;
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [state, formAction, isPending] = useActionState(
    deleteLeadAction,
    initialState,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConfirmationText("");
          setIsOpen(true);
        }}
        className={
          buttonClassName ??
          "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20"
        }
      >
        {buttonLabel}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-900 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-5 md:px-6">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-red-200">
                  Exclusao
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Confirmar exclusao</h2>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Esta acao remove a lead <strong>{leadName}</strong> e seus dados
                  relacionados. Para continuar, digite <strong>EXCLUIR</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfirmationText("");
                  setIsOpen(false);
                }}
                className="rounded-full border border-stone-700 px-3 py-2 text-sm text-stone-200 transition hover:border-stone-500 hover:bg-stone-800"
                aria-label="Fechar confirmacao de exclusao"
              >
                Fechar
              </button>
            </div>

            <form action={formAction} className="grid gap-4 px-5 py-5 md:px-6">
              <input type="hidden" name="leadId" value={leadId} />

              <label className="grid gap-2">
                <span className="text-sm text-stone-300">
                  Digite a frase de confirmacao
                </span>
                <input
                  name="confirmationText"
                  value={confirmationText}
                  onChange={(event) => setConfirmationText(event.target.value)}
                  placeholder="EXCLUIR"
                  className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-red-400"
                />
              </label>

              {state.error ? (
                <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {state.error}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationText("");
                    setIsOpen(false);
                  }}
                  className="rounded-2xl border border-stone-700 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={confirmationText !== "EXCLUIR" || isPending}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Excluindo..." : "Confirmar exclusao"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
