import React from 'react';
import { Calendar, PanelRightClose, PanelRightOpen } from 'lucide-react';

import type { Category } from '../../types';
import { formatMinutes } from '../../utils/time';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { PeriodSelector, type PeriodValue } from '../ui/period-selector';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Progress } from '../ui/progress';
import { cn } from '../ui/utils';

type CategorySummaryEntry = {
  category?: Category;
  planned: number;
  done: number;
};

function normalizeLabel(value?: string | null) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[?？]+$/.test(trimmed)) return '';
  return trimmed;
}

export function WeekSummary({
  period,
  onChangePeriod,
  budgetRemainingDisplay,
  budgetTotalDisplay,
  budgetPlannedDisplay,
  budgetRemainingRatio,
  budgetOver,
  budgetReady,
  completionLabel,
  progressValue,
  doneTotalDisplay,
  categorySummary,
  onNavigateSettings,
  showTodayToggle,
  todayPanelOpen,
  onToggleTodayPanel,
}: {
  period: PeriodValue;
  onChangePeriod: (next: PeriodValue) => void;
  budgetRemainingDisplay: string;
  budgetTotalDisplay: string;
  budgetPlannedDisplay: string;
  budgetRemainingRatio: number;
  budgetOver: boolean;
  budgetReady: boolean;
  completionLabel: string;
  progressValue: number;
  doneTotalDisplay: string;
  categorySummary: CategorySummaryEntry[];
  onNavigateSettings: (focus?: 'goal') => void;
  showTodayToggle: boolean;
  todayPanelOpen: boolean;
  onToggleTodayPanel: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-4 h-4 text-muted-foreground/70" />
            <PeriodSelector value={period} onChange={onChangePeriod} mode="week" weekStartsOn={1} />
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <div className="min-w-[220px] flex-1 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px]">今週あと</span>
                {budgetOver ? <Badge variant="destructive">予算超過</Badge> : null}
              </div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {budgetRemainingDisplay}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>最大 {budgetTotalDisplay}</span>
                <span>予定 {budgetPlannedDisplay}</span>
              </div>
              <div className="mt-2">
                <Progress value={budgetRemainingRatio} className="h-1.5 bg-secondary" />
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {budgetReady ? '残りの学習時間予算' : '生活時間を登録すると算出されます'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px]">進捗</span>
              <div className="flex items-center gap-2">
                <Progress value={progressValue} className="h-1.5 w-[140px] bg-secondary" />
                <span className="text-sm font-semibold text-foreground">{completionLabel}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px]">実績合計</span>
              <span className="text-sm font-semibold text-foreground">{doneTotalDisplay}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  詳細
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">実績（内訳）</div>
                  {categorySummary.length === 0 ? (
                    <div className="text-xs text-muted-foreground">まだ記録はありません。</div>
                  ) : (
                    <div className="space-y-3">
                      {categorySummary.slice(0, 5).map((entry) => {
                        const ratio = entry.planned > 0 ? Math.min(1, entry.done / entry.planned) : 0;
                        const fillClass =
                          entry.category?.color
                            ?.split(' ')
                            .find((item) => item.startsWith('bg-')) ?? 'bg-secondary';
                        const categoryName = normalizeLabel(entry.category?.name) ?? '未分類';
                        return (
                          <div key={entry.category?.id ?? categoryName} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={entry.category?.color ?? ''}>
                                  {categoryName}
                                </Badge>
                                <span className="text-muted-foreground">実績 {formatMinutes(entry.done)}</span>
                              </div>
                              <span className="font-semibold font-mono text-foreground">{formatMinutes(entry.planned)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-300', fillClass)}
                                style={{ width: `${ratio * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={onNavigateSettings}>
              生活時間を編集
            </Button>
            {showTodayToggle ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTodayPanel}
                aria-label={todayPanelOpen ? '今日の予定を閉じる' : '今日の予定を開く'}
              >
                {todayPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
