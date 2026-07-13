type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ value, min = 1, max = 20, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-black text-lg font-semibold text-brand-black transition-opacity disabled:opacity-30"
      >
        −
      </button>
      <span className="w-6 text-center text-xl font-bold text-brand-black">{value}</span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-black text-lg font-semibold text-brand-black transition-opacity disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
