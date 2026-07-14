type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ value, min = 1, max = 20, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-6">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl font-semibold text-brand-black shadow-sm transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:active:scale-100"
      >
        −
      </button>
      <span className="w-8 text-center text-2xl font-extrabold tabular-nums text-brand-black">
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl font-semibold text-brand-black shadow-sm transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:active:scale-100"
      >
        +
      </button>
    </div>
  );
}
