import React from 'react';
import { CalendarDays } from 'lucide-react';

import type { Category, Material, PlanItem } from '../../types';
import { minutesToTimeString } from '../../utils/time';
import { cn } from '../ui/utils';
import { PlanItemCard } from './PlanItemCard';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const SLOT_MINUTES = 30;
const START_MINUTES = 6 * 60;
const END_MINUTES = 24 * 60;

function buildSlots() {
  const slots: Array<{ startTime: number; label: string; isHour: boolean }> = [];
  for (let minutes = START_MINUTES; minutes < END_MINUTES; minutes += SLOT_MINUTES) {
    const label = minutesToTimeString(minutes % 1440);
    slots.push({ startTime: minutes, label, isHour: minutes % 60 === 0 });
  }
  return slots;
}

export function TabletHybridView({
  items,
  categories,
  materials,
  selectedDay,
  onSelectDay,
  onSelectSlot,
  onEditItem,
  onToggleDone,
}: {
  items: PlanItem[];
  categories: Category[];
  materials: Material[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSelectSlot: (startTime: number) => void;
  onEditItem: (item: PlanItem) => void;
  onToggleDone: (item: PlanItem) => void;
}) {
  const slots = React.useMemo(buildSlots, []);
  const dayItems = items
    .filter((item) => item.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime - b.startTime);
  const categoriesById = React.useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const materialsById = React.useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  return (
    <div className="space-y-4">
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

      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <div className="rounded-2xl border border-border/60 bg-white">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div className="text-sm font-semibold text-foreground">当日のタイムライン</div>
            <span className="text-xs text-muted-foreground">タップして追加</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto touch-pan-y">
            {slots.map((slot) => (
              <button
                key={slot.startTime}
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2 text-left transition',
                  'min-h-[44px] border-b border-dashed border-border/40',
                  'hover:bg-muted/40 touch-manipulation',
                )}
                onPointerUp={() => onSelectSlot(slot.startTime)}
              >
                <span className={cn('w-12 text-xs font-medium', slot.isHour ? 'text-foreground' : 'text-muted-foreground')}>
                  {slot.label}
                </span>
                <span className="text-xs text-muted-foreground">＋ 追加</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays className="h-4 w-4" />
              ブロック一覧
            </div>
            <span className="text-xs text-muted-foreground">{dayItems.length}件</span>
          </div>
          <div className="space-y-3 touch-pan-y">
            {dayItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-white px-4 py-6 text-center text-xs text-muted-foreground">
                予定がまだありません。左のタイムラインから追加できます。
              </div>
            ) : (
              dayItems.map((item) => (
                <PlanItemCard
                  key={item.id}
                  item={item}
                  category={item.categoryId ? categoriesById.get(item.categoryId) : undefined}
                  material={item.materialId ? materialsById.get(item.materialId) : undefined}
                  onEdit={onEditItem}
                  onToggleDone={onToggleDone}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
