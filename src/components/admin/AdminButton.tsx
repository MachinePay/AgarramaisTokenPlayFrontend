import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-yellow text-brand-black shadow-sm",
  secondary: "border border-gray-200 bg-white text-brand-black hover:bg-surface-soft",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
};

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function AdminButton({ variant = "secondary", className = "", ...props }: AdminButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${className}`}
    />
  );
}
