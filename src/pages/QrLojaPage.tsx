import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import type { Store } from "@/lib/types";
import { useSelectedStoreStore } from "@/store/useSelectedStoreStore";

export function QrLojaPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const selectStore = useSelectedStoreStore((state) => state.selectStore);

  useEffect(() => {
    if (!storeId) return;
    apiRequest<Store[]>("/stores", { auth: false })
      .then((stores) => {
        const store = stores.find((item) => item.id === storeId);
        if (store) selectStore(store.id, store.name);
      })
      .catch(() => {});
  }, [selectStore, storeId]);

  if (!storeId) return <Navigate to="/lojas" replace />;

  return <Navigate to={`/lojas/${storeId}`} replace />;
}
