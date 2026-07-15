import type { Store } from "@/lib/types";

export function StoreCard({
  store,
  onSelect,
  onToggleFavorite,
  favoriteLoading,
}: {
  store: Store;
  onSelect: (store: Store) => void;
  onToggleFavorite: (store: Store) => void;
  favoriteLoading?: boolean;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm transition-all duration-150 sm:hover:shadow-md">
      <button
        type="button"
        onClick={() => onSelect(store)}
        className="min-w-0 flex-1 text-left transition active:scale-[0.99]"
      >
        <span className="block truncate text-base font-semibold text-brand-black">{store.name}</span>
        <span className="block truncate text-sm text-gray-500">{store.location}</span>
      </button>
      <button
        type="button"
        aria-label={store.isFavorite ? "Remover loja dos favoritos" : "Favoritar loja"}
        disabled={favoriteLoading}
        onClick={() => onToggleFavorite(store)}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl transition active:scale-90 disabled:opacity-60 ${
          store.isFavorite ? "bg-amber-100 text-amber-500" : "bg-slate-100 text-slate-300"
        }`}
      >
        {store.isFavorite ? "★" : "☆"}
      </button>
    </div>
  );
}
