import type { Store } from "@/lib/types";

export function StoreCard({ store, onSelect }: { store: Store; onSelect: (store: Store) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(store)}
      className="flex w-full flex-col items-start gap-0.5 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left shadow-sm transition-all duration-150 active:scale-[0.98] active:bg-surface-soft sm:hover:shadow-md"
    >
      <span className="text-base font-semibold text-brand-black">{store.name}</span>
      <span className="text-sm text-gray-500">{store.location}</span>
    </button>
  );
}
