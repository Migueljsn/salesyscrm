"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createSaleAction } from "./sale-actions";
import type { SaleActionState } from "@/lib/sales";
import { formatCurrencyInput, formatPhone } from "@/lib/masks";

const initialState: SaleActionState = {};

export function SaleForm({
  leadId,
  defaultName,
  defaultPhone,
  defaultAddress,
}: {
  leadId: string;
  defaultName: string;
  defaultPhone: string;
  defaultAddress?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    createSaleAction,
    initialState,
  );
  const [buyerPhone, setBuyerPhone] = useState(defaultPhone);
  const [totalValue, setTotalValue] = useState("");

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="leadId" value={leadId} />

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Nome do comprador</span>
        <input
          name="buyerName"
          defaultValue={defaultName}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Telefone</span>
        <input
          name="buyerPhone"
          value={buyerPhone}
          onChange={(event) => setBuyerPhone(formatPhone(event.target.value))}
          inputMode="tel"
          autoComplete="tel"
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Endereco</span>
        <input
          name="buyerAddress"
          defaultValue={defaultAddress ?? ""}
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Valor total</span>
        <input
          name="totalValue"
          value={totalValue}
          onChange={(event) =>
            setTotalValue(formatCurrencyInput(event.target.value))
          }
          placeholder="1490,00"
          inputMode="numeric"
          className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Itens da venda</span>
        <textarea
          name="items"
          rows={5}
          className="rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 outline-none focus:border-amber-400"
          placeholder={"Produto A\nProduto B"}
          required
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Criando venda..." : "Criar venda e gerar link"}
      </button>
    </form>
  );
}
