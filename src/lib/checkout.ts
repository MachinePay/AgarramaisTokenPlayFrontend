export type PendingCheckoutKind = "transaction" | "order";

export type PendingCheckout = {
  kind: PendingCheckoutKind;
  id: string;
};

const PENDING_CHECKOUT_KEY = "agarramais.pendingCheckout";

export function setPendingCheckout(checkout: PendingCheckout | null): void {
  if (checkout) {
    window.localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(checkout));
  } else {
    window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
  }
}

export function getPendingCheckout(): PendingCheckout | null {
  const raw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingCheckout;
    return parsed.kind && parsed.id ? parsed : null;
  } catch {
    return null;
  }
}

/** Compat: compra de fichas (Loja de Fichas) sempre usou esse par de helpers. */
export function setPendingTransactionId(transactionId: string | null): void {
  setPendingCheckout(transactionId ? { kind: "transaction", id: transactionId } : null);
}

export function getPendingTransactionId(): string | null {
  const pending = getPendingCheckout();
  return pending?.kind === "transaction" ? pending.id : null;
}

export function setPendingOrderId(orderId: string | null): void {
  setPendingCheckout(orderId ? { kind: "order", id: orderId } : null);
}

export function getPendingOrderId(): string | null {
  const pending = getPendingCheckout();
  return pending?.kind === "order" ? pending.id : null;
}
