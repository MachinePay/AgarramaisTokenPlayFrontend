import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import type { Store } from "@/lib/types";
import { StoreCard } from "@/components/stores/StoreCard";
import { useSelectedStoreStore } from "@/store/useSelectedStoreStore";

export function LojasPage() {
  const navigate = useNavigate();
  const selectStore = useSelectedStoreStore((state) => state.selectStore);

  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Store[]>("/stores")
      .then(setStores)
      .finally(() => setLoading(false));
  }, []);

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stores;
    return stores.filter(
      (store) =>
        store.name.toLowerCase().includes(term) || store.location.toLowerCase().includes(term),
    );
  }, [stores, search]);

  function handleSelect(store: Store) {
    selectStore(store.id, store.name);
    navigate(`/lojas/${store.id}`);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="text-xl font-bold text-brand-black">Escolha a loja</h1>

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

      <div className="flex flex-col gap-3">
        {filteredStores.map((store) => (
          <StoreCard key={store.id} store={store} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
