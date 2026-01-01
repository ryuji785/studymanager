import React from "react";

import { cn } from "./utils";

export function Chip({
  children,
  className,
  variant = "outline",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "outline" | "filled" | "muted";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium";
  const variants: Record<string, string> = {
    outline: "border-slate-200 text-slate-600 bg-white",
    filled: "border-transparent bg-slate-100 text-slate-700",
    muted: "border-slate-100 text-slate-500 bg-slate-50",
  };
  return <span className={cn(base, variants[variant], className)}>{children}</span>;
}
