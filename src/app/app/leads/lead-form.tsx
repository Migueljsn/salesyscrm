"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { createLeadAction, type LeadActionState } from "./actions";
import { leadStatuses } from "@/lib/lead-status";
import { getDocumentLabel } from "@/lib/document";
import {
  formatCurrencyInput,
  formatDocument,
  formatPhone,
  formatState,
} from "@/lib/masks";

const initialState: LeadActionState = {};

type ClientOption = {
  id: string;
  name: string;
};

export function LeadForm({
  clients,
  isAdmin,
  defaultClientId,
}: {
  clients: ClientOption[];
  isAdmin: boolean;
  defaultClientId?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    createLeadAction,
    initialState,
  );
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [conversionValue, setConversionValue] = useState("");
  const [stateValue, setStateValue] = useState("");
  const documentTypePlaceholder = useMemo(() => {
    return getDocumentLabel(document);
  }, [document]);

  return (
    <form action={formAction} className="grid gap-4">
      {isAdmin ? (
        <label className="grid gap-2">
          <span className="text-sm text-stone-300">Cliente</span>
          <select
            name="clientId"
            defaultValue={defaultClientId ?? ""}
            className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
            required
          >
            <option value="" disabled>
              Selecione um cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome" name="name" placeholder="Nome da lead" required />
        <Field
          label="Telefone"
          name="phone"
          placeholder="(99) 99999-9999"
          required
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(value) => setPhone(formatPhone(value))}
        />
        <Field
          label="Documento"
          name="document"
          placeholder="CPF ou CNPJ"
          inputMode="numeric"
          value={document}
          onChange={(value) => setDocument(formatDocument(value))}
        />
        <label className="grid gap-2">
          <span className="text-sm text-stone-300">Tipo do documento</span>
          <div className="flex h-12 items-center rounded-2xl border border-stone-700 bg-stone-950/80 px-4 text-sm font-medium text-stone-200">
            {document ? documentTypePlaceholder : "CPF/CNPJ detectado automaticamente"}
          </div>
          <input
            type="hidden"
            name="documentType"
            value={documentTypePlaceholder.toLowerCase() === "documento" ? "" : documentTypePlaceholder.toLowerCase()}
          />
        </label>
        <Field
          label="UF"
          name="state"
          placeholder="PI"
          maxLength={2}
          value={stateValue}
          onChange={(value) => setStateValue(formatState(value))}
        />
        <Field
          label="Valor de conversao"
          name="conversionValue"
          placeholder="1490,00"
          inputMode="numeric"
          value={conversionValue}
          onChange={(value) => setConversionValue(formatCurrencyInput(value))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm text-stone-300">Status inicial</span>
          <select
            name="status"
            defaultValue="CREATED"
            className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
          >
            {leadStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Endereco"
          name="addressLine"
          placeholder="Rua, bairro, cidade"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="UTM Source" name="utmSource" placeholder="facebook" />
        <Field label="UTM Medium" name="utmMedium" placeholder="cpc" />
        <Field label="UTM Campaign" name="utmCampaign" placeholder="campanha" />
        <Field label="UTM Content" name="utmContent" placeholder="criativo-a" />
        <Field label="UTM Term" name="utmTerm" placeholder="palavra-chave" />
        <Field label="FBCLID" name="fbclid" placeholder="fbclid" />
      </div>

      <label className="grid gap-2">
        <span className="text-sm text-stone-300">Observacoes</span>
        <textarea
          name="notes"
          rows={4}
          className="rounded-2xl border border-stone-700 bg-stone-950/80 px-4 py-3 outline-none focus:border-amber-400"
          placeholder="Notas sobre a lead"
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
        {isPending ? "Salvando..." : "Criar lead"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  maxLength,
  inputMode,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-stone-300">{label}</span>
      <input
        className="h-12 rounded-2xl border border-stone-700 bg-stone-950/80 px-4 outline-none focus:border-amber-400"
        name={name}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </label>
  );
}
