import React from 'react';
import { CalendarDays } from 'lucide-react';

import type { Category, Material, PlanItem } from '../../types';
import { cn } from '../ui/utils';
import { PlanItemCard } from './PlanItemCard';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];

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
  const dayItems = items
    .filter((item) => item.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime - b.startTime);

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
          dayItems.map((item) => (
            <PlanItemCard
              key={item.id}
              item={item}
              category={item.categoryId ? categoriesById.get(item.categoryId) : undefined}
              material={item.materialId ? materialsById.get(item.materialId) : undefined}
              onEdit={item.type === 'study' ? onEditItem : onEditLifestyle}
              onToggleDone={item.type === 'study' ? onToggleDone : undefined}
            />
          ))
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
