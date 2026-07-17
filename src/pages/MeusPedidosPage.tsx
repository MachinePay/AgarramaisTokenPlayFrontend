import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { ProductOrder, ProductOrderStatus } from "@/lib/types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: ProductOrderStatus): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Aguardando pagamento";
    case "AWAITING_DELIVERY":
      return "A receber";
    case "DELIVERED":
      return "Entregue";
    case "CANCELED":
      return "Cancelado";
    case "FAILED":
      return "Pagamento nao aprovado";
    default:
      return status;
  }
}

function statusTone(status: ProductOrderStatus): string {
  switch (status) {
    case "AWAITING_DELIVERY":
      return "bg-amber-100 text-amber-700";
    case "PENDING_PAYMENT":
      return "bg-blue-100 text-blue-700";
    case "DELIVERED":
      return "bg-green-100 text-green-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

function paymentLabel(order: ProductOrder): string {
  if (order.paymentMethod === "CREDITS") return `${order.creditsSpent} fichas`;
  if (order.paymentMethod === "POINTS") return `${order.pointsSpent} pontos`;
  return `R$ ${Number(order.amountBrl ?? 0).toFixed(2)}`;
}

function OrderCard({ order }: { order: ProductOrder }) {
  return (
    <div className="rounded-3xl bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-brand-black">{order.productName}</p>
          <p className="mt-1 text-sm font-bold text-amber-700">{paymentLabel(order)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(order.status)}`}>
            {statusLabel(order.status)}
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

export function MeusPedidosPage() {
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ProductOrder[]>("/orders")
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const pending = orders.filter((order) => order.status === "PENDING_PAYMENT" || order.status === "AWAITING_DELIVERY");
  const history = orders.filter((order) => order.status !== "PENDING_PAYMENT" && order.status !== "AWAITING_DELIVERY");

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.22)]">
        <span aria-hidden className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-yellow/30" />
        <span aria-hidden className="absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-orange-500/20" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-3xl">
              📦
            </span>
            <h1 className="text-3xl font-black text-white">Meus produtos a receber</h1>
          </div>
          <p className="mt-2 text-sm font-medium text-white/65">Acompanhe seus pedidos da Loja de Produtos.</p>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl bg-white/85 p-8 text-center text-sm font-bold text-gray-500 shadow-sm">
          Carregando pedidos...
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="rounded-3xl bg-white/85 p-8 text-center shadow-sm">
          <p className="text-3xl">📦</p>
          <p className="mt-2 font-black text-brand-black">Nenhum pedido ainda</p>
          <p className="text-sm text-gray-500">Visite a Loja de Produtos para trocar fichas, pontos ou dinheiro.</p>
        </div>
      )}

      {!loading && pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-black text-brand-black">A receber</h2>
          {pending.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      )}

      {!loading && history.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-black text-brand-black">Historico</h2>
          {history.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      )}
    </div>
  );
}
