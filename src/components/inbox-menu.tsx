"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type InboxSummaryItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  dueAt: string | null;
  clientId: string | null;
  leadId: string | null;
  saleId: string | null;
  profileChangeRequestId: string | null;
};

type InboxSummary = {
  openCount: number;
  unseenCount: number;
  role: "ADMIN" | "CLIENT";
  items: InboxSummaryItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getItemHref(role: "ADMIN" | "CLIENT", item: InboxSummaryItem) {
  if (role === "ADMIN") {
    if (item.type === "PROFILE_CHANGE_PENDING") {
      return "/admin";
    }

    if (item.clientId) {
      return `/admin/clients/${item.clientId}`;
    }
  }

  if (item.leadId) {
    return `/app/leads/${item.leadId}`;
  }

  return "/app/inbox";
}

export function InboxMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<InboxSummary | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      const response = await fetch("/api/inbox/summary", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as InboxSummary;

      if (!cancelled) {
        setSummary(data);
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleToggle() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
  }

  async function markItemAsViewed(itemId: string) {
    await fetch("/api/inbox/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId }),
      keepalive: true,
    }).catch(() => undefined);

    setSummary((current) => {
      if (!current) {
        return current;
      }

      const itemWasUnseen = current.items.some((item) => item.id === itemId);

      return {
        ...current,
        openCount: current.openCount > 0 ? current.openCount - 1 : 0,
        unseenCount:
          itemWasUnseen && current.unseenCount > 0
            ? current.unseenCount - 1
            : current.unseenCount,
        items: current.items.filter((item) => item.id !== itemId),
      };
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => void handleToggle()}
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-700 bg-stone-950/70 text-stone-100 transition hover:border-stone-500 hover:bg-stone-800"
        aria-label="Abrir notificacoes"
      >
        <span className="flex flex-col gap-1">
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
        </span>
        {summary?.unseenCount ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-amber-300 px-1.5 text-xs font-bold text-stone-950">
            {summary.unseenCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-14 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-[1.75rem] border border-stone-800 bg-stone-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <p className="text-sm font-semibold text-stone-100">
                {summary?.role === "ADMIN" ? "Notificacoes" : "Tarefas"}
              </p>
              <p className="text-xs text-stone-500">
                {summary?.openCount ?? 0} item(ns) em aberto
              </p>
            </div>
            <Link
              href="/app/inbox"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-amber-300 transition hover:text-amber-200"
            >
              Ver tudo
            </Link>
          </div>

          <div className="mt-3 grid gap-3">
            {summary?.items.length ? (
              summary.items.map((item) => (
                <Link
                  key={item.id}
                  href={getItemHref(summary.role, item)}
                  onClick={() => {
                    void markItemAsViewed(item.id);
                    setIsOpen(false);
                  }}
                  className="rounded-[1.25rem] border border-stone-800 bg-stone-950/70 p-4 transition hover:border-stone-700 hover:bg-stone-900"
                >
                  <p className="text-sm font-semibold text-stone-100">{item.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-400">
                    {item.description || "Sem descricao adicional."}
                  </p>
                  <div className="mt-3 grid gap-1 text-xs text-stone-500">
                    <p>{formatDate(item.createdAt)}</p>
                    {item.dueAt ? <p>Vence em {formatDate(item.dueAt)}</p> : null}
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-stone-800 bg-stone-950/70 p-5 text-sm text-stone-400">
                Nenhuma pendencia aberta.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
