import type { ReactNode } from "react";
import { TopNavbar } from "@/components/layout/TopNavbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-viewport flex flex-col">
      <TopNavbar />
      <main className="flex-1 bg-white">{children}</main>
    </div>
  );
}
