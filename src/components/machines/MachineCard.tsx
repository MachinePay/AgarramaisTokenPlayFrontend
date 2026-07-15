import type { Machine } from "@/lib/types";
import { StatusPill } from "@/components/machines/StatusPill";

export function MachineCard({ machine, onSelect }: { machine: Machine; onSelect: (machine: Machine) => void }) {
  const isAvailable = machine.status === "AVAILABLE";

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={() => onSelect(machine)}
      className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-all duration-150 active:scale-[0.98] disabled:active:scale-100 sm:hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-surface-soft">
        {machine.imageUrl ? (
          <img
            src={machine.imageUrl}
            alt={machine.name}
            className={`h-full w-full object-cover transition-all duration-200 ${
              isAvailable ? "" : "grayscale opacity-60"
            }`}
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center text-3xl ${
              isAvailable ? "" : "grayscale opacity-60"
            }`}
          >
            🧸
          </div>
        )}
        <div className="absolute left-2 top-2">
          <StatusPill status={machine.status} />
        </div>
      </div>

      <div className={`flex flex-col gap-1 px-3 py-3 ${isAvailable ? "" : "opacity-60"}`}>
        <span className="truncate text-sm font-semibold text-brand-black">{machine.name}</span>
        <span className="text-base font-extrabold text-brand-black">
          {machine.costPerGame} <span className="text-xs font-semibold text-gray-500">Fichas</span>
        </span>
      </div>
    </button>
  );
}
