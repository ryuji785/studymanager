import React, { useMemo } from 'react';
import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDays } from 'lucide-react';

import type { AppData, PlanItem, PlanWeek } from '../types';
import { UI_TEXT } from '../constants/strings';
import { AppChrome } from './layout/AppChrome';

function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

function itemDate(item: PlanItem, week: PlanWeek): Date {
  return addDays(parseISO(week.weekStartDate), item.dayOfWeek);
}

function colorClass(minutes: number): string {
  if (minutes === 0) return 'bg-slate-100';
  if (minutes <= 30) return 'bg-sky-100';
  if (minutes <= 90) return 'bg-sky-300';
  return 'bg-sky-500';
}

export function LogPage({
  data,
  period,
  onChangePeriod,
  onOpenWeek,
  onNavigatePlan,
}: {
  data: AppData;
  period: { start: string; end: string };
  onChangePeriod: (next: { start: string; end: string }) => void;
  onOpenWeek: (week: PlanWeek) => void;
  onNavigatePlan: () => void;
}) {
  const weekMap = useMemo(() => new Map(data.planWeeks.map((week) => [week.id, week])), [data.planWeeks]);

  const doneItems = useMemo(
    () => data.planItems.filter((item) => item.type === 'study' && item.status === 'done'),
    [data.planItems],
  );

  const totalMinutes = useMemo(
    () => doneItems.reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0),
    [doneItems],
  );

  const thisMonthRange = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  const monthMinutesByDate = useMemo(() => {
    const map = new Map<string, number>();
    doneItems.forEach((item) => {
      const week = weekMap.get(item.weekId);
      if (!week) return;
      const date = itemDate(item, week);
      if (date < thisMonthRange.start || date > thisMonthRange.end) return;
      const key = format(date, 'yyyy-MM-dd');
      map.set(key, (map.get(key) ?? 0) + (item.actualDuration ?? item.duration));
    });
    return map;
  }, [doneItems, thisMonthRange.end, thisMonthRange.start, weekMap]);

  const thisMonthMinutes = useMemo(
    () => Array.from(monthMinutesByDate.values()).reduce((sum, value) => sum + value, 0),
    [monthMinutesByDate],
  );

  const heatmapCells = useMemo(() => {
    const start = startOfWeek(thisMonthRange.start, { weekStartsOn: 1 });
    const end = endOfWeek(thisMonthRange.end, { weekStartsOn: 1 });
    const dates: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      dates.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return dates;
  }, [thisMonthRange.end, thisMonthRange.start]);

  const weeklyTotals = useMemo(() => {
    return data.planWeeks
      .map((week) => {
        const minutes = data.planItems.reduce((sum, item) => {
          if (item.weekId !== week.id || item.type !== 'study' || item.status !== 'done') return sum;
          return sum + (item.actualDuration ?? item.duration);
        }, 0);
        return { week, minutes };
      })
      .filter((entry) => entry.minutes > 0)
      .sort((a, b) => b.week.weekStartDate.localeCompare(a.week.weekStartDate))
      .slice(0, 6);
  }, [data.planItems, data.planWeeks]);

  return (
    <AppChrome title={UI_TEXT.NAV_HISTORY}>
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{UI_TEXT.LABEL_LOG}</p>
          <p className="mt-1 text-4xl font-medium text-slate-700">合計 {formatMinutes(totalMinutes)}</p>
          <p className="mt-2 text-xs text-slate-500">数字を気にしすぎず、続けられた分だけ積み上がっています。</p>
        </section>

        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 text-sky-600" />
              今月の足あと
            </div>
            <p className="text-xs text-slate-500">今月 {formatMinutes(thisMonthMinutes)}</p>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['月', '火', '水', '木', '金', '土', '日'].map((label) => (
              <div key={label} className="text-center text-[11px] text-slate-400">
                {label}
              </div>
            ))}
            {heatmapCells.map((date) => {
              const inMonth = date >= thisMonthRange.start && date <= thisMonthRange.end;
              const key = format(date, 'yyyy-MM-dd');
              const minutes = monthMinutesByDate.get(key) ?? 0;
              return (
                <div
                  key={key}
                  className={`aspect-square rounded-md ${inMonth ? colorClass(minutes) : 'bg-slate-50'}`}
                  title={`${format(date, 'M/d')}: ${formatMinutes(minutes)}`}
                />
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-end gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-100" />
              0分
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-100" />
              少し
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
              しっかり
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-700">最近の積み上げ</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const start = startOfMonth(now);
                  const end = endOfMonth(now);
                  onChangePeriod({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') });
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                今月に切替
              </button>
              <button
                type="button"
                onClick={onNavigatePlan}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                計画表を開く
              </button>
            </div>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            表示範囲: {period.start} - {period.end}
          </p>

          {weeklyTotals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              {UI_TEXT.LABEL_EMPTY}
            </div>
          ) : (
            <div className="space-y-2">
              {weeklyTotals.map(({ week, minutes }) => (
                <button
                  key={week.id}
                  type="button"
                  onClick={() => onOpenWeek(week)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">
                    {week.weekStartDate} - {week.weekEndDate}
                  </span>
                  <span className="text-sm text-sky-700">{formatMinutes(minutes)}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppChrome>
  );
}
