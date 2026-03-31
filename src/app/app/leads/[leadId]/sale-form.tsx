"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { createSaleAction } from "./sale-actions";
import type { SaleActionState } from "@/lib/sales";
import { formatCurrencyInput, formatPhone } from "@/lib/masks";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CustomerSalesSummary } from "@/lib/leads";

const initialState: SaleActionState = {};

export function SaleForm({
  leadId,
  defaultName,
  defaultPhone,
  defaultAddress,
  customerSalesSummary,
}: {
  leadId: string;
  defaultName: string;
  defaultPhone: string;
  defaultAddress?: string | null;
  customerSalesSummary?: CustomerSalesSummary | null;
}) {
  const [state, formAction, isPending] = useActionState(
    createSaleAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement | null>(null);
  const [buyerPhone, setBuyerPhone] = useState(defaultPhone);
  const [totalValue, setTotalValue] = useState("");
  const [isRepeatSaleModalOpen, setIsRepeatSaleModalOpen] = useState(false);
  const [confirmRepeatSale, setConfirmRepeatSale] = useState(false);
  const shouldConfirmRepeatSale =
    (customerSalesSummary?.confirmedSalesCount ?? 0) > 0;

  useEffect(() => {
    if (confirmRepeatSale && !isRepeatSaleModalOpen) {
      formRef.current?.requestSubmit();
    }
  }, [confirmRepeatSale, isRepeatSaleModalOpen]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!shouldConfirmRepeatSale) {
      return;
    }

    if (confirmRepeatSale) {
      return;
    }

    event.preventDefault();
    setIsRepeatSaleModalOpen(true);
  }

  function handleRepeatSaleConfirm() {
    if (!formRef.current) {
      return;
    }

    setConfirmRepeatSale(true);
    setIsRepeatSaleModalOpen(false);
  }

  function handleRepeatSaleCancel() {
    setConfirmRepeatSale(false);
    setIsRepeatSaleModalOpen(false);
  }

  return (
    <>
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="grid gap-4"
    >
      <input type="hidden" name="leadId" value={leadId} />
      <input
        type="hidden"
        name="confirmRepeatSale"
        value={confirmRepeatSale ? "true" : "false"}
      />

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

      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-300">
        Ao registrar a venda, o sistema confirma internamente o fechamento,
        atualiza a lead para <strong className="text-stone-100">VENDA REALIZADA</strong>{" "}
        e dispara o <strong className="text-stone-100">Purchase</strong> no backend.
      </div>

      {shouldConfirmRepeatSale ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          Este cliente ja possui{" "}
          <strong className="text-amber-50">
            {customerSalesSummary?.confirmedSalesCount} venda(s)
          </strong>{" "}
          registrada(s). Se voce continuar, o sistema vai somar esta nova compra ao
          historico e ao LTV.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Registrando venda..." : "Registrar venda"}
      </button>
    </form>
    {isRepeatSaleModalOpen && customerSalesSummary ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div className="w-full max-w-lg rounded-[2rem] border border-stone-800 bg-stone-950 p-6 shadow-2xl shadow-black/50">
          <p className="text-sm uppercase tracking-[0.22em] text-amber-300">
            Recompra
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-100">
            Este cliente ja tem vendas registradas
          </h3>
          <p className="mt-4 text-sm leading-6 text-stone-300">
            Tem certeza que deseja adicionar uma nova venda? Isso fara com que as
            vendas deste cliente sejam somadas ao historico e ao LTV.
          </p>

          <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-300 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                Compras anteriores
              </p>
              <p className="mt-2 text-base font-semibold text-stone-100">
                {customerSalesSummary.confirmedSalesCount}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                Valor acumulado
              </p>
              <p className="mt-2 text-base font-semibold text-stone-100">
                {formatCurrency(customerSalesSummary.totalConfirmedValue)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                Ultima compra
              </p>
              <p className="mt-2 text-base font-semibold text-stone-100">
                {customerSalesSummary.lastConfirmedSaleAt
                  ? formatDateTime(customerSalesSummary.lastConfirmedSaleAt)
                  : "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRepeatSaleCancel}
              className="h-12 flex-1 rounded-2xl border border-stone-700 px-5 font-semibold text-stone-100 transition hover:border-stone-500 hover:bg-stone-900"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleRepeatSaleConfirm}
              className="h-12 flex-1 rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950 transition hover:bg-amber-200"
            >
              Confirmar e registrar
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
