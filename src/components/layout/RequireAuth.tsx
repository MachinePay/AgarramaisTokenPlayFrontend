import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { AppShell } from "@/components/layout/AppShell";

export function RequireAuth({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const token = useAuthStore((state) => state.token);
  const navbar = useAuthStore((state) => state.navbar);
  const fetchNavbarSummary = useAuthStore((state) => state.fetchNavbarSummary);

  useEffect(() => {
    if (token && !navbar) {
      fetchNavbarSummary().catch(() => {});
    }
  }, [token, navbar, fetchNavbarSummary]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <AppShell wide={wide}>{children}</AppShell>;
}
