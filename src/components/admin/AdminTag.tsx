import type { ReactNode } from "react";

type Tone = "green" | "gray" | "amber" | "red" | "black";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-50 text-green-700",
  gray: "bg-gray-100 text-gray-500",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  black: "bg-brand-black text-white",
};

export function AdminTag({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
