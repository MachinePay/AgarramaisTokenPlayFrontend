type ProgressBarProps = {
  percentage: number;
  className?: string;
  /** Muda sempre que o usuario ganha credito - remonta o emoji pra replayar o bounce. */
  celebrateKey?: number;
};

/**
 * Barra de progresso de fidelidade do navbar: preenchimento amarelo com a
 * ponta marcada por um emoji de pelucia (🧸) e a porcentagem abaixo. O emoji
 * da um pulinho elastico sempre que celebrateKey muda (usuario ganhou credito).
 */
export function ProgressBar({ percentage, className = "", celebrateKey = 0 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`flex w-20 flex-col items-center gap-1 ${className}`}>
      <div className="relative h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-brand-yellow transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
        <span
          key={celebrateKey}
          aria-hidden
          className="absolute -top-[9px] left-0 select-none text-[13px] leading-none animate-bounce-once"
          style={{ left: `${clamped}%` }}
        >
          🧸
        </span>
      </div>
      <span className="text-[11px] font-semibold text-gray-500">{Math.round(clamped)}%</span>
    </div>
  );
}
