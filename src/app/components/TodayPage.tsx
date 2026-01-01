import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import type { AppData, PlanItem } from '../types';
import { formatMinutes, minutesToTimeString } from '../utils/time';
import { weekIdFromStart } from '../utils/plan';
import { AppChrome } from './layout/AppChrome';
import { PageLayout } from './ui/page-layout';
import { PageHeader } from './ui/page-header';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { EmptyState } from './ui/empty-state';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];

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

  const plannedMinutes = todayItems.reduce((sum, item) => sum + item.duration, 0);
  const doneMinutes = todayItems
    .filter((item) => item.status === 'done')
    .reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0);

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
          description="今日の学習ブロックを確認して、完了にしていきましょう。"
          action={null}
        />

        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground/70" />
                <span className="font-medium text-foreground">{dateLabel}</span>
                <span className="text-muted-foreground">{dayLabel}</span>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-foreground">
                  <span className="text-[11px] text-muted-foreground">今日の予定</span>
                  <span className="font-semibold">{todayItems.length}コマ</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold">{formatMinutes(plannedMinutes)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-foreground">
                  <span className="text-[11px] text-muted-foreground">実績</span>
                  <span className="font-semibold">{doneMinutes === 0 ? '未記録' : formatMinutes(doneMinutes)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {todayItems.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="今日の予定はまだありません"
              description="週計画から学習ブロックを追加すると、今日の予定が表示されます。"
              actions={[{ label: '週計画へ', onClick: onNavigateWeekly }]}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {todayItems.map((item) => {
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
