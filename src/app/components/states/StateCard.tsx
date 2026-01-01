import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

type Tone = 'neutral' | 'info' | 'danger';

type Action = {
  label: string;
  onClick: () => void;
  variant?: React.ComponentProps<typeof Button>['variant'];
  icon?: React.ReactNode;
};

const toneStyles: Record<Tone, { iconWrap: string; title: string; card: string }> = {
  neutral: {
    iconWrap: 'bg-slate-50 text-slate-600 border-slate-200',
    title: 'text-slate-900',
    card: 'border-dashed border-slate-100 bg-white',
  },
  info: {
    iconWrap: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    title: 'text-slate-900',
    card: 'border-dashed border-indigo-100 bg-white',
  },
  danger: {
    iconWrap: 'bg-red-50 text-red-700 border-red-200',
    title: 'text-slate-900',
    card: 'border-red-100 bg-white',
  },
};

export function StateCard({
  tone = 'neutral',
  icon,
  title,
  description,
  actions = [],
  children,
  className,
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: Action[];
  children?: React.ReactNode;
  className?: string;
}) {
  const styles = toneStyles[tone];

  return (
    <Card className={cn('border-2', styles.card, className)}>
      <CardContent className="pt-10 pb-10 text-center">
        {icon && (
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border',
              styles.iconWrap,
            )}
          >
            {icon}
          </div>
        )}
        <h2 className={cn('text-xl mb-2', styles.title)}>{title}</h2>
        {description && <div className="text-slate-500 mb-6 text-sm">{description}</div>}
        {children}
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
            {actions.map((action) => (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant={action.variant ?? 'default'}
                className={cn(action.variant === 'outline' ? 'bg-white' : '')}
              >
                {action.icon ? <span className="mr-2 inline-flex">{action.icon}</span> : null}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
