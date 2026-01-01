import React, { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

import type { AppData } from '../types';
import { createDefaultLifestyleTemplate } from '../data/appDataStore';
import { formatMinutes } from '../utils/time';
import {
  buildLifestyleItems,
  buildTemplateFromWeekItems,
  computeAvailableMinutes,
  computeAvailableMinutesFromItems,
  computeCategoryTotals,
  weekIdFromStart,
} from '../utils/plan';
import { AppChrome } from './layout/AppChrome';
import { PageLayout } from './ui/page-layout';
import { PageHeader } from './ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';

type SummaryStatus = 'good' | 'warn' | 'critical';

const STATUS_LABELS: Record<SummaryStatus, string> = {
  good: '順調',
  warn: 'やや不足',
  critical: '要調整',
};

export function WeeklySummaryPage({
  data,
  period,
}: {
  data: AppData;
  period: { start: string; end: string };
}) {
  const weekId = useMemo(() => weekIdFromStart(period.start), [period.start]);
  const weekItems = useMemo(() => data.planItems.filter((item) => item.weekId === weekId), [data.planItems, weekId]);
  const studyItems = weekItems.filter((item) => item.type === 'study');
  const doneItems = studyItems.filter((item) => item.status === 'done');
  const plannedMinutes = studyItems.reduce((sum, item) => sum + item.duration, 0);
  const doneMinutes = doneItems.reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0);

  const baseLifestyleTemplate = data.lifestyleTemplate ?? createDefaultLifestyleTemplate();
  const weekLifestyleOverrides = weekItems.filter((item) => item.type !== 'study');
  const hasOverride = weekLifestyleOverrides.length > 0;
  const weekLifestyleTemplate = hasOverride
    ? buildTemplateFromWeekItems(weekLifestyleOverrides, baseLifestyleTemplate)
    : data.lifestyleTemplate;
  const lifestyleItems = weekLifestyleTemplate ? buildLifestyleItems(weekId, weekLifestyleTemplate) : [];
  const displayLifestyleItems = hasOverride ? weekLifestyleOverrides : lifestyleItems;
  const availableMinutes = hasOverride
    ? computeAvailableMinutesFromItems(displayLifestyleItems)
    : computeAvailableMinutes(weekLifestyleTemplate);

  const completionRate = plannedMinutes > 0 ? Math.round((doneMinutes / plannedMinutes) * 100) : 0;
  const status: SummaryStatus =
    plannedMinutes === 0 ? 'critical' : completionRate >= 80 ? 'good' : completionRate >= 40 ? 'warn' : 'critical';

  const statusConfig = {
    good: { icon: CheckCircle2, className: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    warn: { icon: AlertTriangle, className: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    critical: { icon: AlertCircle, className: 'text-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  }[status];

  const doneCategoryTotals = computeCategoryTotals(doneItems);
  const plannedCategoryTotals = new Map<string, number>();
  studyItems.forEach((item) => {
    if (!item.categoryId) return;
    plannedCategoryTotals.set(item.categoryId, (plannedCategoryTotals.get(item.categoryId) ?? 0) + item.duration);
  });
  const categorySummary = Array.from(plannedCategoryTotals.entries())
    .map(([categoryId, planned]) => ({
      category: data.categories.find((c) => c.id === categoryId),
      planned,
      done: doneCategoryTotals.get(categoryId) ?? 0,
    }))
    .filter((entry) => entry.category)
    .sort((a, b) => b.planned - a.planned)
    .slice(0, 3);

  const StatusIcon = statusConfig.icon;

  return (
    <AppChrome title="今週のサマリ" actions={null}>
      <PageLayout>
        <PageHeader
          title="今週のサマリ"
          description="今週の計画と実績をまとめて確認できます。"
          action={null}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">学習可能時間</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-foreground">
                {availableMinutes > 0 ? `最大 ${formatMinutes(availableMinutes)}` : '未設定'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">計画時間</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-foreground">
                {plannedMinutes > 0 ? formatMinutes(plannedMinutes) : '未設定'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">実績時間</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-foreground">
                {doneMinutes > 0 ? formatMinutes(doneMinutes) : '未記録'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">達成率</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <StatusIcon className={cn('w-5 h-5', statusConfig.className)} />
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {plannedMinutes > 0 ? `${completionRate}%` : '未設定'}
                </div>
                <Badge className={cn('mt-1 border', statusConfig.badge)}>{STATUS_LABELS[status]}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground">カテゴリ別の実績</CardTitle>
            <span className="text-xs text-muted-foreground">計画 / 実績</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySummary.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-3 text-xs text-muted-foreground text-center">
                まだ記録はありません。学習を完了すると実績が表示されます。
              </div>
            ) : (
              categorySummary.map((entry) => {
                const ratio = entry.planned > 0 ? Math.min(1, entry.done / entry.planned) : 0;
                const fillClass =
                  entry.category?.color?.split(' ').find((item) => item.startsWith('bg-')) ?? 'bg-secondary';
                return (
                  <div key={entry.category?.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {entry.category ? (
                          <Badge variant="outline" className={entry.category.color}>
                            {entry.category.name}
                          </Badge>
                        ) : null}
                        <span>実績 {formatMinutes(entry.done)}</span>
                      </div>
                      <span className="font-semibold font-mono text-foreground">{formatMinutes(entry.planned)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-300', fillClass)}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </PageLayout>
    </AppChrome>
  );
}

