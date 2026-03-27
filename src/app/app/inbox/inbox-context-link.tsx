"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function InboxContextLink({
  itemId,
  href,
  className,
  children,
}: {
  itemId: string;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  async function handleClick() {
    await fetch("/api/inbox/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <Link href={href} onClick={() => void handleClick()} className={className}>
      {children}
    </Link>
  );
}
