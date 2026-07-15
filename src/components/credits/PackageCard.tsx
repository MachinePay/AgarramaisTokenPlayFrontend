import type { CreditPackage } from "@/lib/types";

type PackageCardProps = {
  creditPackage: CreditPackage;
  loading: boolean;
  onBuy: (creditPackage: CreditPackage) => void;
};

export function PackageCard({ creditPackage, loading, onBuy }: PackageCardProps) {
  const totalCredits = creditPackage.baseCredits + creditPackage.bonusCredits;
  const isRecommended = creditPackage.isPopular;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-[0_18px_42px_rgba(15,23,42,0.16)] ${
        isRecommended
          ? "bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600"
          : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"
      }`}
    >
      <span aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" />
      <span aria-hidden className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-white/10" />

      {isRecommended && (
        <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase text-orange-600 shadow-lg">
          Recomendado
        </div>
      )}

      <div className="relative flex items-start justify-between gap-3 pr-20">
        <div>
          <p className={`text-sm font-black uppercase ${isRecommended ? "text-brand-black/70" : "text-white/60"}`}>
            Pacote
          </p>
          <h2 className={`mt-1 text-xl font-black ${isRecommended ? "text-brand-black" : "text-white"}`}>
            {creditPackage.name}
          </h2>
        </div>
        <span className={`rounded-2xl px-3 py-2 text-2xl ${isRecommended ? "bg-brand-black/10" : "bg-white/10"}`}>
          💳
        </span>
      </div>

      <div className="relative mt-5 grid grid-cols-[1fr_auto] items-end gap-3">
        <div>
          <p className={`text-xs font-bold uppercase ${isRecommended ? "text-brand-black/65" : "text-white/55"}`}>
            Você recebe
          </p>
          <p className={`text-4xl font-black leading-none ${isRecommended ? "text-brand-black" : "text-brand-yellow"}`}>
            {totalCredits}
          </p>
          <p className={`text-sm font-bold ${isRecommended ? "text-brand-black/70" : "text-white/65"}`}>fichas</p>
        </div>
        <div className="text-right">
          <p className={`text-xs font-bold uppercase ${isRecommended ? "text-brand-black/65" : "text-white/55"}`}>
            Valor
          </p>
          <p className={`text-2xl font-black ${isRecommended ? "text-brand-black" : "text-white"}`}>
            R$ {Number(creditPackage.amountBrl).toFixed(2)}
          </p>
        </div>
      </div>

      {creditPackage.bonusCredits > 0 && (
        <div
          className={`relative mt-4 w-fit rounded-full px-3 py-1.5 text-xs font-black uppercase ${
            isRecommended ? "bg-brand-black text-white" : "bg-brand-yellow text-brand-black"
          }`}
        >
          +{creditPackage.bonusCredits} bônus grátis
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => onBuy(creditPackage)}
        className={`relative mt-5 w-full rounded-2xl py-3.5 text-sm font-black shadow-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${
          isRecommended
            ? "bg-brand-black text-white shadow-slate-900/20"
            : "bg-gradient-to-r from-brand-yellow to-orange-400 text-brand-black shadow-amber-500/25"
        }`}
      >
        {loading ? "Gerando pagamento..." : "Comprar com Cartão ou Pix"}
      </button>
    </div>
  );
}
