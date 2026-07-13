import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const LINKS = [
  { to: "/lojas", label: "Lojas", icon: "🏬" },
  { to: "/creditos", label: "Loja de Créditos", icon: "💳" },
];

export function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Gaveta lateral */}
      <nav
        className={`absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-white shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <span className="text-lg font-bold text-brand-black">Agarra Mais</span>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onClose}
            className="text-2xl leading-none text-brand-black"
          >
            ×
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-1 p-3">
          {LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-brand-black hover:bg-surface-soft"
              >
                <span aria-hidden>{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            onClose();
            logout();
          }}
          className="m-3 rounded-xl border border-gray-200 px-3 py-3 text-left text-sm font-medium text-gray-500 hover:bg-surface-soft"
        >
          Sair da conta
        </button>
      </nav>
    </div>
  );
}
