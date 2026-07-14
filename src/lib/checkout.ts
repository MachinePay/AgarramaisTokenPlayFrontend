const PENDING_TRANSACTION_KEY = "agarramais.pendingTransactionId";

export function setPendingTransactionId(transactionId: string | null): void {
  if (transactionId) {
    window.localStorage.setItem(PENDING_TRANSACTION_KEY, transactionId);
  } else {
    window.localStorage.removeItem(PENDING_TRANSACTION_KEY);
  }
}

export function getPendingTransactionId(): string | null {
  return window.localStorage.getItem(PENDING_TRANSACTION_KEY);
}
