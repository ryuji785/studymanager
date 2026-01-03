import React, { useMemo } from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import type { AppData, PlanItem } from '../types';
import { formatMinutes, minutesToTimeString } from '../utils/time';
import { weekIdFromStart } from '../utils/plan';
import { AppChrome } from './layout/AppChrome';
import { PageLayout } from './ui/page-layout';
import { PageHeader } from './ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { EmptyState } from './ui/empty-state';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const START_MINUTES = 6 * 60;
const TOTAL_MINUTES = 24 * 60;

type TodaySegment =
  | { kind: 'item'; start: number; item: PlanItem }
  | { kind: 'gap'; start: number; duration: number };

function toDisplayStart(startTime: number) {
  if (startTime >= 1440) return startTime;
  if (startTime < START_MINUTES) return startTime + 1440;
  return startTime;
}

function formatTimeRange(startTime: number, duration: number) {
  const endTime = startTime + duration;
  return `${minutesToTimeString(startTime)}〜${minutesToTimeString(endTime)}`;
}

function buildDaySegments(dayItems: PlanItem[]) {
  const axisStart = START_MINUTES;
  const axisEnd = START_MINUTES + TOTAL_MINUTES;
  const entries = dayItems
    .map((item) => {
      const displayStart = toDisplayStart(item.startTime);
      const displayEnd = displayStart + item.duration;
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

export function TodayPage({
  data,
  period,
  onUpdateData,
  onNavigateWeekly,
}: {
  data: AppData;
  period: { start: string; end: string };
  onUpdateData: (updater: (prev: AppData) => AppData) => void;
  onNavigateWeekly: () => void;
}) {
  const weekId = useMemo(() => weekIdFromStart(period.start), [period.start]);
  const todayIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    return (jsDay + 6) % 7;
  }, []);

  const todayItems = useMemo(() => {
    return data.planItems
      .filter((item) => item.weekId === weekId && item.type === 'study' && item.dayOfWeek === todayIndex)
      .sort((a, b) => a.startTime - b.startTime);
  }, [data.planItems, todayIndex, weekId]);
  const todayBlockingItems = useMemo(() => {
    return data.planItems
      .filter((item) => item.weekId === weekId && item.dayOfWeek === todayIndex)
      .sort((a, b) => a.startTime - b.startTime);
  }, [data.planItems, todayIndex, weekId]);
  const todaySegments = useMemo<TodaySegment[]>(() => buildDaySegments(todayBlockingItems), [todayBlockingItems]);

  const plannedMinutes = todayItems.reduce((sum, item) => sum + item.duration, 0);
  const doneMinutes = todayItems
    .filter((item) => item.status === 'done')
    .reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0);
  const progressValue = plannedMinutes > 0 ? Math.min(100, (doneMinutes / plannedMinutes) * 100) : 0;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentItem = todayItems.find(
    (item) =>
      item.status !== 'done' && nowMinutes >= item.startTime && nowMinutes < item.startTime + item.duration,
  );
  const nextItem =
    currentItem ??
    todayItems
      .filter((item) => item.status !== 'done' && item.startTime >= nowMinutes)
      .sort((a, b) => a.startTime - b.startTime)[0];

  const handleMarkDone = (item: PlanItem) => {
    onUpdateData((prev) => ({
      ...prev,
      planItems: prev.planItems.map((current) =>
        current.id === item.id ? { ...current, status: 'done' } : current,
      ),
    }));
    toast.success('完了にしました');
  };

  const dateLabel = format(new Date(), 'yyyy/MM/dd');
  const dayLabel = DAYS[todayIndex] ?? '';

  return (
    <AppChrome title="今日の予定" actions={null}>
      <PageLayout>
        <PageHeader
          title="今日の予定"
          description="今日やる学習を確認して、完了にしていきましょう。"
          action={null}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">今日の進捗</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground/70" />
                <span className="font-medium text-foreground">{dateLabel}</span>
                <span className="text-muted-foreground">{dayLabel}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="border-border bg-secondary">
                  予定 {todayItems.length}コマ
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary">
                  {plannedMinutes === 0 ? '予定 0分' : `予定 ${formatMinutes(plannedMinutes)}`}
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary">
                  {doneMinutes === 0 ? '実績 未記録' : `実績 ${formatMinutes(doneMinutes)}`}
                </Badge>
              </div>
              <Progress value={progressValue} className="bg-secondary" />
              <p className="text-xs text-muted-foreground">
                {plannedMinutes > 0 ? `進捗 ${Math.round(progressValue)}%` : '予定を入れると進捗が表示されます'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">次にやる</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextItem ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono">
                      {minutesToTimeString(nextItem.startTime)}〜
                      {minutesToTimeString(nextItem.startTime + nextItem.duration)}
                    </span>
                    <span>（{formatMinutes(nextItem.duration)}）</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {nextItem.label ??
                      data.materials.find((m) => m.id === nextItem.materialId)?.name ??
                      data.categories.find((c) => c.id === nextItem.categoryId)?.name ??
                      '学習'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      カテゴリ：
                      {data.categories.find((c) => c.id === nextItem.categoryId)?.name ?? '未設定'}
                    </span>
                    <span>・</span>
                    <span>所要 {formatMinutes(nextItem.duration)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {nextItem.status === 'done' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        完了済み
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => handleMarkDone(nextItem)}>
                        完了にする
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-3 text-xs text-muted-foreground">
                  今日の予定は完了しています。次の予定は週計画で追加できます。
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={onNavigateWeekly}>
                      今週の計画へ
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {todayItems.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Calendar className="w-5 h-5" />}
              title="今日の予定がありません"
              description="今週の計画から30分だけ追加して、まずは「やった」を作りましょう。"
              actions={[{ label: '今週の計画へ', onClick: onNavigateWeekly }]}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {todaySegments.map((segment) => {
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
                  <Card
                    key={`gap-${segment.start}`}
                    className="border border-indigo-200/70 bg-indigo-50/70 text-indigo-700"
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium">{formatTimeRange(segment.start, segment.duration)}</span>
                        <span className={labelClasses}>{formatMinutes(segment.duration)}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-indigo-500">空き時間</div>
                    </CardContent>
                  </Card>
                );
              }

              const item = segment.item;
              if (item.type !== 'study') {
                return null;
              }
              const startLabel = minutesToTimeString(item.startTime);
              const endLabel = minutesToTimeString(item.startTime + item.duration);
              const category = data.categories.find((c) => c.id === item.categoryId)?.name;
              const material = data.materials.find((m) => m.id === item.materialId)?.name;
              const title = item.label ?? material ?? category ?? '学習';

              return (
                <Card key={item.id}>
                  <CardContent className="py-4 flex flex-wrap items-center gap-3">
                    <div className="min-w-[140px] text-sm font-mono text-muted-foreground">
                      {startLabel} - {endLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{title}</div>
                      <div className="text-xs text-muted-foreground">
                        {category ?? 'カテゴリ未設定'} ・ {formatMinutes(item.duration)}
                      </div>
                    </div>
                    {item.status === 'done' ? (
                      <span className="text-xs text-emerald-600 font-medium">完了</span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleMarkDone(item)}>
                        完了にする
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageLayout>
    </AppChrome>
  );
}
