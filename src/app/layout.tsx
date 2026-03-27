import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fonil Sales System",
  description: "CRM operacional de leads e confirmacao pos-venda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
