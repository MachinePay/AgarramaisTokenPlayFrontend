type BrandMarkProps = {
  size?: number;
  spinning?: boolean;
  className?: string;
};

/**
 * Marca Agarra Mais: quatro circulos concentricos circundados por dois arcos
 * laterais. Usada em amarelo, girando, na tela de liberacao da maquina.
 */
export function BrandMark({ size = 96, spinning = true, className = "" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`text-brand-yellow ${spinning ? "animate-spin-slow" : ""} ${className}`}
      role="img"
      aria-label="Agarra Mais"
    >
      <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        d="M 19.4 75.7 A 40 40 0 0 1 19.4 24.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 80.6 24.3 A 40 40 0 0 1 80.6 75.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
