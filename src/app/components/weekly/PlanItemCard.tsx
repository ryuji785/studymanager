import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

import type { Category, Material, PlanItem } from '../../types';
import { minutesToTimeString } from '../../utils/time';
import { cn } from '../ui/utils';

const TAP_THRESHOLD = 8;

type TapState = {
  x: number;
  y: number;
  moved: boolean;
};

function normalizeLabel(value?: string | null) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[?？]+$/.test(trimmed)) return '';
  return trimmed;
}

export function PlanItemCard({
  item,
  category,
  material,
  onEdit,
  onToggleDone,
  className,
}: {
  item: PlanItem;
  category?: Category;
  material?: Material;
  onEdit: (item: PlanItem) => void;
  onToggleDone: (item: PlanItem) => void;
  className?: string;
}) {
  const startLabel = minutesToTimeString(item.startTime);
  const endLabel = minutesToTimeString(item.startTime + item.duration);
  const categoryName = normalizeLabel(category?.name) || '学習';
  const materialName = normalizeLabel(material?.name);
  const title = normalizeLabel(item.label) || materialName || categoryName;

  const tapStateRef = React.useRef<TapState | null>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-sm transition hover:shadow-md',
        'min-h-[64px] touch-manipulation',
        className,
      )}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        tapStateRef.current = {
          x: event.clientX,
          y: event.clientY,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        const state = tapStateRef.current;
        if (!state) return;
        const dx = Math.abs(event.clientX - state.x);
        const dy = Math.abs(event.clientY - state.y);
        if (dx > TAP_THRESHOLD || dy > TAP_THRESHOLD) {
          state.moved = true;
        }
      }}
      onPointerUp={(event) => {
        const state = tapStateRef.current;
        tapStateRef.current = null;
        if (!state || state.moved) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        onEdit(item);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onEdit(item);
        }
      }}
      aria-label={`${title} ${startLabel}から${endLabel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">
            {startLabel} - {endLabel}（{item.duration}分）
          </div>
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{categoryName}</div>
        </div>
        <button
          type="button"
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full border border-border/60',
            'touch-manipulation transition',
            item.status === 'done'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-white text-slate-400 hover:bg-slate-50',
          )}
          aria-label={item.status === 'done' ? '完了を解除' : '完了にする'}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onToggleDone(item);
          }}
        >
          {item.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
