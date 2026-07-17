import type { ReactNode } from "react";
import { TopNavbar } from "@/components/layout/TopNavbar";

type AppShellProps = {
  children: ReactNode;
  /** Paineis de gestao (admin) usam a largura toda da tela em vez do miolo de app mobile (480px). */
  wide?: boolean;
};

export function AppShell({ children, wide = false }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(circle_at_top_left,rgba(246,200,51,0.2),transparent_34%),linear-gradient(180deg,#fff8df_0%,#f7f8fb_42%,#ffffff_100%)]">
      <TopNavbar wide={wide} />
      <main
        className={
          wide
            ? "mx-auto w-full max-w-6xl flex-1 px-4 py-2 sm:px-8"
            : "mx-auto w-full max-w-xl flex-1 px-4 py-2 sm:max-w-2xl sm:px-6 lg:max-w-5xl lg:px-8"
        }
      >
        {children}
      </main>
    </div>
  );
}
