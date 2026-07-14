import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { GameplayLog, Transaction } from "@/lib/types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function HistoricoPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gameplay, setGameplay] = useState<GameplayLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest<Transaction[]>("/transactions"), apiRequest<GameplayLog[]>("/gameplay")])
      .then(([transactionsData, gameplayData]) => {
        setTransactions(transactionsData);
        setGameplay(gameplayData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div>
        <h1 className="text-xl font-bold text-brand-black">Historico</h1>
        <p className="text-sm text-gray-500">Compras e jogadas recentes.</p>
      </div>

      {loading && <p className="py-8 text-center text-sm text-gray-500">Carregando historico...</p>}

      {!loading && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-brand-black">Compras</h2>
            {transactions.length === 0 && <p className="text-sm text-gray-500">Nenhuma compra ainda.</p>}
            {transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-black">R$ {Number(transaction.amountBrl).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{transaction.creditsAwarded} creditos</p>
                  </div>
                  <span className="rounded-lg bg-surface-soft px-2 py-1 text-xs font-bold text-brand-black">
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-brand-black">Jogadas</h2>
            {gameplay.length === 0 && <p className="text-sm text-gray-500">Nenhuma jogada ainda.</p>}
            {gameplay.map((log) => (
              <div key={log.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-black">{log.machine.name}</p>
                    <p className="text-sm text-gray-500">
                      {log.machine.store.name} - {log.creditsDebited} creditos - {log.pulsesSent} pulsos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-brand-black">{log.status}</p>
                    <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
