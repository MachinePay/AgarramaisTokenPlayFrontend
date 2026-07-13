import type { MachineStatus } from "@/lib/types";

const STATUS_CONFIG: Record<MachineStatus, { label: string; className: string }> = {
  AVAILABLE: { label: "Disponível", className: "bg-green-50 text-green-700" },
  BUSY: { label: "Ocupada", className: "bg-gray-100 text-gray-500" },
  MAINTENANCE: { label: "Manutenção", className: "bg-red-50 text-red-600" },
};

export function StatusPill({ status }: { status: MachineStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
