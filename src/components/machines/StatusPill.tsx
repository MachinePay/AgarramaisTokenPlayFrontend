import type { MachineStatus } from "@/lib/types";

const STATUS_CONFIG: Record<MachineStatus, { label: string; className: string; dot: string }> = {
  AVAILABLE: { label: "Disponível", className: "bg-green-50 text-green-700", dot: "bg-green-500" },
  BUSY: { label: "Ocupada", className: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
  MAINTENANCE: { label: "Manutenção", className: "bg-red-50 text-red-600", dot: "bg-red-500" },
};

export function StatusPill({ status }: { status: MachineStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden />
      {config.label}
    </span>
  );
}
