import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-gradient-to-r from-brand-yellow to-orange-400 text-brand-black shadow-[0_10px_22px_rgba(245,158,11,0.26)] hover:brightness-[1.03]",
  secondary: "border border-gray-200 bg-white text-brand-black shadow-sm hover:bg-amber-50 hover:border-amber-200",
  danger: "border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50",
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
