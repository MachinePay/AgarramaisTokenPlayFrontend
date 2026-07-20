import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SidebarDrawer } from "@/components/layout/SidebarDrawer";
import { QrCodeScannerModal } from "@/components/qr/QrCodeScannerModal";

/**
 * Navbar fixa no topo, presente em todas as telas autenticadas do WebApp.
 * Le o resumo do usuario (nome, saldo, nivel, progresso) do estado global.
 */
export function TopNavbar({ wide = false }: { wide?: boolean }) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isQrScannerOpen, setQrScannerOpen] = useState(false);
  const navigate = useNavigate();
  const navbar = useAuthStore((state) => state.navbar);
  const balanceBump = useAuthStore((state) => state.balanceBump);

  const name = navbar?.name ?? "";
  const creditBalance = navbar?.creditBalance ?? 0;
  const pointsBalance = navbar?.pointsBalance ?? 0;
  const levelName = navbar?.currentLevelName ?? "Iniciante";
  const progressPercentage = navbar?.progressPercentage ?? 0;

  function handleQrScan(value: string): boolean {
    const targetPath = getQrTargetPath(value);
    if (!targetPath) return false;

    setQrScannerOpen(false);
    navigate(targetPath);
    return true;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 shadow-lg backdrop-blur">
        <div
          className={`mx-auto flex w-full items-center justify-between py-3 ${
            wide ? "max-w-6xl px-4 sm:px-8" : "max-w-xl px-4 sm:max-w-2xl sm:px-6 lg:max-w-5xl lg:px-8"
          }`}
        >
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white transition-transform duration-150 hover:bg-white/15 active:scale-90"
            >
              ☰
            </button>
            <Link
              to="/meu-cadastro"
              className="inline-flex rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <span className="sm:hidden">ID</span>
              <span className="hidden sm:inline">Meu cadastro</span>
            </Link>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center px-2 text-center">
            <span className="w-full truncate text-sm font-medium text-white/80">{name}</span>
            <span
              key={balanceBump}
              className="animate-flash-yellow rounded-full px-2 text-xl font-bold leading-tight text-brand-yellow"
            >
              {creditBalance} Fichas
            </span>
            <span className="truncate text-xs italic text-white/55">Nível {levelName}</span>
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/85">
              ★ {pointsBalance} pts
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setQrScannerOpen(true)}
              className="rounded-full bg-brand-yellow px-3 py-2 text-xs font-black text-brand-black shadow-[0_10px_22px_rgba(245,158,11,0.22)] transition active:scale-[0.98]"
            >
              <span className="sm:hidden">QR</span>
              <span className="hidden sm:inline">Ler QR Code</span>
            </button>
            <ProgressBar percentage={progressPercentage} celebrateKey={balanceBump} className="shrink-0" />
          </div>
        </div>
      </header>

      <SidebarDrawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
      <QrCodeScannerModal open={isQrScannerOpen} onClose={() => setQrScannerOpen(false)} onScan={handleQrScan} />
    </>
  );
}

function getQrTargetPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const uuidPattern = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
  const directMachineMatch = trimmed.match(new RegExp(`^${uuidPattern}$`));
  if (directMachineMatch) return `/qr/maquina/${trimmed}`;

  try {
    const url = new URL(trimmed, window.location.origin);
    const path = url.pathname;
    if (new RegExp(`^/qr/(maquina|loja)/${uuidPattern}$`).test(path)) {
      return path;
    }
  } catch {
    return null;
  }

  return null;
}
