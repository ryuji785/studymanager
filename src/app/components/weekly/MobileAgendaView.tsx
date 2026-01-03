import React from 'react';
import { CalendarDays } from 'lucide-react';

import type { Category, Material, PlanItem } from '../../types';
import { formatMinutes, minutesToTimeString, normalizeDisplayRange } from '../../utils/time';
import { cn } from '../ui/utils';
import { PlanItemCard } from './PlanItemCard';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const START_MINUTES = 6 * 60;
const TOTAL_MINUTES = 24 * 60;

type AgendaSegment =
  | { kind: 'item'; start: number; item: PlanItem }
  | { kind: 'gap'; start: number; duration: number };

function formatTimeRange(startTime: number, duration: number) {
  const endTime = startTime + duration;
  return `${minutesToTimeString(startTime)}〜${minutesToTimeString(endTime)}`;
}

function buildDaySegments(dayItems: PlanItem[]) {
  const axisStart = START_MINUTES;
  const axisEnd = START_MINUTES + TOTAL_MINUTES;
  const entries = dayItems
    .map((item) => {
      const { start: displayStart, end: displayEnd } = normalizeDisplayRange(item.startTime, item.duration, START_MINUTES);
      const clippedStart = Math.max(displayStart, axisStart);
      const clippedEnd = Math.min(displayEnd, axisEnd);
      if (clippedEnd <= clippedStart) return null;
      return { item, displayStart: clippedStart, displayEnd: clippedEnd };
    })
    .filter((entry): entry is { item: PlanItem; displayStart: number; displayEnd: number } => entry !== null)
    .sort((a, b) => (a.displayStart === b.displayStart ? a.displayEnd - b.displayEnd : a.displayStart - b.displayStart));

  const merged: Array<{ start: number; end: number }> = [];
  entries.forEach((entry) => {
    const last = merged[merged.length - 1];
    if (!last || entry.displayStart > last.end) {
      merged.push({ start: entry.displayStart, end: entry.displayEnd });
    } else {
      last.end = Math.max(last.end, entry.displayEnd);
    }
  });

  const gaps: Array<{ start: number; duration: number }> = [];
  let cursor = axisStart;
  merged.forEach((interval) => {
    if (interval.start > cursor) {
      gaps.push({ start: cursor, duration: interval.start - cursor });
    }
    cursor = Math.max(cursor, interval.end);
  });
  if (cursor < axisEnd) {
    gaps.push({ start: cursor, duration: axisEnd - cursor });
  }

  return [
    ...entries.map((entry) => ({ kind: 'item' as const, start: entry.displayStart, item: entry.item })),
    ...gaps.map((gap) => ({ kind: 'gap' as const, start: gap.start, duration: gap.duration })),
  ].sort((a, b) => a.start - b.start);
}

export function MobileAgendaView({
  items,
  categories,
  materials,
  selectedDay,
  onSelectDay,
  onEditItem,
  onEditLifestyle,
  onToggleDone,
  onAddItem,
}: {
  items: PlanItem[];
  categories: Category[];
  materials: Material[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onEditItem: (item: PlanItem) => void;
  onEditLifestyle: (item: PlanItem) => void;
  onToggleDone: (item: PlanItem) => void;
  onAddItem: () => void;
}) {
  const dayItems = React.useMemo(
    () => items.filter((item) => item.dayOfWeek === selectedDay).sort((a, b) => a.startTime - b.startTime),
    [items, selectedDay],
  );
  const daySegments = React.useMemo(() => buildDaySegments(dayItems), [dayItems]);

  const categoriesById = React.useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const materialsById = React.useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  return (
    <div className="relative space-y-4 pb-24">
      <div className="flex items-center gap-2 overflow-x-auto rounded-full bg-muted p-1">
        {DAYS.map((day, index) => (
          <button
            key={day}
            type="button"
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-full px-4 text-sm font-medium transition',
              selectedDay === index
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-white/70',
            )}
            onClick={() => onSelectDay(index)}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-3 touch-pan-y">
        {dayItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>この日の予定はまだありません。</span>
            </div>
            <p className="mt-2 text-xs">右下の「＋」から学習ブロックを追加できます。</p>
          </div>
        ) : (
          daySegments.map((segment) => {
            if (segment.kind === 'gap') {
              const isShort = segment.duration < 15;
              const isNormal = segment.duration >= 30 && segment.duration <= 90;
              const isLong = segment.duration >= 120;
              const labelClasses = [
                'rounded-full px-2 py-0.5 text-[10px]',
                isShort ? 'bg-indigo-100/70 text-indigo-400 opacity-70' : '',
                isNormal ? 'bg-indigo-200/80 text-indigo-700' : '',
                isLong ? 'bg-indigo-300 text-indigo-900 font-semibold shadow-sm' : '',
                !isShort && !isNormal && !isLong ? 'bg-indigo-100/80 text-indigo-600' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={`gap-${segment.start}`}
                  className="rounded-2xl border border-indigo-200/70 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-700 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{formatTimeRange(segment.start, segment.duration)}</div>
                    <span className={labelClasses}>{formatMinutes(segment.duration)}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-indigo-500">空き時間</div>
                </div>
              );
            }

            const item = segment.item;
            return (
              <PlanItemCard
                key={item.id}
                item={item}
                category={item.categoryId ? categoriesById.get(item.categoryId) : undefined}
                material={item.materialId ? materialsById.get(item.materialId) : undefined}
                onEdit={item.type === 'study' ? onEditItem : onEditLifestyle}
                onToggleDone={item.type === 'study' ? onToggleDone : undefined}
              />
            );
          })
        )}
      </div>

      <button
        type="button"
        className={cn(
          'fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02]',
          'touch-manipulation',
        )}
        aria-label="学習ブロックを追加"
        onClick={onAddItem}
      >
        <span className="text-3xl leading-none">＋</span>
      </button>
    </div>
  );
}
