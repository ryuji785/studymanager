import React, { useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';

import type { AppData, PlanItem, PlanWeek } from '../types';
import { formatPeriod } from '../utils/date';
import { formatMinutes } from '../utils/time';
import { AppChrome } from './layout/AppChrome';
import { PeriodSelector, type PeriodValue } from './ui/period-selector';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Chip } from './ui/chip';
import { EmptyState } from './ui/empty-state';
import { PageHeader } from './ui/page-header';
import { PageLayout } from './ui/page-layout';
import { StatCard } from './ui/stat-card';

function getItemDate(item: PlanItem, week: PlanWeek): Date {
  const start = parseISO(week.weekStartDate);
  return addDays(start, item.dayOfWeek);
}

function isWithinRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export function HistoryPage({
  data,
  period,
  onChangePeriod,
  onSelectWeek,
  onNavigateWeekly,
}: {
  data: AppData;
  period: PeriodValue;
  onChangePeriod: (next: PeriodValue) => void;
  onSelectWeek: (week: PlanWeek) => void;
  onNavigateWeekly: () => void;
}) {
  const periodStart = parseISO(period.start);
  const periodEnd = parseISO(period.end);

  const weekMap = useMemo(() => new Map(data.planWeeks.map((w) => [w.id, w])), [data.planWeeks]);
  const categoryById = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);

  const itemsInRange = useMemo(() => {
    return data.planItems.filter((item) => {
      const week = weekMap.get(item.weekId);
      if (!week) return false;
      const date = getItemDate(item, week);
      return isWithinRange(date, periodStart, periodEnd);
    });
  }, [data.planItems, periodStart, periodEnd, weekMap]);

  const studyItems = itemsInRange.filter((item) => item.type === 'study');
  const doneMinutes = studyItems
    .filter((item) => item.status === 'done')
    .reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0);
  const plannedMinutes = studyItems.reduce((sum, item) => sum + item.duration, 0);
  const completionRate = plannedMinutes > 0 ? Math.round((doneMinutes / plannedMinutes) * 100) : 0;

  const weeksInRange = useMemo(
    () =>
      data.planWeeks
        .filter((week) => week.weekStartDate >= period.start && week.weekStartDate <= period.end)
        .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate)),
    [data.planWeeks, period.end, period.start],
  );

  const chartWeeks = useMemo(() => weeksInRange.slice(-6), [weeksInRange]);
  const chartData = useMemo(() => {
    if (chartWeeks.length === 0) return [];
    const totals = new Map<string, number>();
    studyItems.forEach((item) => {
      if (item.status !== 'done') return;
      totals.set(item.weekId, (totals.get(item.weekId) ?? 0) + (item.actualDuration ?? item.duration));
    });
    const maxMinutes = Math.max(1, ...chartWeeks.map((week) => totals.get(week.id) ?? 0));
    return chartWeeks.map((week) => {
      const minutes = totals.get(week.id) ?? 0;
      return {
        id: week.id,
        label: format(parseISO(week.weekStartDate), 'MM/dd'),
        minutes,
        ratio: minutes / maxMinutes,
      };
    });
  }, [chartWeeks, studyItems]);
  const hasChartRecords = chartData.some((entry) => entry.minutes > 0);

  return (
    <AppChrome
      title="学習履歴"
      actions={null}
    >
      <PageLayout>
        <PageHeader
          title="学習履歴"
          description="これまでの学習の積み上がりを確認できます。"
          action={<Button onClick={onNavigateWeekly}>週計画へ戻る</Button>}
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <PeriodSelector value={period} onChange={onChangePeriod} mode="range" />
          </div>
          <div className="text-sm text-slate-500">表示期間: {formatPeriod(period.start, period.end)}</div>
        </div>

        {weeksInRange.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-5 h-5" />}
            title="この期間の履歴はまだありません"
            description="まずは週計画を作成し、学習ブロックを完了すると実績が表示されます。"
            actions={[{ label: '週計画へ戻る', onClick: onNavigateWeekly }]}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                label="合計学習時間"
                value={doneMinutes === 0 ? 'まだ記録はありません' : formatMinutes(doneMinutes)}
                helper="完了にした学習ブロックの合計です。"
                valueClassName={doneMinutes === 0 ? 'text-base text-slate-500 font-medium' : undefined}
              />
              <StatCard
                label="学習の積み上げ"
                value={doneMinutes === 0 ? 'まだ記録はありません' : `+${formatMinutes(doneMinutes)}`}
                helper={plannedMinutes > 0 ? `達成率 ${completionRate}%` : '記録が増えると達成率が表示されます。'}
                valueClassName={doneMinutes === 0 ? 'text-base text-slate-500 font-medium' : undefined}
              />
              <StatCard
                label="計画作成週数"
                value={`${weeksInRange.length}週`}
                helper="期間内に作成した週"
              />
            </div>

            <Card>
              <CardHeader className="pb-2 flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-sm text-slate-500">直近の学習の積み上がり</CardTitle>
                <div className="flex items-center gap-2">
                  <Chip variant="filled">週</Chip>
                  <Chip variant="outline">日</Chip>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-sm text-slate-500">まだ記録はありません。</p>
                ) : hasChartRecords ? (
                  <div className="grid grid-cols-6 gap-3">
                    {chartData.map((entry) => (
                      <div key={entry.id} className="flex flex-col items-center gap-2">
                        <div className="h-24 w-full flex items-end">
                          <div
                            className="w-full min-h-2 rounded-full bg-indigo-100"
                            style={{ height: `${Math.round(entry.ratio * 100)}%` }}
                            aria-label={`${entry.label} ${formatMinutes(entry.minutes)}`}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400">{entry.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">記録が増えるとグラフが表示されます。</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.categories.map((category) => (
                    <Badge key={category.id} variant="outline" className={category.color}>
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-900">週別の計画</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {weeksInRange.map((week) => {
                  const weekItems = data.planItems.filter((item) => item.weekId === week.id && item.type === 'study');
                  const weekDone = weekItems
                    .filter((item) => item.status === 'done')
                    .reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0);
                  const weekPlanned = weekItems.reduce((sum, item) => sum + item.duration, 0);
                  const weekRate = weekPlanned > 0 ? Math.round((weekDone / weekPlanned) * 100) : 0;
                  const weekCategoryTotals = new Map<string, number>();
                  weekItems.forEach((item) => {
                    if (!item.categoryId) return;
                    const minutes = item.actualDuration ?? item.duration;
                    weekCategoryTotals.set(item.categoryId, (weekCategoryTotals.get(item.categoryId) ?? 0) + minutes);
                  });
                  const topCategoryId = Array.from(weekCategoryTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
                  const topCategory = topCategoryId ? categoryById.get(topCategoryId)?.name : undefined;

                  return (
                    <div key={week.id} className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                      <div className="text-sm font-medium text-slate-900">
                        {formatPeriod(week.weekStartDate, week.weekEndDate)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>実績: {formatMinutes(weekDone)}</span>
                        <span>{weekPlanned > 0 ? `達成率 ${weekRate}%` : '達成率 -'}</span>
                      </div>
                      <div className="text-xs text-slate-500">主なカテゴリ: {topCategory ?? '—'}</div>
                      <Button variant="outline" className="bg-white w-full" onClick={() => onSelectWeek(week)}>
                        週計画を開く
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </PageLayout>
    </AppChrome>
  );
}
