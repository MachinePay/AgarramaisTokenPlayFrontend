import type { FormHTMLAttributes, ReactNode } from "react";

type AdminFormSectionProps = FormHTMLAttributes<HTMLFormElement> & {
  title: string;
  children: ReactNode;
};

export function AdminFormSection({ title, children, className = "", ...props }: AdminFormSectionProps) {
  return (
    <form {...props} className={`grid gap-3 rounded-2xl bg-surface-soft p-4 ${className}`}>
      <p className="flex items-center gap-1.5 text-sm font-bold text-brand-black">
        <span className="text-brand-yellow" aria-hidden>
          ＋
        </span>
        {title}
      </p>
      {children}
    </form>
  );
}
