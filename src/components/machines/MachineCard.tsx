import type { Machine } from "@/lib/types";
import { StatusPill } from "@/components/machines/StatusPill";

export function MachineCard({ machine, onSelect }: { machine: Machine; onSelect: (machine: Machine) => void }) {
  const isAvailable = machine.status === "AVAILABLE";

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={() => onSelect(machine)}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-opacity disabled:opacity-60"
    >
      <div className="relative aspect-square w-full bg-surface-soft">
        {machine.imageUrl ? (
          <img
            src={machine.imageUrl}
            alt={machine.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🧸</div>
        )}
        <div className="absolute left-2 top-2">
          <StatusPill status={machine.status} />
        </div>
      </div>

      <div className="flex flex-col gap-1 px-3 py-3">
        <span className="truncate text-sm font-semibold text-brand-black">{machine.name}</span>
        <span className="text-xs text-gray-500">Custo: {machine.costPerGame} Créditos</span>
      </div>
    </button>
  );
}
