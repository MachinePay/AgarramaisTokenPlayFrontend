import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import type { MachineContext } from "@/lib/types";
import { PlayActivationModal } from "@/components/machines/PlayActivationModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useSelectedStoreStore } from "@/store/useSelectedStoreStore";

export function QrMaquinaPage() {
  const { machineId } = useParams<{ machineId: string }>();
  const navbar = useAuthStore((state) => state.navbar);
  const fetchNavbarSummary = useAuthStore((state) => state.fetchNavbarSummary);
  const selectStore = useSelectedStoreStore((state) => state.selectStore);
  const [context, setContext] = useState<MachineContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    if (!machineId) return;
    apiRequest<MachineContext>(`/machines/${machineId}/context`)
      .then((data) => {
        setContext(data);
        selectStore(data.store.id, data.store.name);
      })
      .finally(() => setLoading(false));
  }, [machineId, selectStore]);

  function handlePlaySuccess() {
    fetchNavbarSummary().catch(() => {});
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Carregando maquina...</p>;
  }

  if (!context) {
    return (
      <div className="flex flex-col gap-4 px-4 py-8 text-center">
        <p className="text-sm font-medium text-red-600">Maquina nao encontrada.</p>
        <Link to="/lojas" className="rounded-xl bg-brand-yellow py-3 text-sm font-bold text-brand-black">
          Ver lojas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div>
        <h1 className="text-xl font-bold text-brand-black">{context.machine.name}</h1>
        <p className="text-sm text-gray-500">{context.store.name}</p>
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={context.machine.status !== "AVAILABLE"}
        className="rounded-xl bg-brand-yellow py-3.5 text-base font-bold text-brand-black disabled:opacity-50"
      >
        Jogar nesta maquina
      </button>

      <Link to={`/lojas/${context.store.id}`} className="rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-brand-black">
        Ver outras maquinas da loja
      </Link>

      {modalOpen && (
        <PlayActivationModal
          machine={context.machine}
          creditBalance={navbar?.creditBalance ?? 0}
          onClose={() => setModalOpen(false)}
          onPlaySuccess={handlePlaySuccess}
        />
      )}
    </div>
  );
}
