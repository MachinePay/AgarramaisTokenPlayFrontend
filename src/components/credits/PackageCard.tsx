import type { CreditPackage } from "@/lib/types";

type PackageCardProps = {
  creditPackage: CreditPackage;
  loading: boolean;
  onBuy: (creditPackage: CreditPackage) => void;
};

export function PackageCard({ creditPackage, loading, onBuy }: PackageCardProps) {
  const totalCredits = creditPackage.baseCredits + creditPackage.bonusCredits;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-black bg-white p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold text-brand-black">{creditPackage.name}</span>
        {creditPackage.isPopular && (
          <span className="rounded-full bg-brand-black px-2.5 py-0.5 text-[11px] font-bold text-white">
            MAIS POPULAR
          </span>
        )}
      </div>

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
        className="mt-1 w-full rounded-xl bg-brand-yellow py-3 text-sm font-bold text-brand-black transition-opacity disabled:opacity-50"
      >
        {loading ? "Gerando pagamento..." : "Comprar com Cartão ou Pix"}
      </button>
    </div>
  );
}
