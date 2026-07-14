export function AdminStatCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: string;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm transition-shadow sm:hover:shadow-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-extrabold text-brand-black">{value}</p>
      {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
    </div>
  );
}
