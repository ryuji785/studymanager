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
        <p className="text-sm text-slate-500">{label}</p>
        <div className={cn("text-3xl font-semibold text-slate-900", valueClassName)}>{value}</div>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
