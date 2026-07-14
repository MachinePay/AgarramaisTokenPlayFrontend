import { create } from "zustand";
import { apiRequest, getToken, setToken } from "@/lib/api";
import type { AuthResponse, UserNavbarSummary } from "@/lib/types";

type AuthState = {
  token: string | null;
  navbar: UserNavbarSummary | null;
  loading: boolean;
  /** Incrementa a cada vez que o saldo sobe - usado como "key" para replayar a celebracao do navbar. */
  balanceBump: number;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; cpf: string; password: string }) => Promise<void>;
  logout: () => void;
  fetchNavbarSummary: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getToken(),
  navbar: null,
  loading: false,
  balanceBump: 0,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      setToken(data.token);
      set({ token: data.token });
      await get().fetchNavbarSummary();
    } finally {
      set({ loading: false });
    }
  },

  register: async (input) => {
    set({ loading: true });
    try {
      const data = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: input,
        auth: false,
      });
      setToken(data.token);
      set({ token: data.token });
      await get().fetchNavbarSummary();
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    setToken(null);
    set({ token: null, navbar: null });
  },

  fetchNavbarSummary: async () => {
    const previous = get().navbar;
    const navbar = await apiRequest<UserNavbarSummary>("/users/me");
    const gainedCredits = previous ? navbar.creditBalance > previous.creditBalance : false;
    set((state) => ({ navbar, balanceBump: gainedCredits ? state.balanceBump + 1 : state.balanceBump }));
  },
}));
