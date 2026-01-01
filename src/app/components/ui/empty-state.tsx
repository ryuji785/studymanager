import React from "react";

import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "./utils";

type Action = {
  label: string;
  onClick: () => void;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

export function EmptyState({
  icon,
  title,
  description,
  actions = [],
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: Action[];
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed border-slate-200", className)}>
      <CardContent className="py-10 text-center space-y-4">
        {icon ? (
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            {icon}
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-900">{title}</p>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant={action.variant ?? "default"}
                className={cn(action.variant === "outline" ? "bg-white" : "")}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
