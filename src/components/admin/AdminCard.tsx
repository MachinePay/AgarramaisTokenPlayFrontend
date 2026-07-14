import type { ReactNode } from "react";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] ${className}`}>
      {children}
    </div>
  );
}
