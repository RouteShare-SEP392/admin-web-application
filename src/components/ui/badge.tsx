import type { ReactNode } from "react";
import type { Tone } from "@/lib/labels";
import { cn } from "@/lib/utils";

const TONES: Record<Tone, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  good: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  bad: "bg-red-50 text-red-700 ring-red-200",
  active: "bg-blue-50 text-blue-700 ring-blue-200",
  neutral: "bg-gray-100 text-gray-700 ring-gray-200",
};

const DOTS: Record<Tone, string> = {
  pending: "bg-amber-500",
  good: "bg-emerald-500",
  bad: "bg-red-500",
  active: "bg-blue-500",
  neutral: "bg-gray-400",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[tone])} aria-hidden />
      {children}
    </span>
  );
}

export function StatusBadge({ meta }: { meta: { label: string; tone: Tone } }) {
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
