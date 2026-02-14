import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Sparkles } from 'lucide-react';

import type { AppData, PlanItem } from '../types';
import { createDefaultLifestyleTemplate } from '../data/appDataStore';
import {
  computeAvailableMinutes,
  computeAvailableMinutesFromItems,
  getWeekLifestyleItemsFromData,
  weekIdFromStart,
} from '../utils/plan';
import { UI_TEXT } from '../constants/strings';
import { AppChrome } from './layout/AppChrome';

type ConfettiPiece = {
  id: number;
  dx: number;
  dy: number;
  rotate: number;
  color: string;
  delay: number;
};

type ConfettiBurst = {
  id: number;
  x: number;
  y: number;
  pieces: ConfettiPiece[];
};

const WEEK_LABELS = ['月', '火', '水', '木', '金', '土', '日'];
const CONFETTI_COLORS = ['#7dd3fc', '#93c5fd', '#a7f3d0', '#fdba74'];

function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

function formatTime(minutes: number): string {
  const safe = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function resolveTaskTitle(item: PlanItem, data: AppData) {
  return (
    item.label ??
    data.materials.find((material) => material.id === item.materialId)?.name ??
    data.categories.find((category) => category.id === item.categoryId)?.name ??
    UI_TEXT.LABEL_BLOCK
  );
}

function createBurst(x: number, y: number): ConfettiBurst {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  const pieces: ConfettiPiece[] = Array.from({ length: 14 }).map((_, index) => ({
    id: id + index,
    dx: Math.round((Math.random() - 0.5) * 140),
    dy: Math.round(70 + Math.random() * 150),
    rotate: Math.round((Math.random() - 0.5) * 540),
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    delay: Math.round(Math.random() * 90),
  }));
  return { id, x, y, pieces };
}

export function HomePage({
  data,
  period,
  onUpdateData,
  onNavigatePlan,
  onNavigateSettings,
}: {
  data: AppData;
  period: { start: string; end: string };
  onUpdateData: (updater: (prev: AppData) => AppData) => void;
  onNavigatePlan: () => void;
  onNavigateSettings: () => void;
}) {
  const weekId = useMemo(() => weekIdFromStart(period.start), [period.start]);
  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);
  const nowMinutes = useMemo(() => new Date().getHours() * 60 + new Date().getMinutes(), []);

  const todayItems = useMemo(
    () =>
      data.planItems
        .filter((item) => item.weekId === weekId && item.type === 'study' && item.dayOfWeek === todayIndex)
        .sort((a, b) => a.startTime - b.startTime),
    [data.planItems, todayIndex, weekId],
  );

  const weekStudyItems = useMemo(
    () => data.planItems.filter((item) => item.weekId === weekId && item.type === 'study'),
    [data.planItems, weekId],
  );

  const lifestyleItems = useMemo(() => getWeekLifestyleItemsFromData(data, weekId), [data, weekId]);
  const availableMinutes = useMemo(() => {
    if (lifestyleItems.length > 0) return computeAvailableMinutesFromItems(lifestyleItems);
    return computeAvailableMinutes(data.lifestyleTemplate ?? createDefaultLifestyleTemplate());
  }, [data.lifestyleTemplate, lifestyleItems]);

  const weekPlannedMinutes = useMemo(
    () => weekStudyItems.reduce((sum, item) => sum + item.duration, 0),
    [weekStudyItems],
  );
  const weekBufferMinutes = availableMinutes - weekPlannedMinutes;

  const totalDoneMinutes = useMemo(
    () =>
      data.planItems
        .filter((item) => item.type === 'study' && item.status === 'done')
        .reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0),
    [data.planItems],
  );

  const [displayDoneMinutes, setDisplayDoneMinutes] = useState(totalDoneMinutes);
  const prevDoneRef = useRef(totalDoneMinutes);
  const [bursts, setBursts] = useState<ConfettiBurst[]>([]);

  useEffect(() => {
    const start = prevDoneRef.current;
    const end = totalDoneMinutes;
    if (start === end) return;

    let rafId = 0;
    const startedAt = performance.now();
    const duration = 420;

    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDoneMinutes(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevDoneRef.current = end;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [totalDoneMinutes]);

  const triggerCelebration = (button: HTMLButtonElement | null) => {
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const burst = createBurst(rect.left + rect.width / 2, rect.top + 6);
    setBursts((prev) => [...prev, burst]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((entry) => entry.id !== burst.id));
    }, 900);
  };

  const onDone = (item: PlanItem, button: HTMLButtonElement | null) => {
    onUpdateData((prev) => ({
      ...prev,
      planItems: prev.planItems.map((entry) =>
        entry.id === item.id ? { ...entry, status: 'done', actualDuration: entry.actualDuration ?? entry.duration } : entry,
      ),
    }));

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
    triggerCelebration(button);
  };

  return (
    <AppChrome title={UI_TEXT.NAV_HOME} showSettings>
      <div className="space-y-4">
        <section className="rounded-xl border border-sky-100 bg-[linear-gradient(145deg,#eef9ff_0%,#f5fcff_65%,#ffffff_100%)] p-5 shadow-sm">
          <p className="text-sm text-slate-500">おかえりなさい</p>
          <p className="mt-1 text-sm text-slate-500">{UI_TEXT.MESSAGE_GENTLE}</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">今週のゆとり</p>
              <p className="text-3xl font-medium text-sky-700">
                {weekBufferMinutes >= 0 ? `あと ${formatDuration(weekBufferMinutes)}` : `調整中 ${formatDuration(Math.abs(weekBufferMinutes))}`}
              </p>
            </div>
            {!data.lifestyleTemplate ? (
              <button
                type="button"
                className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs text-sky-700 hover:bg-sky-50"
                onClick={onNavigateSettings}
              >
                {UI_TEXT.MESSAGE_SETUP_LIFESTYLE}
              </button>
            ) : null}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm text-slate-600">
            <Sparkles className="h-4 w-4 text-sky-500" />
            {UI_TEXT.LABEL_LOG}: {formatDuration(displayDoneMinutes)}
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-medium text-slate-700">今日の学習コマ</h2>
              <p className="text-xs text-slate-500">{WEEK_LABELS[todayIndex]}曜日</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              onClick={onNavigatePlan}
            >
              計画表をひらく
            </button>
          </div>

          <div className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              現在時刻 {formatTime(nowMinutes)}
            </span>
          </div>

          {todayItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              {UI_TEXT.LABEL_EMPTY}
            </div>
          ) : (
            <div className="relative ml-1 border-l border-slate-200 pl-4">
              <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-sky-400" />
              <div className="mb-3 text-[11px] text-sky-700">いま {formatTime(nowMinutes)}</div>
              <div className="space-y-3">
                {todayItems.map((item) => {
                  const title = resolveTaskTitle(item, data);
                  const categoryName = data.categories.find((category) => category.id === item.categoryId)?.name;
                  return (
                    <article
                      key={item.id}
                      className={`relative rounded-xl border px-4 py-3 transition-colors ${
                        item.status === 'done' ? 'border-sky-200 bg-sky-50/80' : 'border-slate-100 bg-white'
                      }`}
                    >
                      <span className="absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full bg-slate-300" />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500">
                            {formatTime(item.startTime)} - {formatTime(item.startTime + item.duration)}・{formatDuration(item.duration)}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">{title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {UI_TEXT.LABEL_BLOCK}
                            {categoryName ? ` / ${UI_TEXT.LABEL_CATEGORY}: ${categoryName}` : ''}
                          </p>
                        </div>

                        {item.status === 'done' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {UI_TEXT.LABEL_DONE}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => onDone(item, event.currentTarget)}
                            className="rounded-lg bg-sky-600 px-3 py-2 text-xs text-white transition-colors hover:bg-sky-700"
                          >
                            {UI_TEXT.LABEL_DONE}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
        {bursts.map((burst) => (
          <div key={burst.id} className="absolute" style={{ left: burst.x, top: burst.y }}>
            {burst.pieces.map((piece) => (
              <span
                key={piece.id}
                className="app-confetti-piece"
                style={
                  {
                    '--confetti-dx': `${piece.dx}px`,
                    '--confetti-dy': `${piece.dy}px`,
                    '--confetti-rotate': `${piece.rotate}deg`,
                    '--confetti-delay': `${piece.delay}ms`,
                    backgroundColor: piece.color,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ))}
      </div>
    </AppChrome>
  );
}
