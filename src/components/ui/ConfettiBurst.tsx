const COLORS = ["#F6C833", "#FFFFFF", "#111111"];
const PIECES = Array.from({ length: 18 }, (_, index) => ({
  left: 4 + ((index * 137) % 92),
  delay: (index % 6) * 60,
  color: COLORS[index % COLORS.length],
  size: 6 + (index % 3) * 3,
}));

/**
 * Explosao rapida de confete (amarelo/branco/preto) exibida no momento em
 * que a telemetria confirma o pulso com sucesso. So decorativa: cada
 * particula usa "forwards" e some sozinha, sem precisar de timer/estado.
 */
export function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden" aria-hidden>
      {PIECES.map((piece, index) => (
        <span
          key={index}
          className="absolute top-0 animate-confetti-fall rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
            boxShadow: piece.color === "#FFFFFF" ? "0 0 0 1px rgba(0,0,0,0.06)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
