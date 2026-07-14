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
      className={`relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-white p-4 transition-shadow ${
        isRecommended
          ? "border-2 border-brand-yellow shadow-md"
          : "border border-gray-100 shadow-sm"
      }`}
    >
      {isRecommended && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-brand-yellow px-3 py-1 text-[11px] font-extrabold tracking-wide text-brand-black">
          RECOMENDADO
        </div>
      )}

      <span className="text-base font-bold text-brand-black">{creditPackage.name}</span>

      <span className="text-2xl font-extrabold text-brand-black">
        R$ {Number(creditPackage.amountBrl).toFixed(2)}
      </span>

      <span className="text-sm text-gray-500">Equivale a {totalCredits} Créditos</span>

      {creditPackage.bonusCredits > 0 && (
        <span className="inline-block w-fit rounded-lg bg-brand-yellow px-2.5 py-1 text-xs font-extrabold text-brand-black">
          +{creditPackage.bonusCredits} CRÉDITOS BÔNUS GRÁTIS
        </span>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => onBuy(creditPackage)}
        className="mt-1 w-full rounded-xl bg-brand-yellow py-3 text-sm font-bold text-brand-black transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
      >
        {loading ? "Gerando pagamento..." : "Comprar com Cartão ou Pix"}
      </button>
    </div>
  );
}
