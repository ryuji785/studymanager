import React from "react";

import { cn } from "./utils";

export function PageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full max-w-[var(--app-content-max)] mx-auto space-y-6", className)}>
      {children}
    </div>
  );
}
