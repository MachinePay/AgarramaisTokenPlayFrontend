type ProgressBarProps = {
  percentage: number;
  className?: string;
  /** Muda sempre que o usuario ganha credito - remonta o emoji pra replayar o bounce. */
  celebrateKey?: number;
};

export function ProgressBar({ percentage, className = "", celebrateKey = 0 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={`flex w-36 flex-col gap-1.5 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          key={celebrateKey}
          aria-hidden
          className="flex h-8 w-8 select-none items-center justify-center rounded-xl bg-brand-yellow text-lg leading-none shadow-lg shadow-amber-500/25 animate-bounce-once"
        >
          🧸
        </span>
        <div className="text-right">
          <p className="text-base font-black leading-none text-brand-yellow">{Math.round(clamped)}%</p>
          <p className="text-[10px] font-bold uppercase leading-none text-white/55">Nível</p>
        </div>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-yellow to-orange-400 shadow-[0_0_16px_rgba(246,200,51,0.7)] transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
