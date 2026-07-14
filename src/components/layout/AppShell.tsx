import type { ReactNode } from "react";
import { TopNavbar } from "@/components/layout/TopNavbar";

type AppShellProps = {
  children: ReactNode;
  /** Paineis de gestao (admin) usam a largura toda da tela em vez do miolo de app mobile (480px). */
  wide?: boolean;
};

export function AppShell({ children, wide = false }: AppShellProps) {
  return (
    <div className={wide ? "flex min-h-dvh flex-col bg-white" : "app-viewport flex flex-col"}>
      <TopNavbar wide={wide} />
      <main className={wide ? "mx-auto w-full max-w-6xl flex-1 bg-white px-4 py-2 sm:px-8" : "flex-1 bg-white"}>
        {children}
      </main>
    </div>
  );
}
