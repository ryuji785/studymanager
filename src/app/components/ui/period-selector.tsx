import * as React from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from './utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { formatPeriod } from '../../utils/date';

export type PeriodValue = { start: string; end: string };
export type PeriodMode = 'week' | 'range';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function parseIsoDate(value: string): Date | null {
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function PeriodSelector({
  value,
  onChange,
  mode = 'week',
  stepDays,
  weekStartsOn,
  disabled,
  className,
  onApply,
}: {
  value: PeriodValue;
  onChange: (next: PeriodValue) => void;
  mode?: PeriodMode;
  stepDays?: number;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  disabled?: boolean;
  className?: string;
  onApply?: () => void;
}) {
  const startDate = parseIsoDate(value.start);
  const endDate = parseIsoDate(value.end);
  const shiftDays =
    stepDays ??
    (startDate && endDate ? differenceInCalendarDays(endDate, startDate) + 1 : mode === 'week' ? 7 : 1);
  const weekStartsOnLabel = typeof weekStartsOn === 'number' ? WEEKDAY_LABELS[weekStartsOn] : null;

  const [open, setOpen] = React.useState(false);
  const [pendingWeekStart, setPendingWeekStart] = React.useState<Date | null>(null);
  const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>(() => {
    if (!startDate || !endDate) return undefined;
    return { from: startDate, to: endDate };
  });

  React.useEffect(() => {
    if (!open) return;
    if (!startDate || !endDate) {
      setPendingWeekStart(null);
      setPendingRange(undefined);
      return;
    }
    setPendingWeekStart(startDate);
    setPendingRange({ from: startDate, to: endDate });
  }, [open, startDate?.getTime(), endDate?.getTime()]);

  const canShift = Boolean(startDate && endDate);
  const pendingDiffDays =
    pendingRange?.from && pendingRange?.to ? differenceInCalendarDays(pendingRange.to, pendingRange.from) : null;
  const hasRangeLimitError = pendingDiffDays !== null && pendingDiffDays >= 7;

  const shift = (direction: -1 | 1) => {
    if (!startDate || !endDate) return;
    const nextStart = addDays(startDate, direction * shiftDays);
    const nextEnd = addDays(endDate, direction * shiftDays);
    onChange({ start: toIsoDate(nextStart), end: toIsoDate(nextEnd) });
  };

  const label = formatPeriod(value.start, value.end);

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || !canShift}
        onClick={() => shift(-1)}
        aria-label="前の期間"
        className="bg-white"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="bg-white justify-between min-w-[15rem] gap-2"
          >
            <span className="truncate tabular-nums">{label}</span>
            <CalendarDays className="w-4 h-4 text-gray-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          {mode === 'week' ? (
            <div className="space-y-2">
              <div className="px-2 pt-1 text-xs text-gray-600">
                {typeof weekStartsOn === 'number'
                  ? `開始日を選ぶと、${weekStartsOnLabel}始まりの週を自動で選択します。`
                  : '開始日を選ぶと、1週間（開始日〜6日後）の範囲が選択されます。'}
              </div>
              <Calendar
                mode="single"
                selected={pendingWeekStart ?? undefined}
                onSelect={(date) => {
                  if (!date) return;
                  const start = typeof weekStartsOn === 'number' ? startOfWeek(date, { weekStartsOn }) : date;
                  setPendingWeekStart(start);
                }}
                initialFocus
              />
              <div className="flex justify-end px-2 pb-2">
                <Button
                  type="button"
                  size="icon"
                  disabled={disabled || !pendingWeekStart}
                  aria-label="週の選択を確定"
                  onClick={() => {
                    if (!pendingWeekStart) return;
                    const end = addDays(pendingWeekStart, 6);
                    onChange({ start: toIsoDate(pendingWeekStart), end: toIsoDate(end) });
                    setOpen(false);
                    onApply?.();
                  }}
                >
                  <CalendarCheck2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-2 pt-1 text-xs text-gray-600">開始日と終了日を選択してください。</div>
              <Calendar
                mode="range"
                selected={pendingRange}
                onSelect={(next) => {
                  setPendingRange(next);
                }}
                numberOfMonths={2}
                initialFocus
              />
              {hasRangeLimitError ? (
                <p className="px-2 text-xs text-red-600">開始日と終了日の差は6日以内にしてください。</p>
              ) : null}
              <div className="flex justify-end px-2 pb-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || !pendingRange?.from || !pendingRange?.to || hasRangeLimitError}
                  onClick={() => {
                    if (!pendingRange?.from || !pendingRange?.to || hasRangeLimitError) return;
                    onChange({ start: toIsoDate(pendingRange.from), end: toIsoDate(pendingRange.to) });
                    setOpen(false);
                    onApply?.();
                  }}
                >
                  反映する
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || !canShift}
        onClick={() => shift(1)}
        aria-label="次の期間"
        className="bg-white"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
