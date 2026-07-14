import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SidebarDrawer } from "@/components/layout/SidebarDrawer";

/**
 * Navbar fixa no topo, presente em todas as telas autenticadas do WebApp.
 * Le o resumo do usuario (nome, saldo, nivel, progresso) do estado global -
 * quem popula esse estado e useAuthStore.fetchNavbarSummary(), chamado no
 * login e sempre que o saldo muda (compra aprovada / jogada realizada).
 */
export function TopNavbar({ wide = false }: { wide?: boolean }) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const navbar = useAuthStore((state) => state.navbar);
  const balanceBump = useAuthStore((state) => state.balanceBump);

  const name = navbar?.name ?? "";
  const creditBalance = navbar?.creditBalance ?? 0;
  const levelName = navbar?.currentLevelName ?? "Iniciante";
  const progressPercentage = navbar?.progressPercentage ?? 0;

  return (
    <>
      <header
        className={
          wide
            ? "sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 shadow-lg backdrop-blur"
            : "sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 shadow-lg backdrop-blur"
        }
      >
        <div
          className={`flex items-center justify-between py-3 ${wide ? "mx-auto max-w-6xl px-4 sm:px-8" : "px-4"}`}
        >
          {/* Esquerda: menu hamburguer */}
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setDrawerOpen(true)}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none transition-transform duration-150 active:scale-90 ${
              wide ? "bg-white/10 text-white hover:bg-white/15" : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            ☰
          </button>

          {/* Centro: nome / saldo / nivel */}
          <div className="flex min-w-0 flex-1 flex-col items-center px-2 text-center">
            <span className={`w-full truncate text-sm font-medium ${wide ? "text-white/80" : "text-white/80"}`}>
              {name}
            </span>
            <span
              key={balanceBump}
              className={`rounded-full px-2 text-xl font-bold leading-tight animate-flash-yellow ${
                wide ? "text-brand-yellow" : "text-brand-yellow"
              }`}
            >
              {creditBalance} Créditos
            </span>
            <span className={`truncate text-xs italic ${wide ? "text-white/55" : "text-white/55"}`}>
              Nível {levelName}
            </span>
          </div>

          {/* Direita: progresso de fidelidade */}
          <ProgressBar percentage={progressPercentage} celebrateKey={balanceBump} className="shrink-0" />
        </div>
      </header>

      <SidebarDrawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
