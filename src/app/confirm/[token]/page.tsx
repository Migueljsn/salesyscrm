import { notFound } from "next/navigation";
import {
  ConfirmationLinkStatus,
  SaleStatus,
} from "@prisma/client";
import { getSaleConfirmationByToken, isConfirmationExpired } from "@/lib/sales";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ConfirmForm } from "./confirm-form";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await getSaleConfirmationByToken(token);

  if (!link) {
    notFound();
  }

  const expired = isConfirmationExpired(link.expiresAt);
  const alreadyUsed =
    link.status !== ConfirmationLinkStatus.ACTIVE ||
    link.sale.status === SaleStatus.CONFIRMED;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#120f0a,#080706)] px-4 py-10 text-stone-50">
      <section className="w-full max-w-2xl rounded-[2rem] border border-stone-800 bg-stone-900/80 p-6 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.28em] text-amber-300">
          Confirmacao de compra
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {link.sale.buyerName}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          Confira os dados abaixo e confirme a compra apenas se tudo estiver
          correto.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard label="Valor total" value={formatCurrency(link.sale.totalValue.toString())} />
          <InfoCard label="Telefone" value={link.sale.buyerPhone} />
          <InfoCard label="Endereco" value={link.sale.buyerAddress || "-"} />
          <InfoCard label="Criada em" value={formatDateTime(link.sale.createdAt)} />
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
            Itens
          </p>
          <ul className="mt-4 grid gap-3">
            {link.sale.items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-sm text-stone-200"
              >
                {item.description}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          {expired ? (
            <MessageBox tone="error" message="Este link expirou e nao pode mais ser usado." />
          ) : alreadyUsed ? (
            <MessageBox
              tone="success"
              message="Esta compra ja foi confirmada anteriormente."
            />
          ) : (
            <ConfirmForm token={token} />
          )}
        </section>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-800 bg-stone-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-3 text-sm leading-6 text-stone-100 break-words">{value}</p>
    </div>
  );
}

function MessageBox({
  tone,
  message,
}: {
  tone: "success" | "error";
  message: string;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : "border-red-500/40 bg-red-500/10 text-red-200";

  return <p className={`rounded-2xl border px-4 py-4 text-sm ${classes}`}>{message}</p>;
}
