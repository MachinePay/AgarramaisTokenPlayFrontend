import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  busy: boolean;
  onBuyCredits: (product: Product) => void;
  onBuyPoints: (product: Product) => void;
  onBuyMoney: (product: Product) => void;
  onBuyMoneyPix: (product: Product) => void;
};

export function ProductCard({ product, busy, onBuyCredits, onBuyPoints, onBuyMoney, onBuyMoneyPix }: ProductCardProps) {
  const cardPriceBrl = product.cardPriceBrl ?? product.priceBrl;

  return (
    <div className="overflow-hidden rounded-3xl bg-white/95 shadow-[0_18px_42px_rgba(15,23,42,0.10)]">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-slate-100 text-4xl">🎁</div>
      )}

      <div className="p-4">
        <h2 className="text-lg font-black text-brand-black">{product.name}</h2>
        {product.description && <p className="mt-1 text-sm text-gray-500">{product.description}</p>}

        <div className="mt-4 grid gap-2">
          {product.priceCredits != null && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onBuyCredits(product)}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 px-4 py-3 text-sm font-black text-brand-black shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>Comprar com fichas</span>
              <span>{product.priceCredits}</span>
            </button>
          )}

          {product.pricePoints != null && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onBuyPoints(product)}
              className="flex w-full items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>Resgatar com pontos</span>
              <span>{product.pricePoints}</span>
            </button>
          )}

          {(product.priceBrl != null || cardPriceBrl != null) && (
            <div className={`grid gap-2 ${product.priceBrl != null && cardPriceBrl != null ? "grid-cols-2" : "grid-cols-1"}`}>
              {product.priceBrl != null && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onBuyMoneyPix(product)}
                  className="rounded-2xl border border-gray-200 px-3 py-3 text-xs font-black text-brand-black transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Pix - R$ {Number(product.priceBrl).toFixed(2)}
                </button>
              )}
              {cardPriceBrl != null && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onBuyMoney(product)}
                  className="rounded-2xl border border-gray-200 px-3 py-3 text-xs font-black text-brand-black transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Cartao - R$ {Number(cardPriceBrl).toFixed(2)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
