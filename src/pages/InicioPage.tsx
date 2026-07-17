import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import type { Store } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useSelectedStoreStore } from "@/store/useSelectedStoreStore";

export function InicioPage() {
  const navigate = useNavigate();
  const navbar = useAuthStore((state) => state.navbar);
  const selectStore = useSelectedStoreStore((state) => state.selectStore);

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Store[]>("/stores/me")
      .then((storesData) => setStores(storesData))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  const firstStore = stores[0] ?? null;

  function goToFirstStore() {
    if (!firstStore) {
      navigate("/lojas");
      return;
    }
    selectStore(firstStore.id, firstStore.name);
    navigate(`/lojas/${firstStore.id}`);
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <section className="home-hero relative overflow-hidden rounded-[2rem] bg-slate-950 px-5 py-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.32)]">
        <div className="home-hero__glow home-hero__glow--yellow" />
        <div className="home-hero__glow home-hero__glow--orange" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-brand-yellow ring-1 ring-white/15">
            <span aria-hidden>*</span>
            Promocoes e maquinas online
          </div>
          <h1 className="mt-4 max-w-[13ch] text-4xl font-black leading-[0.95] tracking-tight">
            Sua proxima pelucia esta aqui.
          </h1>
          <p className="mt-3 max-w-xs text-sm font-semibold text-white/65">
            Compre fichas, escolha uma loja e jogue nas maquinas conectadas agora.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <p className="text-2xl font-black text-brand-yellow">{navbar?.creditBalance ?? 0}</p>
              <p className="text-[11px] font-bold uppercase text-white/50">Fichas</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <p className="truncate text-base font-black text-white">Nivel {navbar?.currentLevelName ?? "Iniciante"}</p>
              <p className="text-[11px] font-bold uppercase text-white/50">{navbar?.progressPercentage ?? 0}% completo</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Link
              to="/fichas"
              className="home-cta inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 px-5 py-4 text-base font-black text-brand-black shadow-[0_16px_28px_rgba(245,158,11,0.28)]"
            >
              Comprar fichas agora
            </Link>
            <button
              type="button"
              onClick={goToFirstStore}
              className="home-cta rounded-[1.35rem] border border-brand-yellow/35 bg-gradient-to-r from-brand-yellow via-amber-400 to-orange-400 px-5 py-5 text-xl font-black uppercase tracking-wide text-brand-black shadow-[0_18px_36px_rgba(245,158,11,0.36)] transition active:scale-[0.98]"
            >
              Jogar
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl bg-white/85 p-8 text-center text-sm font-bold text-gray-500 shadow-sm">
          Carregando lojas...
        </div>
      ) : (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-black text-brand-black">Comece por uma loja</h2>
            <p className="text-sm font-medium text-gray-500">Escolha a unidade e veja as maquinas disponiveis.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.slice(0, 3).map((store) => (
              <button
                type="button"
                key={store.id}
                onClick={() => {
                  selectStore(store.id, store.name);
                  navigate(`/lojas/${store.id}`);
                }}
                className="flex items-center justify-between rounded-3xl bg-white/85 p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                <span>
                  <span className="block font-black text-brand-black">{store.name}</span>
                  <span className="block text-sm font-medium text-gray-500">{store.location}</span>
                </span>
                <span className="rounded-2xl bg-amber-100 px-3 py-2 text-sm font-black text-orange-700">
                  Jogar
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
