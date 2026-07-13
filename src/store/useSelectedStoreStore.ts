import { create } from "zustand";
import { persist } from "zustand/middleware";

type SelectedStoreState = {
  storeId: string | null;
  storeName: string | null;
  selectStore: (storeId: string, storeName: string) => void;
  clearStore: () => void;
};

export const useSelectedStoreStore = create<SelectedStoreState>()(
  persist(
    (set) => ({
      storeId: null,
      storeName: null,
      selectStore: (storeId, storeName) => set({ storeId, storeName }),
      clearStore: () => set({ storeId: null, storeName: null }),
    }),
    { name: "agarramais.selected-store" },
  ),
);
