"use client";

import { useActionState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CheckCircle2, X } from "lucide-react";
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
  const shownRef = useRef<string | undefined>(undefined);

  // On success, the parent page revalidates and unmounts this component
  // (lead.isQualified becomes true, so the parent stops rendering QualifyLeadForm).
  // The Dialog closes naturally when unmounted.
  // On error, the Dialog stays open so the user can retry.
  // We only call toast here — which is not a React setState and is not flagged.
  useEffect(() => {
    if (state.success && state.success !== shownRef.current) {
      shownRef.current = state.success;
      toast.success(state.success);
    }
    if (state.error && state.error !== shownRef.current) {
      shownRef.current = state.error;
      toast.error(state.error);
    }
  }, [state.success, state.error]);

  return (
    // Uncontrolled Dialog: Radix manages open/close internally.
    // Close/Cancel buttons use Dialog.Close. Escape key works automatically.
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Marcar como Lead Qualificada
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-stone-800 bg-stone-950 p-6 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-amber-300">
                  Qualificação
                </p>
                <Dialog.Title className="mt-2 text-2xl font-semibold text-stone-100">
                  Confirmar qualificação
                </Dialog.Title>
              </div>
              <Dialog.Close className="rounded-xl border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200">
                <X size={14} />
              </Dialog.Close>
            </div>

            <Dialog.Description className="mt-4 text-sm leading-6 text-stone-300">
              Ao qualificar esta lead, o sistema registra o marco no histórico e
              envia o evento <strong className="text-stone-100">QualifiedLead</strong> para
              o Meta via Conversions API. Esta ação não pode ser desfeita pela
              interface.
            </Dialog.Description>

            <div className="mt-5 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-stone-300">
              <p className="font-semibold text-amber-200">Critérios de qualificação</p>
              <ul className="mt-2 grid gap-1 text-stone-400">
                <li>• Respondeu no WhatsApp</li>
                <li>• Demonstrou intenção real de compra</li>
                <li>• Passou pelo filtro de produto/oferta</li>
                <li>• Entrou em negociação</li>
              </ul>
            </div>

            <form action={formAction} className="mt-6 grid gap-3">
              <input type="hidden" name="leadId" value={leadId} />

              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="h-12 flex-1 rounded-2xl border border-stone-700 px-5 font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-900"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <CheckCircle2 size={16} />
                  {isPending ? "Qualificando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
