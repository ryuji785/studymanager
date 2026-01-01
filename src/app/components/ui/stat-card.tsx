import React from "react";

import { Card, CardContent } from "./card";
import { cn } from "./utils";

export function StatCard({
  label,
  value,
  helper,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <Card className={cn("min-h-[120px]", className)}>
      <CardContent className="pt-6 space-y-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn("text-3xl font-semibold text-foreground", valueClassName)}>{value}</div>
        {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
