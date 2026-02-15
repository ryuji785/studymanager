import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';

import { ScheduleBlock as ScheduleBlockType } from '../types';
import { formatMinutes, normalizeDisplayRange } from '../utils/time';
import { ScheduleBlock } from './ScheduleBlock';

interface TimeTableGridProps {
  scheduleBlocks: ScheduleBlockType[];
  editable?: boolean;
  onBlockClick?: (block: ScheduleBlockType) => void;
  onEmptySlotClick?: (dayOfWeek: number, startTime: number) => void;
}

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];

const START_MINUTES = 6 * 60; // 6:00
const SLOT_MINUTES = 30;
const TOTAL_MINUTES = 24 * 60; // 24h
const SLOT_COUNT = TOTAL_MINUTES / SLOT_MINUTES; // 48
const SLOT_HEIGHT = 24;
const GRID_TEMPLATE_COLUMNS = '88px repeat(7, minmax(0, 1fr))';
const GRID_STYLE = { gridTemplateColumns: GRID_TEMPLATE_COLUMNS } as const;

type EmptySlot = {
  dayOfWeek: number;
  start: number;
  duration: number;
};

type BlockLayout = {
  block: ScheduleBlockType;
  top: number;
  height: number;
  columnIndex: number;
  columnCount: number;
};

type PositionedBlock = {
  block: ScheduleBlockType;
  start: number;
  end: number;
  top: number;
  height: number;
};

function getColumnStyle(columnIndex: number, columnCount: number) {
  const width = 100 / columnCount;
  const left = width * columnIndex;
  const gutter = columnCount > 1 ? 6 : 0;

  return {
    left: gutter > 0 ? `calc(${left}% + ${gutter / 2}px)` : `${left}%`,
    width: gutter > 0 ? `calc(${width}% - ${gutter}px)` : `${width}%`,
  } as React.CSSProperties;
}

function layoutBlocks(blocks: PositionedBlock[]): BlockLayout[] {
  const sorted = [...blocks].sort((a, b) => (a.start === b.start ? a.end - b.end : a.start - b.start));
  const layouts: BlockLayout[] = [];

  let current: Array<Omit<BlockLayout, 'columnCount'>> = [];
  let columnsEnd: number[] = [];

  sorted.forEach((entry) => {
    const hasActive = columnsEnd.some((end) => end > entry.start);
    if (!hasActive && current.length > 0) {
      const columnCount = columnsEnd.length || 1;
      current.forEach((item) => layouts.push({ ...item, columnCount }));
      current = [];
      columnsEnd = [];
    }

    let columnIndex = columnsEnd.findIndex((end) => end <= entry.start);
    if (columnIndex === -1) {
      columnIndex = columnsEnd.length;
      columnsEnd.push(entry.end);
    } else {
      columnsEnd[columnIndex] = entry.end;
    }

    current.push({
      block: entry.block,
      top: entry.top,
      height: entry.height,
      columnIndex,
      columnCount: 0,
    });
  });

  if (current.length > 0) {
    const columnCount = columnsEnd.length || 1;
    current.forEach((entry) => layouts.push({ ...entry, columnCount }));
  }

  return layouts;
}

function formatTimeLabel(minutesFromMidnight: number) {
  const h = Math.floor(minutesFromMidnight / 60) % 24;
  const m = minutesFromMidnight % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function TimeTableGrid({ scheduleBlocks, editable = false, onBlockClick, onEmptySlotClick }: TimeTableGridProps) {
  const slots = useMemo(() => {
    return Array.from({ length: SLOT_COUNT }).map((_, index) => {
      const minutes = START_MINUTES + index * SLOT_MINUTES;
      const minutesFromMidnight = minutes % 1440;
      const isHourBoundary = index % 2 === 1; // 7:00, 8:00...（スロットの下線が1時間境界）
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

  const availableSlotsByDay = useMemo(() => {
    const axisStart = START_MINUTES;
    const axisEnd = START_MINUTES + TOTAL_MINUTES;
    const byDay = Array.from({ length: DAYS.length }, () => [] as EmptySlot[]);

    DAYS.forEach((_, dayIndex) => {
      const dayBlocks = scheduleBlocks
        .filter((block) => block.dayOfWeek === dayIndex)
        .map((block) => {
          const { start, end } = normalizeDisplayRange(block.startTime, block.duration, START_MINUTES);
          const clippedStart = Math.max(start, axisStart);
          const clippedEnd = Math.min(end, axisEnd);
          return clippedEnd > clippedStart ? { start: clippedStart, end: clippedEnd } : null;
        })
        .filter((interval): interval is { start: number; end: number } => interval !== null)
        .sort((a, b) => (a.start === b.start ? a.end - b.end : a.start - b.start));

      const merged: Array<{ start: number; end: number }> = [];
      dayBlocks.forEach((interval) => {
        const last = merged[merged.length - 1];
        if (!last || interval.start > last.end) {
          merged.push({ ...interval });
        } else {
          last.end = Math.max(last.end, interval.end);
        }
      });

      let cursor = axisStart;
      merged.forEach((interval) => {
        if (interval.start > cursor) {
          byDay[dayIndex].push({
            dayOfWeek: dayIndex,
            start: cursor,
            duration: interval.start - cursor,
          });
        }
        cursor = Math.max(cursor, interval.end);
      });
      if (cursor < axisEnd) {
        byDay[dayIndex].push({
          dayOfWeek: dayIndex,
          start: cursor,
          duration: axisEnd - cursor,
        });
      }
    });

    return byDay;
  }, [scheduleBlocks]);

  const blockLayoutsByDay = useMemo(() => {
    const axisStart = START_MINUTES;
    const axisEnd = START_MINUTES + TOTAL_MINUTES;

    return DAYS.map((_, dayIndex) => {
      const positionedBlocks: PositionedBlock[] = scheduleBlocks
        .filter((block) => block.dayOfWeek === dayIndex)
        .map((block) => {
          const { start, end } = normalizeDisplayRange(block.startTime, block.duration, START_MINUTES);
          const clippedStart = Math.max(start, axisStart);
          const clippedEnd = Math.min(end, axisEnd);
          const clippedDuration = clippedEnd - clippedStart;
          if (clippedDuration <= 0) return null;

          const top = ((clippedStart - axisStart) / SLOT_MINUTES) * SLOT_HEIGHT;
          const height = (clippedDuration / SLOT_MINUTES) * SLOT_HEIGHT;

          return {
            block,
            start: clippedStart,
            end: clippedEnd,
            top,
            height,
          };
        })
        .filter((entry): entry is PositionedBlock => entry !== null);

      return layoutBlocks(positionedBlocks);
    });
  }, [scheduleBlocks]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* ヘッダー */}
      <div
        className="grid border-b border-gray-300 bg-gray-50 sticky z-10 rounded-t-lg"
        style={{ ...GRID_STYLE, top: 'var(--app-chrome-sticky-top, 56px)' }}
      >
        <div className="border-r border-gray-300 p-2 text-center text-sm text-gray-700">時刻</div>
        {DAYS.map((day, index) => (
          <div
            key={day}
            className={`p-2 text-center text-sm text-gray-700 ${index < 6 ? 'border-r border-gray-200' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* タイムテーブル本体 */}
      <div className={`relative overflow-hidden ${editable ? '' : 'rounded-b-lg'}`}>
        <div className="grid" style={GRID_STYLE}>
          {/* 時間軸 */}
          <div className="border-r border-gray-300 bg-gray-50">
            {slots.map((slot) => (
              <div
                key={slot.index}
                className={`text-xs text-center text-gray-600 flex items-center justify-center relative ${
                  slot.index < slots.length - 1
                    ? slot.isHourBoundary
                      ? 'border-b border-gray-200'
                      : 'border-b border-dashed border-gray-100'
                    : ''
                }`}
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                <span className={slot.isHourLabel ? '' : 'text-[10px] text-gray-400'}>{slot.label}</span>
              </div>
            ))}
          </div>

          {/* 各曜日 */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className={`relative ${dayIndex < 6 ? 'border-r border-gray-200' : ''}`}>
              {/* 30分グリッド */}
              {slots.map((slot) => (
                <button
                  key={slot.index}
                  type="button"
                  aria-label={`${day} ${formatTimeLabel(slot.startTime % 1440)} に予定を追加`}
                  tabIndex={-1}
                  disabled={!editable}
                  onClick={() => onEmptySlotClick?.(dayIndex, slot.startTime)}
                  className={`block w-full p-0 m-0 bg-transparent border-0 text-left ${
                    slot.index < slots.length - 1
                      ? slot.isHourBoundary
                        ? 'border-b border-gray-200'
                        : 'border-b border-dashed border-gray-100'
                      : ''
                  } ${editable ? 'hover:bg-indigo-50/40' : ''}`}
                  style={{ height: `${SLOT_HEIGHT}px` }}
                />
              ))}

              {/* 空き時間ブロック */}
              {availableSlotsByDay[dayIndex]?.map((slot) => {
                const top = ((slot.start - START_MINUTES) / SLOT_MINUTES) * SLOT_HEIGHT;
                const height = (slot.duration / SLOT_MINUTES) * SLOT_HEIGHT;
                if (height <= 0) return null;

                const isShort = slot.duration < 15;
                const isNormal = slot.duration >= 30 && slot.duration <= 90;
                const isLong = slot.duration >= 120;

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
                  <button
                    key={`${slot.dayOfWeek}-${slot.start}`}
                    type="button"
                    onClick={() => onEmptySlotClick?.(slot.dayOfWeek, slot.start)}
                    className="absolute left-0 right-0 px-2 z-20 bg-transparent border-0 focus:outline-none"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div className="h-full w-full rounded-md bg-indigo-100/60 border border-indigo-200/80 shadow-[0_0_8px_rgba(99,102,241,0.35)] flex items-center justify-center text-center">
                      <span className={labelClasses}>{formatMinutes(slot.duration)}</span>
                    </div>
                  </button>
                );
              })}

              {/* ブロック */}
              {blockLayoutsByDay[dayIndex]?.map((layout) => {
                const columnStyle = getColumnStyle(layout.columnIndex, layout.columnCount);

                return (
                  <div
                    key={`${layout.block.id}-${layout.columnIndex}-${layout.top}`}
                    className="absolute px-1 z-10"
                    style={{ top: `${layout.top}px`, ...columnStyle }}
                  >
                    <ScheduleBlock
                      block={layout.block}
                      height={layout.height}
                      className="opacity-60 grayscale"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick?.(layout.block);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {editable && (
        <div className="border-t border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 flex items-center gap-2 rounded-b-lg">
          <Plus className="w-3.5 h-3.5" />
          空欄をクリックして追加 / ブロックをクリックして編集（ドラッグ＆リサイズは後回し）
        </div>
      )}
    </div>
  );
}
