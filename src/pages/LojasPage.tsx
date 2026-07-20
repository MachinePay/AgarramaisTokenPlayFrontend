import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import type { Store } from "@/lib/types";
import { StoreCard } from "@/components/stores/StoreCard";
import { useSelectedStoreStore } from "@/store/useSelectedStoreStore";
import { QrCodeScannerModal } from "@/components/qr/QrCodeScannerModal";
import { getQrTargetPath } from "@/lib/qr";

export function LojasPage() {
  const navigate = useNavigate();
  const selectStore = useSelectedStoreStore((state) => state.selectStore);

  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);
  const [isQrScannerOpen, setQrScannerOpen] = useState(false);

  useEffect(() => {
    apiRequest<Store[]>("/stores/me")
      .then(setStores)
      .finally(() => setLoading(false));
  }, []);

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visibleStores = term
      ? stores.filter(
          (store) =>
            store.name.toLowerCase().includes(term) || store.location.toLowerCase().includes(term),
        )
      : stores;

    return [...visibleStores].sort(
      (a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)) || a.name.localeCompare(b.name),
    );
  }, [stores, search]);

  function handleSelect(store: Store) {
    selectStore(store.id, store.name);
    navigate(`/lojas/${store.id}`);
  }

  function handleQrScan(value: string): boolean {
    const targetPath = getQrTargetPath(value);
    if (!targetPath) return false;

    setQrScannerOpen(false);
    navigate(targetPath);
    return true;
  }

  async function toggleFavorite(store: Store) {
    const nextFavorite = !store.isFavorite;
    setFavoriteLoadingId(store.id);
    setStores((current) =>
      current.map((item) => (item.id === store.id ? { ...item, isFavorite: nextFavorite } : item)),
    );

    try {
      await apiRequest(`/stores/${store.id}/favorite`, {
        method: "PUT",
        body: { favorite: nextFavorite },
      });
    } catch {
      setStores((current) =>
        current.map((item) => (item.id === store.id ? { ...item, isFavorite: store.isFavorite } : item)),
      );
    } finally {
      setFavoriteLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-brand-black">Escolha a loja</h1>
        <button
          type="button"
          onClick={() => setQrScannerOpen(true)}
          className="rounded-full bg-brand-yellow px-4 py-2.5 text-xs font-black uppercase text-brand-black shadow-[0_10px_22px_rgba(245,158,11,0.22)] transition active:scale-[0.98]"
        >
          Ler QR Code
        </button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar loja ou shopping..."
        className="rounded-xl border border-gray-200 bg-surface-soft px-4 py-3 text-sm outline-none focus:border-brand-yellow"
      />

      {loading && <p className="py-8 text-center text-sm text-gray-500">Carregando lojas...</p>}

      {!loading && filteredStores.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">Nenhuma loja encontrada.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            onSelect={handleSelect}
            onToggleFavorite={toggleFavorite}
            favoriteLoading={favoriteLoadingId === store.id}
          />
        ))}
      </div>

      <QrCodeScannerModal open={isQrScannerOpen} onClose={() => setQrScannerOpen(false)} onScan={handleQrScan} />
    </div>
  );
}
