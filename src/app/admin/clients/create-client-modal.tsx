"use client";

import { useEffect, useState } from "react";
import { CreateClientForm } from "./create-client-form";

export function CreateClientModal() {
  const [isOpen, setIsOpen] = useState(false);

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
        onClick={() => setIsOpen(true)}
        className="h-11 rounded-2xl bg-amber-300 px-4 font-semibold text-stone-950"
      >
        Criar cliente
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-900 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-5 md:px-6">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
                  Novo cliente
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Criar acesso do cliente</h2>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  O sistema cria empresa, configuracao inicial, usuario e login no
                  Supabase Auth em uma unica operacao.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-stone-700 px-3 py-2 text-sm text-stone-200 transition hover:border-stone-500 hover:bg-stone-800"
                aria-label="Fechar criacao de cliente"
              >
                Fechar
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 md:px-6">
              <CreateClientForm />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
