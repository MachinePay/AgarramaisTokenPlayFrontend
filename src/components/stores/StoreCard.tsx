import type { Store } from "@/lib/types";

export function StoreCard({ store, onSelect }: { store: Store; onSelect: (store: Store) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(store)}
      className="flex w-full flex-col items-start gap-0.5 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left transition-colors active:bg-surface-soft"
    >
      <span className="text-base font-semibold text-brand-black">{store.name}</span>
      <span className="text-sm text-gray-500">{store.location}</span>
    </button>
  );
}
