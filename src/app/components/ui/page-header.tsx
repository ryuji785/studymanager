import React from "react";

import { cn } from "./utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4 mb-6", className)}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground leading-relaxed">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
