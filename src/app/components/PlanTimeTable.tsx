import React, { useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { Check, Circle, Trash2 } from 'lucide-react';

import type { Category, Material, PlanItem } from '../types';
import { cn } from './ui/utils';
import { minutesToTimeString } from '../utils/time';

interface PlanTimeTableProps {
  items: PlanItem[];
  categories: Category[];
  materials: Material[];
  weekStartDate?: string;
  editable?: boolean;
  allowLifestyleEdit?: boolean;
  className?: string;
  onItemClick?: (item: PlanItem) => void;
  onLifestyleEdit?: (item: PlanItem) => void;
  onEmptySlotClick?: (dayOfWeek: number, startTime: number) => void;
  onRangeSelect?: (dayOfWeek: number, startTime: number, duration: number) => void;
  onItemChange?: (item: PlanItem) => void;
  onItemDelete?: (item: PlanItem) => void;
}

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];

const START_MINUTES = 6 * 60; // 6:00
const SLOT_MINUTES = 30;
const TOTAL_MINUTES = 24 * 60; // 24h
const DAY_MINUTES = 24 * 60;
const SLOT_COUNT = TOTAL_MINUTES / SLOT_MINUTES; // 48
const SLOT_HEIGHT = 18;
const GRID_TEMPLATE_COLUMNS = '88px repeat(7, minmax(0, 1fr))';
const GRID_STYLE = { gridTemplateColumns: GRID_TEMPLATE_COLUMNS } as const;
const BLOCK_INSET = 1;
const SELECTION_DRAG_THRESHOLD = 6;

type Segment = {
  item: PlanItem;
  start: number;
  end: number;
  key: string;
};

type SegmentLayout = Segment & {
  columnIndex: number;
  columnCount: number;
};

type DragPreview = {
  id: string;
  dayOfWeek: number;
  startTime: number;
  duration: number;
};

type DragMode = 'drag' | 'resize';

type DragState = {
  mode: DragMode;
  item: PlanItem;
  dayOfWeek: number;
  startX: number;
  startY: number;
  startAxis: number;
  startDuration: number;
  previewStartTime: number;
  previewDuration: number;
  moved: boolean;
};

type SelectionState = {
  dayOfWeek: number;
  startAxis: number;
  currentAxis: number;
  startY: number;
  moved: boolean;
};

type ContextMenuState =
  | { x: number; y: number; kind: 'item'; item: PlanItem }
  | { x: number; y: number; kind: 'empty'; dayOfWeek: number; startTime: number };

function formatTimeLabel(minutesFromMidnight: number) {
  const h = Math.floor(minutesFromMidnight / 60) % 24;
  const m = minutesFromMidnight % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function normalizeLabel(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^[?？]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeStart(startTime: number) {
  const mod = startTime % DAY_MINUTES;
  return mod < 0 ? mod + DAY_MINUTES : mod;
}

function splitIntoDisplaySegments(startTime: number, duration: number) {
  const safeDuration = Math.max(0, duration);
  if (safeDuration === 0) return [];

  const start = normalizeStart(startTime);
  const end = start + safeDuration;
  const segments: Array<{ start: number; end: number }> = [];

  if (end <= DAY_MINUTES) {
    segments.push({ start, end });
  } else {
    segments.push({ start, end: DAY_MINUTES });
    segments.push({ start: 0, end: end - DAY_MINUTES });
  }

  const axisSegments: Array<{ start: number; end: number }> = [];
  segments.forEach((seg) => {
    if (seg.end <= START_MINUTES) {
      axisSegments.push({ start: seg.start + DAY_MINUTES, end: seg.end + DAY_MINUTES });
      return;
    }
    if (seg.start >= START_MINUTES) {
      axisSegments.push(seg);
      return;
    }
    axisSegments.push({ start: START_MINUTES, end: seg.end });
    axisSegments.push({ start: seg.start + DAY_MINUTES, end: START_MINUTES + DAY_MINUTES });
  });

  return axisSegments;
}

function buildSegments(item: PlanItem): Segment[] {
  return splitIntoDisplaySegments(item.startTime, item.duration).map((segment, index) => ({
    item,
    start: segment.start,
    end: segment.end,
    key: `${item.id}_${index}`,
  }));
}

function layoutSegments(segments: Segment[]): SegmentLayout[] {
  const sorted = [...segments].sort((a, b) => (a.start === b.start ? a.end - b.end : a.start - b.start));
  const layouts: SegmentLayout[] = [];

  let current: Array<Omit<SegmentLayout, 'columnCount'>> = [];
  let columnsEnd: number[] = [];

  sorted.forEach((seg) => {
    const hasActive = columnsEnd.some((end) => end > seg.start);
    if (!hasActive && current.length > 0) {
      const columnCount = columnsEnd.length || 1;
      current.forEach((entry) => layouts.push({ ...entry, columnCount }));
      current = [];
      columnsEnd = [];
    }

    let columnIndex = columnsEnd.findIndex((end) => end <= seg.start);
    if (columnIndex === -1) {
      columnIndex = columnsEnd.length;
      columnsEnd.push(seg.end);
    } else {
      columnsEnd[columnIndex] = seg.end;
    }

    current.push({ ...seg, columnIndex, columnCount: 0 });
  });

  if (current.length > 0) {
    const columnCount = columnsEnd.length || 1;
    current.forEach((entry) => layouts.push({ ...entry, columnCount }));
  }

  return layouts;
}

function getColumnStyle(columnIndex: number, columnCount: number) {
  const width = 100 / columnCount;
  const left = width * columnIndex;
  const gutter = columnCount > 1 ? 6 : 0;

  return {
    left: gutter > 0 ? `calc(${left}% + ${gutter / 2}px)` : `${left}%`,
    width: gutter > 0 ? `calc(${width}% - ${gutter}px)` : `${width}%`,
  } as React.CSSProperties;
}

function PlanItemBlock({
  item,
  height,
  category,
  material,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onResizeStart,
  onDelete,
  isSelected,
  forceTimeRange,
  isEditable,
  allowLifestyleEdit,
}: {
  item: PlanItem;
  height: number;
  category?: Category;
  material?: Material;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  onDragStart?: React.PointerEventHandler<HTMLDivElement>;
  onResizeStart?: React.PointerEventHandler<HTMLButtonElement>;
  onDelete?: () => void;
  isSelected?: boolean;
  forceTimeRange?: boolean;
  isEditable?: boolean;
  allowLifestyleEdit?: boolean;
}) {
  const startLabel = minutesToTimeString(item.startTime);
  const endLabel = minutesToTimeString(item.startTime + item.duration);
  const showTimeRange = height >= 48 || forceTimeRange;
  const showStatusText = height >= 36;

  const statusLabel = item.status === 'done' ? '完了' : '予定';
  const statusIcon = item.status === 'done' ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />;

  const categoryName = normalizeLabel(category?.name);
  const materialName = normalizeLabel(material?.name);
  const label = normalizeLabel(item.label);
  const title = label ?? materialName ?? categoryName ?? '学習';
  const badge = item.isAutoGenerated ? '自動' : null;

  const fallbackColor =
    item.type === 'study'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';
  const baseColor = category?.color ?? fallbackColor;
  const muted = item.type !== 'study' ? 'opacity-80' : '';

  const canEdit = isEditable && (item.type === 'study' || allowLifestyleEdit);

  return (
    <div
      className={cn(
        'group relative w-full rounded border cursor-pointer hover:shadow-sm transition-shadow overflow-hidden',
        baseColor,
        muted,
        isSelected ? 'ring-2 ring-indigo-400 shadow-md' : '',
      )}
      style={{ height: `${height}px` }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onPointerDown={onDragStart}
      title={`${startLabel}-${endLabel} ${title}`}
      role="button"
      aria-label={`${title} ${startLabel}-${endLabel}`}
      aria-selected={isSelected}
      data-plan-item
    >
      <div className="p-1.5 h-full flex flex-col text-xs">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="truncate flex-1">{title}</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {showStatusText && <span className="text-[10px] text-slate-500">{statusLabel}</span>}
            <span
              className={cn(
                'flex items-center justify-center w-4 h-4 rounded-full',
                item.status === 'done' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white',
              )}
              aria-label={statusLabel}
              title={statusLabel}
            >
              {statusIcon}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {categoryName ? <span>{categoryName}</span> : null}
          {badge ? <span className="px-1.5 py-0.5 rounded border border-slate-200 bg-white/70">{badge}</span> : null}
        </div>

        {showTimeRange && <div className="text-[10px] opacity-70 mt-auto">{startLabel}-{endLabel}</div>}
      </div>
      {canEdit && onDelete ? (
        <button
          type="button"
          className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-sm transition-opacity hover:text-rose-600"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label="予定を削除"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      ) : null}
      {canEdit ? (
        <button
          type="button"
          className="absolute bottom-0 left-1/2 h-3 w-12 -translate-x-1/2 cursor-ns-resize bg-transparent"
          onPointerDown={onResizeStart}
          aria-label="予定を伸縮する"
        >
          <span className="mx-auto block h-1 w-8 rounded-full bg-slate-400/60" />
        </button>
      ) : null}
    </div>
  );
}

export function PlanTimeTable({
  items,
  categories,
  materials,
  weekStartDate,
  editable = false,
  allowLifestyleEdit = false,
  className,
  onItemClick,
  onLifestyleEdit,
  onEmptySlotClick,
  onRangeSelect,
  onItemChange,
  onItemDelete,
}: PlanTimeTableProps) {
  const [dragPreview, setDragPreview] = React.useState<DragPreview | null>(null);
  const dragStateRef = React.useRef<DragState | null>(null);
  const lastDragAtRef = React.useRef(0);
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);
  const [clipboardItem, setClipboardItem] = React.useState<PlanItem | null>(null);
  const [selectionRange, setSelectionRange] = React.useState<{
    dayOfWeek: number;
    startAxis: number;
    endAxis: number;
  } | null>(null);
  const selectionRef = React.useRef<SelectionState | null>(null);
  const selectionCleanupRef = React.useRef<(() => void) | null>(null);
  const tableRef = React.useRef<HTMLDivElement | null>(null);
  const dayColumnRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const hoverSlotRef = React.useRef<{ dayOfWeek: number; startTime: number } | null>(null);
  const displayItems = useMemo(() => {
    if (!dragPreview) return items;
    return items.map((item) =>
      item.id === dragPreview.id
        ? { ...item, dayOfWeek: dragPreview.dayOfWeek, startTime: dragPreview.startTime, duration: dragPreview.duration }
        : item,
    );
  }, [items, dragPreview]);

  const slots = useMemo(() => {
    return Array.from({ length: SLOT_COUNT }).map((_, index) => {
      const minutes = START_MINUTES + index * SLOT_MINUTES;
      const minutesFromMidnight = minutes % 1440;
      const isHourBoundary = index % 2 === 1;
      const isHourLabel = minutesFromMidnight % 60 === 0;
      const label = formatTimeLabel(minutesFromMidnight);

      return {
        index,
        startTime: minutes,
        isHourBoundary,
        isHourLabel,
        label,
      };
    });
  }, []);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const materialMap = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
  const todayIndex = useMemo(() => {
    const jsDay = new Date().getDay(); // 0: Sun
    return (jsDay + 6) % 7;
  }, []);

  const weekDates = useMemo(() => {
    if (!weekStartDate) return null;
    const start = parseISO(weekStartDate);
    if (Number.isNaN(start.getTime())) return null;
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [weekStartDate]);
  const clampAxisStart = (value: number) =>
    Math.min(Math.max(value, START_MINUTES), START_MINUTES + TOTAL_MINUTES - SLOT_MINUTES);

  const clampDuration = (startAxis: number, value: number) => {
    const maxDuration = START_MINUTES + TOTAL_MINUTES - startAxis;
    return Math.min(Math.max(value, SLOT_MINUTES), maxDuration);
  };

  const canEditItem = (item: PlanItem) => editable && (item.type === 'study' || allowLifestyleEdit);

  const createCopiedItem = (source: PlanItem, dayOfWeek: number, startTime: number) => {
    const { actualDuration, ...rest } = source;
    return {
      ...rest,
      id: `copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      dayOfWeek,
      startTime,
      status: 'planned',
      isAutoGenerated: false,
    } satisfies PlanItem;
  };

  const pasteClipboardTo = (dayOfWeek: number, startTime: number) => {
    if (!clipboardItem || !onItemChange) return;
    if (!editable) return;
    if (clipboardItem.type !== 'study' && !allowLifestyleEdit) return;
    const nextItem = createCopiedItem(clipboardItem, dayOfWeek, startTime);
    onItemChange(nextItem);
    setSelectedItemId(nextItem.id);
  };

  const clearSelectionRange = () => {
    selectionRef.current = null;
    setSelectionRange(null);
    if (selectionCleanupRef.current) {
      selectionCleanupRef.current();
      selectionCleanupRef.current = null;
    }
  };

  const axisFromPointer = (dayIndex: number, clientY: number) => {
    const column = dayColumnRefs.current[dayIndex];
    if (!column) return null;
    const rect = column.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    const clampedOffset = Math.min(Math.max(offsetY, 0), SLOT_COUNT * SLOT_HEIGHT - 1);
    const slotIndex = Math.floor(clampedOffset / SLOT_HEIGHT);
    return START_MINUTES + slotIndex * SLOT_MINUTES;
  };

  const dayIndexFromPointer = (clientX: number) => {
    const columns = dayColumnRefs.current.filter(Boolean) as HTMLDivElement[];
    if (columns.length === 0) return null;
    for (let index = 0; index < columns.length; index += 1) {
      const rect = columns[index].getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return index;
      }
    }
    const firstRect = columns[0].getBoundingClientRect();
    const lastRect = columns[columns.length - 1].getBoundingClientRect();
    if (clientX < firstRect.left) return 0;
    if (clientX > lastRect.right) return columns.length - 1;
    return null;
  };

  const startSelection = (event: React.PointerEvent, dayIndex: number, startAxis: number) => {
    if (!editable) return;
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    clearSelectionRange();
    setSelectedItemId(null);
    setContextMenu(null);

    selectionRef.current = {
      dayOfWeek: dayIndex,
      startAxis,
      currentAxis: startAxis,
      startY: event.clientY,
      moved: false,
    };
    setSelectionRange({
      dayOfWeek: dayIndex,
      startAxis,
      endAxis: Math.min(startAxis + SLOT_MINUTES, START_MINUTES + TOTAL_MINUTES),
    });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = selectionRef.current;
      if (!state) return;
      const axis = axisFromPointer(state.dayOfWeek, moveEvent.clientY);
      if (axis === null) return;
      state.currentAxis = axis;
      if (Math.abs(moveEvent.clientY - state.startY) >= SELECTION_DRAG_THRESHOLD) {
        state.moved = true;
      }

      const minAxis = Math.min(state.startAxis, state.currentAxis);
      const maxAxis = Math.max(state.startAxis, state.currentAxis);
      const endAxis = Math.min(maxAxis + SLOT_MINUTES, START_MINUTES + TOTAL_MINUTES);
      setSelectionRange({
        dayOfWeek: state.dayOfWeek,
        startAxis: minAxis,
        endAxis,
      });
    };

    const handlePointerUp = () => {
      const state = selectionRef.current;
      clearSelectionRange();
      if (!state) return;

      const minAxis = Math.min(state.startAxis, state.currentAxis);
      const maxAxis = Math.max(state.startAxis, state.currentAxis);
      const endAxis = Math.min(maxAxis + SLOT_MINUTES, START_MINUTES + TOTAL_MINUTES);
      const duration = Math.max(SLOT_MINUTES, endAxis - minAxis);
      const startTime = minAxis % DAY_MINUTES;

      if (!state.moved) {
        onEmptySlotClick?.(state.dayOfWeek, startTime);
        return;
      }

      onRangeSelect?.(state.dayOfWeek, startTime, duration);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    selectionCleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  };

  const startInteraction = (event: React.PointerEvent, item: PlanItem, mode: DragMode) => {
    if (!editable || (item.type !== 'study' && !allowLifestyleEdit)) return;
    if (event.pointerType === 'touch') return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedItemId(item.id);
    setContextMenu(null);
    tableRef.current?.focus();

    const startAxis = item.startTime < START_MINUTES ? item.startTime + DAY_MINUTES : item.startTime;
    dragStateRef.current = {
      mode,
      item,
      dayOfWeek: item.dayOfWeek,
      startX: event.clientX,
      startY: event.clientY,
      startAxis,
      startDuration: item.duration,
      previewStartTime: item.startTime,
      previewDuration: item.duration,
      moved: false,
    };
    setDragPreview({
      id: item.id,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      duration: item.duration,
    });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;
      const deltaMinutes = Math.round((moveEvent.clientY - state.startY) / SLOT_HEIGHT) * SLOT_MINUTES;

      if (state.mode === 'drag') {
        const nextAxis = clampAxisStart(state.startAxis + deltaMinutes);
        const nextStart = nextAxis % DAY_MINUTES;
        const nextDay = dayIndexFromPointer(moveEvent.clientX);
        if (typeof nextDay === 'number') {
          state.dayOfWeek = nextDay;
        }
        state.previewStartTime = nextStart;
        state.previewDuration = state.startDuration;
        setDragPreview({
          id: state.item.id,
          dayOfWeek: state.dayOfWeek,
          startTime: nextStart,
          duration: state.startDuration,
        });
      } else {
        const nextDuration = clampDuration(state.startAxis, state.startDuration + deltaMinutes);
        state.previewStartTime = state.item.startTime;
        state.previewDuration = nextDuration;
        setDragPreview({
          id: state.item.id,
          dayOfWeek: state.dayOfWeek,
          startTime: state.item.startTime,
          duration: nextDuration,
        });
      }
      state.moved = true;
    };

    const handlePointerUp = () => {
      const state = dragStateRef.current;
      if (state?.moved && onItemChange) {
        onItemChange({
          ...state.item,
          dayOfWeek: state.dayOfWeek,
          startTime: state.previewStartTime,
          duration: state.previewDuration,
        });
        lastDragAtRef.current = Date.now();
      }
      dragStateRef.current = null;
      setDragPreview(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setSelectedItemId(null);
      setContextMenu(null);
      clearSelectionRange();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      const selectedItem = items.find((item) => item.id === selectedItemId);
      if (selectedItem && canEditItem(selectedItem)) {
        event.preventDefault();
        setClipboardItem(selectedItem);
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      const hoverSlot = hoverSlotRef.current;
      if (clipboardItem && hoverSlot) {
        event.preventDefault();
        pasteClipboardTo(hoverSlot.dayOfWeek, hoverSlot.startTime);
      }
      return;
    }

    if (!selectedItemId) return;
    const selectedItem = items.find((item) => item.id === selectedItemId);
    if (!selectedItem || !editable) return;
    if (selectedItem.type !== 'study' && !allowLifestyleEdit) return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onItemDelete?.(selectedItem);
      setSelectedItemId(null);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      onItemClick?.(selectedItem);
    }
  };

  const handleRootPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-plan-item]') || target.closest('[data-plan-menu]')) return;
    setSelectedItemId(null);
    setContextMenu(null);
  };

  return (
    <div
      ref={tableRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDownCapture={handleRootPointerDown}
      className={cn(
        'bg-white border border-slate-100 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200',
        className,
      )}
    >
      <div
        className="grid border-b border-slate-100 bg-slate-50 sticky z-10 rounded-t-2xl"
        style={{ ...GRID_STYLE, top: 0 }}
      >
        <div className="border-r border-slate-100 p-2 text-center text-sm text-slate-700">時刻</div>
        {DAYS.map((day, index) => {
          const isToday = index === todayIndex;
          const dateLabel = weekDates?.[index] ? format(weekDates[index], 'M/d') : '';
          return (
          <div
            key={day}
            className={cn(
              'p-2 text-center text-sm text-slate-700',
              index < 6 ? 'border-r border-slate-100' : '',
              isToday ? 'bg-indigo-50/60 text-indigo-700' : '',
            )}
          >
            <div className="flex flex-col items-center gap-0.5 leading-none">
              <span className="text-[11px] text-slate-500">{dateLabel}</span>
              <span className="font-medium">{day}</span>
            </div>
          </div>
        );
        })}
      </div>

      <div className={cn('relative overflow-hidden', editable ? '' : 'rounded-b-lg')}>
        <div className="grid" style={GRID_STYLE}>
          <div className="border-r border-slate-100 bg-slate-50">
            {slots.map((slot) => (
              <div
                key={slot.index}
                className={cn(
                  'text-xs text-center text-slate-500 flex items-center justify-center relative',
                  slot.index < slots.length - 1
                    ? slot.isHourBoundary
                      ? 'border-b border-slate-100'
                      : 'border-b border-dashed border-slate-100'
                    : '',
                )}
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                <span className={slot.isHourLabel ? '' : 'text-[10px] text-slate-400'}>{slot.label}</span>
              </div>
            ))}
          </div>

          {DAYS.map((day, dayIndex) => {
            const dayItems = displayItems.filter((item) => item.dayOfWeek === dayIndex);
            const studyLayouts = layoutSegments(
              dayItems.filter((item) => item.type === 'study').flatMap(buildSegments),
            );
            const otherLayouts = dayItems
              .filter((item) => item.type !== 'study')
              .flatMap(buildSegments)
              .map((segment) => ({
                ...segment,
                columnIndex: 0,
                columnCount: 1,
              }));
            const isToday = dayIndex === todayIndex;
            const selectionForDay = selectionRange?.dayOfWeek === dayIndex ? selectionRange : null;
            const selectionTop = selectionForDay
              ? ((selectionForDay.startAxis - START_MINUTES) / SLOT_MINUTES) * SLOT_HEIGHT
              : 0;
            const selectionHeight = selectionForDay
              ? ((selectionForDay.endAxis - selectionForDay.startAxis) / SLOT_MINUTES) * SLOT_HEIGHT
              : 0;
            const selectionStartLabel = selectionForDay ? minutesToTimeString(selectionForDay.startAxis % DAY_MINUTES) : '';
            const selectionEndLabel = selectionForDay ? minutesToTimeString(selectionForDay.endAxis % DAY_MINUTES) : '';

            return (
              <div
                key={day}
                className={cn(
                  'relative',
                  dayIndex < 6 ? 'border-r border-slate-100' : '',
                  isToday ? 'bg-indigo-50/30' : '',
                )}
                ref={(node) => {
                  dayColumnRefs.current[dayIndex] = node;
                }}
              >
                {selectionForDay ? (
                  <div
                    data-plan-selection
                    className="absolute left-1 right-1 rounded-md border border-indigo-200 bg-indigo-100/60 text-[10px] text-indigo-700 pointer-events-none z-10"
                    style={{ top: `${selectionTop}px`, height: `${selectionHeight}px` }}
                  >
                    <div className="absolute bottom-1 right-1">{selectionStartLabel}-{selectionEndLabel}</div>
                  </div>
                ) : null}
                {slots.map((slot) => (
                  <button
                    key={slot.index}
                    type="button"
                    aria-label={`${day} ${formatTimeLabel(slot.startTime % 1440)} に学習ブロックを追加`}
                    tabIndex={-1}
                    disabled={!editable}
                    onMouseEnter={() => {
                      hoverSlotRef.current = { dayOfWeek: dayIndex, startTime: slot.startTime % DAY_MINUTES };
                    }}
                    onPointerDown={(event) => startSelection(event, dayIndex, slot.startTime)}
                    onContextMenu={(event) => {
                      if (!editable) return;
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedItemId(null);
                      setContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        kind: 'empty',
                        dayOfWeek: dayIndex,
                        startTime: slot.startTime % DAY_MINUTES,
                      });
                    }}
                    className={cn(
                      'group relative block w-full p-0 m-0 bg-transparent border-0 text-left',
                      slot.index < slots.length - 1
                        ? slot.isHourBoundary
                          ? 'border-b border-slate-100'
                          : 'border-b border-dashed border-slate-100'
                        : '',
                      editable ? 'hover:bg-indigo-50/60' : '',
                    )}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  >
                    {editable ? (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                        ＋
                      </span>
                    ) : null}
                  </button>
                ))}

                {[...otherLayouts, ...studyLayouts].map((layout) => {
                  const axisStart = START_MINUTES;
                  const axisEnd = START_MINUTES + TOTAL_MINUTES;
                  const clippedStart = Math.max(layout.start, axisStart);
                  const clippedEnd = Math.min(layout.end, axisEnd);
                  const duration = clippedEnd - clippedStart;
                  if (duration <= 0) return null;

                  const rawHeight = (duration / SLOT_MINUTES) * SLOT_HEIGHT;
                  const inset = rawHeight > 8 ? BLOCK_INSET : 0;
                  const height = Math.max(6, rawHeight - inset * 2);
                  const top = ((clippedStart - axisStart) / SLOT_MINUTES) * SLOT_HEIGHT + inset;
                  const columnStyle = getColumnStyle(layout.columnIndex, layout.columnCount);
                  const zIndex =
                    layout.item.type === 'study' ? 30 : layout.item.type === 'fixed' ? 20 : 10;
                  const isStudy = layout.item.type === 'study';
                  const canInteract = editable && (isStudy || allowLifestyleEdit);
                  const isSelected = selectedItemId === layout.item.id;
                  const isPreview = dragPreview?.id === layout.item.id;

                  return (
                    <div
                      key={layout.key}
                      className={cn('absolute', canInteract ? '' : 'pointer-events-none')}
                      style={{ top: `${top}px`, zIndex, ...columnStyle }}
                    >
                      <PlanItemBlock
                        item={layout.item}
                        height={height}
                        category={layout.item.categoryId ? categoryMap.get(layout.item.categoryId) : undefined}
                        material={layout.item.materialId ? materialMap.get(layout.item.materialId) : undefined}
                        isEditable={editable}
                        allowLifestyleEdit={allowLifestyleEdit}
                        isSelected={isSelected}
                        forceTimeRange={isPreview}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canInteract) return;
                          if (Date.now() - lastDragAtRef.current < 200) return;
                          setSelectedItemId(layout.item.id);
                          setContextMenu(null);
                          tableRef.current?.focus();
                          if (isStudy) {
                            onItemClick?.(layout.item);
                            return;
                          }
                          if (allowLifestyleEdit) {
                            onLifestyleEdit?.(layout.item);
                          }
                        }}
                        onContextMenu={(e) => {
                          if (!editable || (!isStudy && !allowLifestyleEdit)) return;
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedItemId(layout.item.id);
                          setContextMenu({ x: e.clientX, y: e.clientY, kind: 'item', item: layout.item });
                          tableRef.current?.focus();
                        }}
                        onDragStart={(e) => startInteraction(e, layout.item, 'drag')}
                        onResizeStart={(e) => startInteraction(e, layout.item, 'resize')}
                        onDelete={
                          isStudy || allowLifestyleEdit
                            ? () => {
                                onItemDelete?.(layout.item);
                                setSelectedItemId(null);
                                setContextMenu(null);
                              }
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {contextMenu ? (
        <div
          data-plan-menu
          className="fixed z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.kind === 'item' ? (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setContextMenu(null);
                  if (contextMenu.item.type === 'study') {
                    onItemClick?.(contextMenu.item);
                  } else if (allowLifestyleEdit) {
                    onLifestyleEdit?.(contextMenu.item);
                  }
                }}
              >
                編集
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setClipboardItem(contextMenu.item);
                  setContextMenu(null);
                }}
              >
                コピー
              </button>
              {contextMenu.item.type === 'study' || allowLifestyleEdit ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    setContextMenu(null);
                    onItemDelete?.(contextMenu.item);
                    setSelectedItemId(null);
                  }}
                >
                  削除
                </button>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700',
                clipboardItem ? 'hover:bg-slate-50' : 'text-slate-400 cursor-not-allowed',
              )}
              onClick={() => {
                if (!clipboardItem) return;
                pasteClipboardTo(contextMenu.dayOfWeek, contextMenu.startTime);
                setContextMenu(null);
              }}
            >
              貼り付け
            </button>
          )}
        </div>
      ) : null}

    </div>
  );
}
