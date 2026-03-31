"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { X, Plus } from "lucide-react";
import { LeadForm } from "./lead-form";

type ClientOption = {
  id: string;
  name: string;
};

export function CreateLeadModal({
  clients,
  isAdmin,
  defaultClientId,
}: {
  clients: ClientOption[];
  isAdmin: boolean;
  defaultClientId?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-2xl bg-amber-300 px-4 font-semibold text-stone-950 transition hover:bg-amber-200"
        >
          <Plus size={16} />
          Cadastro manual
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-900 shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-5 md:px-6">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
                  Nova lead
                </p>
                <Dialog.Title className="mt-2 text-2xl font-semibold">
                  Cadastro manual
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-stone-300">
                  Use este formulário para inserir leads manualmente sem sair da
                  tela de operação.
                </Dialog.Description>
              </div>

              <Dialog.Close className="rounded-xl border border-stone-700 p-2 text-stone-400 transition hover:border-stone-500 hover:text-stone-200">
                <X size={14} />
              </Dialog.Close>
            </div>

            <div className="overflow-y-auto px-5 py-5 md:px-6">
              <LeadForm
                clients={clients}
                isAdmin={isAdmin}
                defaultClientId={defaultClientId}
              />
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
