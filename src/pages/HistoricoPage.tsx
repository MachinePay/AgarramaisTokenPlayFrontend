import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { GameplayLog } from "@/lib/types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function HistoricoPage() {
  const [gameplay, setGameplay] = useState<GameplayLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<GameplayLog[]>("/gameplay")
      .then(setGameplay)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.22)]">
        <span aria-hidden className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-yellow/30" />
        <span aria-hidden className="absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-orange-500/20" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-3xl">
              🕹️
            </span>
            <h1 className="text-3xl font-black text-white">Minhas jogadas</h1>
          </div>
          <p className="mt-2 text-sm font-medium text-white/65">Acompanhe apenas suas ativações recentes.</p>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl bg-white/85 p-8 text-center text-sm font-bold text-gray-500 shadow-sm">
          Carregando jogadas...
        </div>
      )}

      {!loading && gameplay.length === 0 && (
        <div className="rounded-3xl bg-white/85 p-8 text-center shadow-sm">
          <p className="text-3xl">🧸</p>
          <p className="mt-2 font-black text-brand-black">Nenhuma jogada ainda</p>
          <p className="text-sm text-gray-500">Escolha uma loja e ative uma máquina para começar.</p>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gameplay.map((log) => (
          <div key={log.id} className="rounded-3xl bg-white/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-black text-brand-black">{log.machine.name}</p>
                <p className="truncate text-sm font-semibold text-gray-500">{log.machine.store.name}</p>
                <p className="mt-1 text-sm font-bold text-amber-700">{log.pulsesSent} pulsos enviados</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{log.status}</p>
                <p className="mt-2 text-xs font-semibold text-gray-500">{formatDate(log.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
