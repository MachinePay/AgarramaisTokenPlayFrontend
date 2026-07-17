import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { getPendingCheckout, setPendingCheckout } from "@/lib/checkout";
import type { ProductOrder, Transaction } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";

type CheckoutRetornoPageProps = {
  expectedStatus: "success" | "pending" | "failure";
};

function getResourceIdFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("external_reference") || params.get("transaction_id") || getPendingCheckout()?.id || null;
}

function getPaymentIdFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("payment_id") || params.get("collection_id");
}

export function CheckoutRetornoPage({ expectedStatus }: CheckoutRetornoPageProps) {
  const location = useLocation();
  const fetchNavbarSummary = useAuthStore((state) => state.fetchNavbarSummary);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [order, setOrder] = useState<ProductOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resourceId = useMemo(() => getResourceIdFromSearch(location.search), [location.search]);
  const paymentId = useMemo(() => getPaymentIdFromSearch(location.search), [location.search]);
  const kind = useMemo(() => getPendingCheckout()?.kind ?? "transaction", []);

  useEffect(() => {
    if (!resourceId) {
      setLoading(false);
      setError("Nao encontramos a compra desta transacao.");
      return;
    }

    let active = true;
    let attempts = 0;

    async function loadResource() {
      attempts += 1;
      try {
        const paymentQuery = paymentId ? `?payment_id=${encodeURIComponent(paymentId)}` : "";
        const path = kind === "order" ? `/orders/${resourceId}${paymentQuery}` : `/transactions/${resourceId}${paymentQuery}`;

        if (kind === "order") {
          const data = await apiRequest<ProductOrder>(path);
          if (!active) return;
          setOrder(data);
          setError(null);
          setLoading(false);

          if (data.status === "AWAITING_DELIVERY" || data.status === "DELIVERED") {
            setPendingCheckout(null);
            fetchNavbarSummary().catch(() => {});
            return;
          }
          if (data.status === "FAILED" || attempts >= 10) return;
        } else {
          const data = await apiRequest<Transaction>(path);
          if (!active) return;
          setTransaction(data);
          setError(null);
          setLoading(false);

          if (data.status === "APPROVED") {
            setPendingCheckout(null);
            fetchNavbarSummary().catch(() => {});
            return;
          }
          if (data.status === "FAILED" || attempts >= 10) return;
        }

        window.setTimeout(loadResource, 3000);
      } catch {
        if (!active) return;
        setError("Nao foi possivel consultar o status do pagamento.");
        setLoading(false);
      }
    }

    loadResource();

    return () => {
      active = false;
    };
  }, [fetchNavbarSummary, kind, paymentId, resourceId]);

  const approved = kind === "order" ? order?.status === "AWAITING_DELIVERY" || order?.status === "DELIVERED" : transaction?.status === "APPROVED";
  const failed =
    (kind === "order" ? order?.status === "FAILED" : transaction?.status === "FAILED") || expectedStatus === "failure";

  return (
    <div className="flex min-h-[calc(100dvh-74px)] flex-col justify-center gap-5 px-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft text-3xl">
        {approved ? "✓" : failed ? "!" : "..."}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brand-black">
          {approved ? "Pagamento aprovado" : failed ? "Pagamento nao aprovado" : "Aguardando pagamento"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {approved
            ? kind === "order"
              ? `Pedido de "${order?.productName}" confirmado. Acompanhe a entrega em Meus Pedidos.`
              : `${transaction?.creditsAwarded} fichas foram adicionadas ao seu saldo.`
            : failed
              ? "A compra nao foi confirmada. Voce pode tentar novamente quando quiser."
              : "Estamos confirmando sua compra. Pix pode levar alguns instantes para aparecer."}
        </p>
      </div>

      {loading && <p className="text-sm text-gray-500">Consultando transacao...</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        <Link
          to={kind === "order" ? "/meus-pedidos" : "/lojas"}
          className="rounded-xl bg-brand-yellow py-3.5 text-base font-bold text-brand-black"
        >
          {kind === "order" ? "Ver meus pedidos" : "Ver maquinas"}
        </Link>
        <Link
          to="/fichas"
          className="rounded-xl border border-gray-200 py-3.5 text-base font-bold text-brand-black"
        >
          Comprar fichas
        </Link>
      </div>
    </div>
  );
}
