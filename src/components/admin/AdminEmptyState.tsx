export function AdminEmptyState({ icon = "📭", message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-soft px-6 py-10 text-center">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
