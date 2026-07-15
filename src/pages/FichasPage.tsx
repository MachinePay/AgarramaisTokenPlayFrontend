import { useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { setPendingTransactionId } from "@/lib/checkout";
import type { AdminSettings, CreditPackage, Transaction } from "@/lib/types";
import { PackageCard } from "@/components/credits/PackageCard";

export function FichasPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [customCredits, setCustomCredits] = useState("1");
  const [loading, setLoading] = useState(true);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [buyingCustom, setBuyingCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customCreditsNumber = Math.max(1, Number.parseInt(customCredits, 10) || 1);
  const tokenValue = Number(settings?.tokenValueBrl ?? 1);
  const customTotal = useMemo(() => customCreditsNumber * tokenValue, [customCreditsNumber, tokenValue]);

  useEffect(() => {
    Promise.all([
      apiRequest<CreditPackage[]>("/packages"),
      apiRequest<AdminSettings>("/settings/credits").catch(() => ({
        tokenBundleAmountBrl: "1.00",
        tokenBundleCredits: 1,
        tokenValueBrl: "1.00",
      })),
    ])
      .then(([packagesData, settingsData]) => {
        setPackages(packagesData);
        setSettings(settingsData);
      })
      .finally(() => setLoading(false));
  }, []);

  async function goToCheckout(transaction: Transaction) {
    if (transaction.checkoutUrl) {
      setPendingTransactionId(transaction.id);
      window.location.href = transaction.checkoutUrl;
      return;
    }

    setError("Nao foi possivel gerar o pagamento. Tente novamente.");
  }

  async function handleBuyCustom() {
    setError(null);
    setBuyingCustom(true);
    try {
      const transaction = await apiRequest<Transaction>("/transactions/checkout-custom", {
        method: "POST",
        body: { credits: customCreditsNumber },
      });
      await goToCheckout(transaction);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel iniciar a compra");
    } finally {
      setBuyingCustom(false);
    }
  }

  async function handleBuy(creditPackage: CreditPackage) {
    setError(null);
    setBuyingPackageId(creditPackage.id);
    try {
      const transaction = await apiRequest<Transaction>("/transactions/checkout", {
        method: "POST",
        body: { packageId: creditPackage.id },
      });
      await goToCheckout(transaction);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel iniciar a compra");
    } finally {
      setBuyingPackageId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.22)]">
        <span aria-hidden className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-yellow/30" />
        <span aria-hidden className="absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-orange-500/20" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-3xl">
              💳
            </span>
            <h1 className="text-3xl font-black text-white">Loja de Fichas</h1>
          </div>
          <p className="mt-2 text-sm font-medium text-white/65">Compre fichas avulsas ou aproveite pacotes com bônus.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-lg font-black text-brand-yellow">Avulso</p>
              <p className="text-[11px] font-bold uppercase text-white/50">Você escolhe</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-lg font-black text-brand-yellow">Pacotes</p>
              <p className="text-[11px] font-bold uppercase text-white/50">Com benefícios</p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl bg-white/85 p-8 text-center text-sm font-bold text-gray-500 shadow-sm">
          Carregando loja...
        </div>
      )}

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

      {!loading && (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 p-5 text-brand-black shadow-[0_18px_42px_rgba(245,158,11,0.22)]">
            <span aria-hidden className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/20" />
            <div className="relative">
              <p className="text-sm font-black uppercase text-brand-black/65">Comprar na mão</p>
              <h2 className="mt-1 text-2xl font-black">Escolha quantas fichas quiser</h2>
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-black uppercase text-brand-black/60">Quantidade de fichas</span>
                  <input
                    className="h-14 rounded-2xl border-0 bg-white px-4 text-2xl font-black text-brand-black outline-none ring-1 ring-brand-black/10 focus:ring-2 focus:ring-brand-black/25"
                    inputMode="numeric"
                    min={1}
                    value={customCredits}
                    onChange={(event) => setCustomCredits(event.target.value.replace(/\D/g, "") || "1")}
                  />
                </label>
                <div className="flex flex-col justify-end text-right">
                  <span className="text-xs font-black uppercase text-brand-black/60">Total</span>
                  <span className="text-2xl font-black">R$ {customTotal.toFixed(2)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs font-bold text-brand-black/65">
                Valor atual: 1 ficha = R$ {tokenValue.toFixed(2)}
              </p>
              <button
                type="button"
                disabled={buyingCustom}
                onClick={handleBuyCustom}
                className="mt-4 w-full rounded-2xl bg-brand-black py-3.5 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {buyingCustom ? "Gerando pagamento..." : "Comprar fichas avulsas"}
              </button>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-brand-black">Pacotes com benefícios</h2>
              <p className="text-sm font-medium text-gray-500">Melhores ofertas, bônus e promoções.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {packages.length === 0 && (
              <div className="rounded-3xl bg-white/85 p-8 text-center shadow-sm">
                <p className="text-3xl">🎁</p>
                <p className="mt-2 font-black text-brand-black">Nenhum pacote disponível</p>
                <p className="text-sm text-gray-500">Ainda assim você pode comprar fichas avulsas acima.</p>
              </div>
            )}

            {packages.map((creditPackage) => (
              <PackageCard
                key={creditPackage.id}
                creditPackage={creditPackage}
                loading={buyingPackageId === creditPackage.id}
                onBuy={handleBuy}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
