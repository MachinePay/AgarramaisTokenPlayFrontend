import { Link, useLocation } from "react-router-dom";
import { getToken } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const LINKS = [
  { to: "/inicio", label: "Inicio", description: "Promocoes e ofertas", icon: "🎯" },
  { to: "/lojas", label: "Lojas", description: "Escolher unidade", icon: "🏬" },
  { to: "/creditos", label: "Loja de Creditos", description: "Comprar fichas", icon: "💳" },
];

function isAdminToken(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(window.atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

export function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const navbar = useAuthStore((state) => state.navbar);
  const links = isAdminToken()
    ? [...LINKS, { to: "/admin", label: "Admin", description: "Gestao completa", icon: "⚙️" }]
    : LINKS;

  const name = navbar?.name ?? "Agarra Mais";
  const creditBalance = navbar?.creditBalance ?? 0;
  const levelName = navbar?.currentLevelName ?? "Iniciante";
  const progressPercentage = navbar?.progressPercentage ?? 0;

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <nav
        className={`absolute left-0 top-0 flex h-full w-80 max-w-[86%] flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative overflow-hidden bg-slate-950 px-5 pb-5 pt-4 text-white">
          <span aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-yellow/25" />
          <span aria-hidden className="absolute bottom-2 right-14 h-12 w-12 rounded-full bg-orange-500/25" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-yellow text-xl shadow-lg shadow-amber-500/20">
                🧸
              </span>
              <div>
                <p className="text-lg font-black leading-tight">Agarra Mais</p>
                <p className="text-xs font-semibold text-white/55">Token Play</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl leading-none text-white transition-colors hover:bg-white/15"
            >
              ×
            </button>
          </div>

          <div className="relative mt-5 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
            <p className="truncate text-sm font-bold text-white/75">{name}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-black text-brand-yellow">{creditBalance}</p>
                <p className="text-xs font-bold uppercase text-white/50">Creditos</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">Nivel {levelName}</p>
                <p className="text-xs font-semibold text-white/50">{progressPercentage}% completo</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-yellow to-orange-400"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-2 pt-4">
          <p className="px-2 text-xs font-black uppercase tracking-[0.18em] text-gray-400">Navegacao</p>
        </div>

        <ul className="flex flex-1 flex-col gap-2 px-3">
          {links.map((link) => {
            const active = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all active:scale-[0.98] ${
                    active
                      ? "bg-gradient-to-r from-brand-yellow to-orange-400 text-brand-black shadow-[0_12px_24px_rgba(245,158,11,0.26)]"
                      : "text-brand-black hover:bg-amber-50"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${
                      active ? "bg-white/35" : "bg-slate-100 group-hover:bg-white"
                    }`}
                  >
                    {link.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-black">{link.label}</span>
                    <span className={`block truncate text-xs font-semibold ${active ? "text-brand-black/65" : "text-gray-500"}`}>
                      {link.description}
                    </span>
                  </span>
                  <span aria-hidden className={`text-lg ${active ? "text-brand-black" : "text-gray-300"}`}>
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-gray-100 bg-white p-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-black text-red-600 transition-colors hover:bg-red-100"
          >
            <span>Sair da conta</span>
            <span aria-hidden>↗</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
