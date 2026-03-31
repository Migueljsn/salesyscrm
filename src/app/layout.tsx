import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fonil Sales System",
  description: "CRM operacional de leads, qualificação e vendas.",
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
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-stone-900 !border-stone-800 !text-stone-100 !rounded-2xl !shadow-xl !shadow-black/40",
              title: "!text-stone-100 !font-semibold",
              description: "!text-stone-400",
              success: "!border-emerald-500/30",
              error: "!border-red-500/30",
            },
          }}
        />
      </body>
    </html>
  );
}
