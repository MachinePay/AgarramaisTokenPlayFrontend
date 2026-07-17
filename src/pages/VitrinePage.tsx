import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import type { Machine } from "@/lib/types";
import { MachineCard } from "@/components/machines/MachineCard";
import { PlayActivationModal } from "@/components/machines/PlayActivationModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useSelectedStoreStore } from "@/store/useSelectedStoreStore";

export function VitrinePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const storeName = useSelectedStoreStore((state) => state.storeName);
  const navbar = useAuthStore((state) => state.navbar);
  const fetchNavbarSummary = useAuthStore((state) => state.fetchNavbarSummary);

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const loadMachines = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    apiRequest<Machine[]>(`/stores/${storeId}/machines`)
      .then(setMachines)
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  function handlePlaySuccess() {
    loadMachines();
    fetchNavbarSummary().catch(() => {});
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="text-xl font-bold text-brand-black">{storeName ?? "Máquinas da loja"}</h1>

      {loading && <p className="py-8 text-center text-sm text-gray-500">Carregando máquinas...</p>}

      {!loading && machines.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">Nenhuma máquina cadastrada nesta loja.</p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {machines.map((machine) => (
          <MachineCard key={machine.id} machine={machine} onSelect={setSelectedMachine} />
        ))}
      </div>

      {selectedMachine && (
        <PlayActivationModal
          machine={selectedMachine}
          creditBalance={navbar?.creditBalance ?? 0}
          onClose={() => setSelectedMachine(null)}
          onPlaySuccess={handlePlaySuccess}
        />
      )}
    </div>
  );
}
