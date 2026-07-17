import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { setPendingOrderId } from "@/lib/checkout";
import type { Product, ProductOrder } from "@/lib/types";
import { ProductCard } from "@/components/store/ProductCard";
import { useAuthStore } from "@/store/useAuthStore";

export function LojaProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [pixOrder, setPixOrder] = useState<ProductOrder | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navbar = useAuthStore((state) => state.navbar);
  const fetchNavbarSummary = useAuthStore((state) => state.fetchNavbarSummary);

  useEffect(() => {
    apiRequest<Product[]>("/products")
      .then(setProducts)
      .catch(() => setError("Nao foi possivel carregar a loja de produtos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!pixOrder || pixOrder.status !== "PENDING_PAYMENT") return;

    const interval = window.setInterval(async () => {
      try {
        const updated = await apiRequest<ProductOrder>(`/orders/${pixOrder.id}`);
        if (updated.status === "AWAITING_DELIVERY") {
          setPixOrder(null);
          setSuccessMessage(`Pedido de "${updated.productName}" confirmado! Acompanhe em Meus Pedidos.`);
          window.clearInterval(interval);
          window.setTimeout(() => setSuccessMessage(null), 5000);
          return;
        }
        if (updated.status === "FAILED") {
          setPixOrder(null);
          setError("Pedido Pix cancelado ou nao aprovado.");
          window.clearInterval(interval);
        }
      } catch {
        // Mantem o QR na tela; o webhook ainda pode confirmar em seguida.
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [pixOrder]);

  function showSuccess(message: string) {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 5000);
  }

  async function handleBuyCredits(product: Product) {
    setError(null);
    setBusyProductId(product.id);
    try {
      await apiRequest<ProductOrder>(`/products/${product.id}/checkout-credits`, { method: "POST" });
      showSuccess(`"${product.name}" resgatado com fichas! Acompanhe em Meus Pedidos.`);
      await fetchNavbarSummary();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel concluir a compra");
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleBuyPoints(product: Product) {
    setError(null);
    setBusyProductId(product.id);
    try {
      await apiRequest<ProductOrder>(`/products/${product.id}/checkout-points`, { method: "POST" });
      showSuccess(`"${product.name}" resgatado com pontos! Acompanhe em Meus Pedidos.`);
      await fetchNavbarSummary();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel concluir a compra");
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleBuyMoney(product: Product) {
    setError(null);
    setBusyProductId(product.id);
    try {
      const order = await apiRequest<ProductOrder>(`/products/${product.id}/checkout-money`, { method: "POST" });
      if (order.checkoutUrl) {
        setPendingOrderId(order.id);
        window.location.href = order.checkoutUrl;
        return;
      }
      setError("Nao foi possivel gerar o pagamento. Tente novamente.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel iniciar a compra");
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleBuyMoneyPix(product: Product) {
    setError(null);
    setBusyProductId(product.id);
    try {
      const order = await apiRequest<ProductOrder>(`/products/${product.id}/checkout-money-pix`, { method: "POST" });
      setCopiedPix(false);
      setPixOrder(order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel gerar o Pix");
    } finally {
      setBusyProductId(null);
    }
  }

  async function cancelPixOrder() {
    if (!pixOrder) return;

    try {
      await apiRequest<ProductOrder>(`/orders/${pixOrder.id}/cancel`, { method: "POST" });
      setPixOrder(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel cancelar o pedido Pix");
    }
  }

  async function copyPixCode() {
    if (!pixOrder?.pixQrCode) return;
    await navigator.clipboard.writeText(pixOrder.pixQrCode);
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
              🛍️
            </span>
            <h1 className="text-3xl font-black text-white">Loja de Produtos</h1>
          </div>
          <p className="mt-2 text-sm font-medium text-white/65">Troque fichas, pontos ou dinheiro por produtos.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center ring-1 ring-white/15">
              <p className="text-lg font-black text-brand-yellow">{navbar?.creditBalance ?? 0}</p>
              <p className="text-[11px] font-bold uppercase text-white/50">Fichas</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center ring-1 ring-white/15">
              <p className="text-lg font-black text-brand-yellow">{navbar?.pointsBalance ?? 0}</p>
              <p className="text-[11px] font-bold uppercase text-white/50">Pontos</p>
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
      {successMessage && (
        <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{successMessage}</p>
      )}

      {!loading && products.length === 0 && (
        <div className="rounded-3xl bg-white/85 p-8 text-center shadow-sm">
          <p className="text-3xl">🛍️</p>
          <p className="mt-2 font-black text-brand-black">Nenhum produto disponível</p>
          <p className="text-sm text-gray-500">Volte em breve para novidades.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            busy={busyProductId === product.id}
            onBuyCredits={handleBuyCredits}
            onBuyPoints={handleBuyPoints}
            onBuyMoney={handleBuyMoney}
            onBuyMoneyPix={handleBuyMoneyPix}
          />
        ))}
      </div>

      {pixOrder && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 px-4 pb-4 sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-orange-600">Pix gerado</p>
                <h2 className="text-2xl font-black text-brand-black">Pague para garantir o produto</h2>
              </div>
              <button
                type="button"
                onClick={cancelPixOrder}
                className="rounded-full bg-gray-100 px-3 py-2 text-sm font-black text-gray-600"
              >
                X
              </button>
            </div>

            <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-center text-white">
              {pixOrder.pixQrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${pixOrder.pixQrCodeBase64}`}
                  alt="QR Code Pix"
                  className="mx-auto h-64 w-64 rounded-2xl bg-white p-3"
                />
              ) : (
                <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-2xl bg-white p-3 text-sm font-bold text-brand-black">
                  Copie o codigo Pix abaixo
                </div>
              )}
              <p className="mt-3 text-sm font-bold text-white/70">
                Aguardando pagamento. Assim que confirmar, o pedido entra na fila de entrega.
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
              onClick={cancelPixOrder}
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
