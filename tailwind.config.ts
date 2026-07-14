import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#F6C833",
          black: "#111111",
        },
        surface: {
          soft: "#F9F9F9",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        // Modal "pulando" pra dentro da tela, imitando o movimento de uma garra.
        "modal-pop": {
          "0%": { transform: "scale(0.9) translateY(16px)", opacity: "0" },
          "60%": { transform: "scale(1.02) translateY(-2px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        // Pulinho elastico do emoji de pelucia na barra de progresso quando ganha credito.
        "bounce-once": {
          "0%, 100%": { transform: "translate(-50%, 0)" },
          "30%": { transform: "translate(-50%, -7px)" },
          "50%": { transform: "translate(-50%, 0)" },
          "68%": { transform: "translate(-50%, -3px)" },
          "84%": { transform: "translate(-50%, 0)" },
        },
        // Piscada suave em amarelo atras do saldo quando uma recarga e aprovada.
        "flash-yellow": {
          "0%, 100%": { backgroundColor: "rgba(246, 200, 51, 0)" },
          "25%, 75%": { backgroundColor: "rgba(246, 200, 51, 0.55)" },
        },
        // Brilho pulsante no botao de confirmar, chamando o clique.
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(246, 200, 51, 0.55)" },
          "50%": { boxShadow: "0 0 0 9px rgba(246, 200, 51, 0)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-16px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(160px) rotate(300deg)", opacity: "0" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 1.6s linear infinite",
        "modal-pop": "modal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1",
        "bounce-once": "bounce-once 0.7s ease-in-out 1",
        "flash-yellow": "flash-yellow 1s ease-in-out 1",
        "pulse-glow": "pulse-glow 1.8s ease-in-out infinite",
        "confetti-fall": "confetti-fall 900ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
