type ProgressBarProps = {
  percentage: number;
  className?: string;
};

/**
 * Barra de progresso de fidelidade do navbar: preenchimento amarelo com a
 * ponta marcada por um emoji de pelucia (🧸) e a porcentagem abaixo.
 */
export function ProgressBar({ percentage, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`flex w-20 flex-col items-center gap-1 ${className}`}>
      <div className="relative h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-brand-yellow transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
        <span
          aria-hidden
          className="absolute -top-[9px] -translate-x-1/2 select-none text-[13px] leading-none"
          style={{ left: `${clamped}%` }}
        >
          🧸
        </span>
      </div>
      <span className="text-[11px] font-semibold text-gray-500">{Math.round(clamped)}%</span>
    </div>
  );
}
