import { useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { setPendingTransactionId } from "@/lib/checkout";
import type { AdminSettings, CreditPackage, Transaction } from "@/lib/types";
import { PackageCard } from "@/components/credits/PackageCard";
import { useAuthStore } from "@/store/useAuthStore";

export function FichasPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [customCredits, setCustomCredits] = useState("1");
  const [loading, setLoading] = useState(true);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [buyingCustom, setBuyingCustom] = useState(false);
  const [pixTransaction, setPixTransaction] = useState<Transaction | null>(null);
  const [pixSuccess, setPixSuccess] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchNavbarSummary = useAuthStore((state) => state.fetchNavbarSummary);

  const customCreditsNumber = Math.max(1, Number.parseInt(customCredits, 10) || 1);
  const tokenValue = Number(settings?.tokenValueBrl ?? 1);
  const customTotal = useMemo(() => customCreditsNumber * tokenValue, [customCreditsNumber, tokenValue]);

  useEffect(() => {
    Promise.all([
      apiRequest<CreditPackage[]>("/packages"),
      apiRequest<AdminSettings>("/settings/credits").catch(
        (): AdminSettings => ({
          tokenBundleAmountBrl: "1.00",
          tokenBundleCredits: 1,
          tokenValueBrl: "1.00",
          pointsPerCredit: 0,
          paymentProvider: "MERCADO_PAGO",
          santanderEnvironment: "SANDBOX",
          santanderBaseUrl: "https://trust-sandbox.api.santander.com.br",
          santanderClientIdSet: false,
          santanderClientSecretSet: false,
          santanderCertificatePemSet: false,
          santanderPrivateKeyPemSet: false,
          santanderPfxSet: false,
          santanderPixKeySet: false,
        }),
      ),
    ])
      .then(([packagesData, settingsData]) => {
        setPackages(packagesData);
        setSettings(settingsData);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!pixTransaction || pixTransaction.status !== "PENDING") return;

    const interval = window.setInterval(async () => {
      try {
        const updated = await apiRequest<Transaction>(`/transactions/${pixTransaction.id}`);
        if (updated.status === "APPROVED") {
          setPixTransaction(null);
          setPixSuccess(`${updated.creditsAwarded} fichas adicionadas ao seu saldo.`);
          fetchNavbarSummary().catch(() => {});
          window.clearInterval(interval);
          window.setTimeout(() => setPixSuccess(null), 4500);
          return;
        }
        if (updated.status === "FAILED") {
          setPixTransaction(null);
          setError("Pedido Pix cancelado ou nao aprovado.");
          window.clearInterval(interval);
        }
      } catch {
        // Mantem o QR na tela; o webhook ainda pode confirmar em seguida.
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [fetchNavbarSummary, pixTransaction]);

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

  async function handleBuyCustomPix() {
    setError(null);
    setPixSuccess(null);
    setBuyingCustom(true);
    try {
      const transaction = await apiRequest<Transaction>("/transactions/checkout-pix", {
        method: "POST",
        body: { credits: customCreditsNumber },
      });
      setCopiedPix(false);
      setPixTransaction(transaction);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel gerar o Pix");
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

  async function handleBuyPix(creditPackage: CreditPackage) {
    setError(null);
    setPixSuccess(null);
    setBuyingPackageId(creditPackage.id);
    try {
      const transaction = await apiRequest<Transaction>("/transactions/checkout-pix", {
        method: "POST",
        body: { packageId: creditPackage.id },
      });
      setCopiedPix(false);
      setPixTransaction(transaction);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel gerar o Pix");
    } finally {
      setBuyingPackageId(null);
    }
  }

  async function cancelPixTransaction() {
    if (!pixTransaction) return;

    try {
      await apiRequest<Transaction>(`/transactions/${pixTransaction.id}/cancel`, { method: "POST" });
      setPixTransaction(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel cancelar o pedido Pix");
    }
  }

  async function copyPixCode() {
    if (!pixTransaction?.pixQrCode) return;
    await navigator.clipboard.writeText(pixTransaction.pixQrCode);
    setCopiedPix(true);
    window.setTimeout(() => setCopiedPix(false), 2500);
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
      {pixSuccess && <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{pixSuccess}</p>}

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
                {buyingCustom ? "Gerando pagamento..." : "Cartao ou Mercado Pago"}
              </button>
              <button
                type="button"
                disabled={buyingCustom}
                onClick={handleBuyCustomPix}
                className="mt-2 w-full rounded-2xl bg-white py-3.5 text-sm font-black text-brand-black shadow-lg shadow-amber-900/10 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {buyingCustom ? "Gerando Pix..." : "Pagar com Pix"}
              </button>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-brand-black">Pacotes com benefícios</h2>
              <p className="text-sm font-medium text-gray-500">Melhores ofertas, bônus e promoções.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                onBuyPix={handleBuyPix}
              />
            ))}
          </div>
        </>
      )}

      {pixTransaction && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 px-4 pb-4 sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-orange-600">Pix gerado</p>
                <h2 className="text-2xl font-black text-brand-black">Pague para receber fichas</h2>
              </div>
              <button
                type="button"
                onClick={cancelPixTransaction}
                className="rounded-full bg-gray-100 px-3 py-2 text-sm font-black text-gray-600"
              >
                X
              </button>
            </div>

            <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-center text-white">
              {pixTransaction.pixQrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${pixTransaction.pixQrCodeBase64}`}
                  alt="QR Code Pix"
                  className="mx-auto h-64 w-64 rounded-2xl bg-white p-3"
                />
              ) : (
                <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-2xl bg-white p-3 text-sm font-bold text-brand-black">
                  Copie o codigo Pix abaixo
                </div>
              )}
              <p className="mt-3 text-sm font-bold text-white/70">
                Aguardando pagamento. Assim que confirmar, as fichas entram automaticamente.
              </p>
            </div>

            <button
              type="button"
              onClick={copyPixCode}
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 px-4 py-3.5 text-sm font-black text-brand-black"
            >
              {copiedPix ? "Codigo copiado" : "Copiar codigo Pix"}
            </button>
            <button
              type="button"
              onClick={cancelPixTransaction}
              className="mt-2 w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600"
            >
              Cancelar pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
