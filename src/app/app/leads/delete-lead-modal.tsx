"use client";

import { useActionState, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { X, Trash2 } from "lucide-react";
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
    if (state.error) {
      // keep modal open on error so user sees the message
    }
  }, [state]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open) setConfirmationText("");
      setIsOpen(open);
    }}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={
            buttonClassName ??
            "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20"
          }
        >
          {buttonLabel}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-stone-800 bg-stone-900 shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-5 md:px-6">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-red-200">
                  Exclusão
                </p>
                <Dialog.Title className="mt-2 text-2xl font-semibold">
                  Confirmar exclusão
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-stone-300">
                  Esta ação remove a lead <strong>{leadName}</strong> e seus dados
                  relacionados. Para continuar, digite <strong>EXCLUIR</strong>.
                </Dialog.Description>
              </div>

              <Dialog.Close className="rounded-xl border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200">
                <X size={14} />
              </Dialog.Close>
            </div>

            <form action={formAction} className="grid gap-4 px-5 py-5 md:px-6">
              <input type="hidden" name="leadId" value={leadId} />

              <label className="grid gap-2">
                <span className="text-sm text-stone-300">
                  Digite a frase de confirmação
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
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-2xl border border-stone-700 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={confirmationText !== "EXCLUIR" || isPending}
                  className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  {isPending ? "Excluindo..." : "Confirmar exclusão"}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
