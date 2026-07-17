import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { AppShell } from "@/components/layout/AppShell";

export function RequireAuth({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const navbar = useAuthStore((state) => state.navbar);
  const privacyAcceptanceRequired = useAuthStore((state) => state.privacyAcceptanceRequired);
  const fetchNavbarSummary = useAuthStore((state) => state.fetchNavbarSummary);
  const fetchPrivacyStatus = useAuthStore((state) => state.fetchPrivacyStatus);

  useEffect(() => {
    if (token && !navbar) {
      fetchNavbarSummary().catch(() => {});
    }
    if (token && privacyAcceptanceRequired === null) {
      fetchPrivacyStatus().catch(() => {});
    }
  }, [token, navbar, privacyAcceptanceRequired, fetchNavbarSummary, fetchPrivacyStatus]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (privacyAcceptanceRequired && location.pathname !== "/aceite-privacidade") {
    return <Navigate to="/aceite-privacidade" replace />;
  }

  return <AppShell wide={wide}>{children}</AppShell>;
}
