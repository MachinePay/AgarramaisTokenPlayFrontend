export function AdminStatCard({
  icon,
  label,
  value,
  sublabel,
  tone = "amber",
}: {
  icon: string;
  label: string;
  value: string;
  sublabel?: string;
  tone?: "amber" | "blue" | "green" | "red" | "purple" | "slate";
}) {
  const tones = {
    amber: "from-amber-400 to-orange-500 text-white shadow-orange-200/70",
    blue: "from-blue-500 to-cyan-500 text-white shadow-blue-200/70",
    green: "from-emerald-500 to-green-600 text-white shadow-emerald-200/70",
    red: "from-rose-500 to-red-600 text-white shadow-red-200/70",
    purple: "from-violet-500 to-fuchsia-500 text-white shadow-violet-200/70",
    slate: "from-slate-900 to-slate-700 text-white shadow-slate-300/70",
  } satisfies Record<NonNullable<typeof tone>, string>;

  return (
    <div
      className={`relative min-h-[128px] overflow-hidden rounded-2xl bg-gradient-to-br ${tones[tone]} p-5 shadow-lg transition-all duration-150 sm:hover:-translate-y-0.5`}
    >
      <span aria-hidden className="absolute -right-5 -top-6 h-24 w-24 rounded-full bg-white/15" />
      <span aria-hidden className="absolute -bottom-8 -left-7 h-24 w-24 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="text-xs font-extrabold uppercase leading-5 text-white/85">{label}</div>
        <span aria-hidden className="rounded-xl bg-white/18 px-2.5 py-2 text-xl leading-none">
          {icon}
        </span>
      </div>
      <p className="relative mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">{value}</p>
      {sublabel && <p className="relative mt-1 text-xs font-semibold text-white/82">{sublabel}</p>}
    </div>
  );
}
