import React, { useMemo } from 'react';
import { addDays, differenceInCalendarDays, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Goal,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';

import type { AppData, PlanItem, PlanWeek } from '../types';
import { formatMinutes, minutesToTimeString } from '../utils/time';
import { getWeekRange } from '../utils/week';
import { weekIdFromStart } from '../utils/plan';
import { AppChrome } from './layout/AppChrome';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PageHeader } from './ui/page-header';
import { PageLayout } from './ui/page-layout';
import { Progress } from './ui/progress';

function getItemDate(item: PlanItem, week: PlanWeek): Date {
  const start = parseISO(week.weekStartDate);
  return addDays(start, item.dayOfWeek);
}

function formatRangeLabel(startMinutes: number, duration: number) {
  const endMinutes = startMinutes + duration;
  return `${minutesToTimeString(startMinutes)} - ${minutesToTimeString(endMinutes)}`;
}

export function MyPage({
  data,
  onNavigateSettings,
  onNavigateWeekly,
  onNavigateToday,
  onNavigateMaterials,
}: {
  data: AppData;
  onNavigateSettings: (focus?: 'goal') => void;
  onNavigateWeekly: () => void;
  onNavigateToday: () => void;
  onNavigateMaterials: () => void;
}) {
  const today = new Date();
  const currentWeek = useMemo(() => getWeekRange(today), [today]);
  const weekId = useMemo(() => weekIdFromStart(currentWeek.weekStart), [currentWeek.weekStart]);
  const todayIndex = useMemo(() => (today.getDay() + 6) % 7, [today]);

  const weekPlan = useMemo(
    () => data.planWeeks.find((week) => week.weekStartDate === currentWeek.weekStart) ?? null,
    [currentWeek.weekStart, data.planWeeks],
  );

  const weekStudyItems = useMemo(
    () => data.planItems.filter((item) => item.weekId === weekId && item.type === 'study'),
    [data.planItems, weekId],
  );

  const plannedWeekMinutes = useMemo(
    () => weekStudyItems.reduce((sum, item) => sum + item.duration, 0),
    [weekStudyItems],
  );
  const doneWeekMinutes = useMemo(
    () =>
      weekStudyItems
        .filter((item) => item.status === 'done')
        .reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0),
    [weekStudyItems],
  );
  const weekCompletionRate = plannedWeekMinutes > 0 ? Math.round((doneWeekMinutes / plannedWeekMinutes) * 100) : 0;
  const weekTaskCount = weekStudyItems.length;
  const weekTaskDone = weekStudyItems.filter((item) => item.status === 'done').length;

  const goalTitle = data.userGoalTitle?.trim() ?? '';
  const goalDeadline = data.userGoalDeadline ?? '';
  const goalOwner = data.userName?.trim() ?? '';
  const hasGoalInfo = Boolean(goalTitle || goalDeadline);
  const remainingDays = goalDeadline
    ? Math.max(0, differenceInCalendarDays(parseISO(goalDeadline), today))
    : null;

  const totalDoneMinutes = useMemo(
    () =>
      data.planItems
        .filter((item) => item.type === 'study' && item.status === 'done')
        .reduce((sum, item) => sum + (item.actualDuration ?? item.duration), 0),
    [data.planItems],
  );

  const weekMap = useMemo(() => new Map(data.planWeeks.map((w) => [w.id, w])), [data.planWeeks]);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDoneMinutes = useMemo(
    () =>
      data.planItems.reduce((sum, item) => {
        if (item.type !== 'study' || item.status !== 'done') return sum;
        const week = weekMap.get(item.weekId);
        if (!week) return sum;
        const date = getItemDate(item, week);
        if (date < monthStart || date > monthEnd) return sum;
        return sum + (item.actualDuration ?? item.duration);
      }, 0),
    [data.planItems, monthEnd, monthStart, weekMap],
  );

  const totalGoals = useMemo(
    () => data.planWeeks.reduce((sum, week) => sum + (week.goals?.length ?? 0), 0),
    [data.planWeeks],
  );
  const completedGoals = useMemo(
    () =>
      data.planWeeks.reduce((sum, week) => sum + (week.goals?.filter((g) => g.completed).length ?? 0), 0),
    [data.planWeeks],
  );
  const overallAchievementRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : null;

  const chartWeeks = useMemo(
    () => data.planWeeks.slice().sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate)).slice(-6),
    [data.planWeeks],
  );
  const chartData = useMemo(() => {
    if (chartWeeks.length === 0) return [];
    const totals = new Map<string, number>();
    data.planItems.forEach((item) => {
      if (item.type !== 'study' || item.status !== 'done') return;
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
  }, [chartWeeks, data.planItems]);

  const todayItems = useMemo(
    () =>
      data.planItems
        .filter((item) => item.weekId === weekId && item.type === 'study' && item.dayOfWeek === todayIndex)
        .sort((a, b) => a.startTime - b.startTime),
    [data.planItems, todayIndex, weekId],
  );
  const nextItem = todayItems.find((item) => item.status !== 'done') ?? null;
  const categoryMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);

  const upcomingMaterials = useMemo(() => {
    return data.materials
      .map((material) => {
        const days = material.deadline ? differenceInCalendarDays(parseISO(material.deadline), today) : null;
        return { material, days };
      })
      .filter((entry) => entry.days !== null)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
      .slice(0, 3);
  }, [data.materials, today]);

  const nextStep = useMemo(() => {
    if (!hasGoalInfo) {
      return { label: '目標を決める', onClick: () => onNavigateSettings('goal'), icon: <Goal className="h-4 w-4" /> };
    }
    if (data.materials.length === 0) {
      return { label: '教材を登録', onClick: onNavigateMaterials, icon: <BookOpen className="h-4 w-4" /> };
    }
    if (weekStudyItems.length === 0) {
      return { label: '今週の計画へ', onClick: onNavigateWeekly, icon: <Calendar className="h-4 w-4" /> };
    }
    return null;
  }, [data.materials.length, hasGoalInfo, onNavigateMaterials, onNavigateSettings, onNavigateWeekly, weekStudyItems.length]);

  return (
    <AppChrome title="マイページ" actions={null}>
      <PageLayout>
        <PageHeader
          title="マイページ"
          description="目標と進捗をひと目で確認し、次の学習につなげましょう。"
          action={null}
        />

        {nextStep ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                {nextStep.icon}
                <span>次のステップ</span>
              </div>
              <Button size="sm" onClick={nextStep.onClick}>
                {nextStep.label}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-slate-100" />
            <CardHeader className="relative space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">学習目標</span>
                <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                  {hasGoalInfo ? '進行中' : '未設定'}
                </Badge>
              </div>
              <CardTitle className="text-lg md:text-xl">
                {goalTitle || '目標を設定してください'}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{goalOwner || '表示名を設定してください'}</span>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs text-slate-500">試験日まで</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-slate-700">
                      {remainingDays !== null ? remainingDays : '--'}
                    </span>
                    <span className="text-sm text-slate-500">日</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs text-slate-500">目標期限</p>
                  <div className="mt-2 text-base font-semibold text-slate-700">
                    {goalDeadline || '未設定'}
                  </div>
                </div>
              </div>
              <div>
                {!hasGoalInfo ? (
                  <p className="text-xs text-slate-500">
                    目標名と期限を登録すると、達成率や残り日数が見やすくなります。
                  </p>
                ) : null}
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => onNavigateSettings('goal')}>
                    目標を設定する
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-white">
              <CardContent className="p-4 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-sm text-muted-foreground">累計学習時間</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {totalDoneMinutes === 0 ? '未記録' : formatMinutes(totalDoneMinutes)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="text-sm text-muted-foreground">目標達成率</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {overallAchievementRate === null ? '未計測' : `${overallAchievementRate}%`}
                </div>
                {overallAchievementRate === null ? (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>今週の目標が未設定です。計画画面で入力してください。</p>
                    <Button size="sm" variant="outline" className="h-7 px-3" onClick={onNavigateWeekly}>
                      今週の計画を開く
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-sm text-muted-foreground">今月の学習</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {monthDoneMinutes === 0 ? '未記録' : formatMinutes(monthDoneMinutes)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                  <Target className="h-5 w-5" />
                </div>
                <div className="text-sm text-muted-foreground">計画週数</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {data.planWeeks.length}週
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">直近6週間の学習推移</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">まだ記録がありません。</p>
              ) : (
                <div className="grid grid-cols-6 gap-3">
                  {chartData.map((entry) => (
                    <div key={entry.id} className="flex flex-col items-center gap-2">
                      <div className="h-24 w-full flex items-end">
                        <div
                          className="w-full min-h-2 rounded-full bg-slate-200"
                          style={{ height: `${Math.round(entry.ratio * 100)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400">{entry.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-600 via-slate-500 to-emerald-400 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white/80">NEXT ACTION</CardTitle>
                <Sparkles className="h-4 w-4 text-white/70" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextItem ? (
                <>
                  <div className="text-lg font-semibold">
                    {nextItem.label || categoryMap.get(nextItem.categoryId ?? '')?.name || '学習'}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-white/90">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                      <Clock className="h-4 w-4" />
                      本日 {formatRangeLabel(nextItem.startTime, nextItem.duration)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                      <Goal className="h-4 w-4" />
                      {Math.round(nextItem.duration)}分
                    </span>
                  </div>
                  <Button variant="secondary" className="w-full bg-white text-slate-700 hover:bg-white/90" onClick={onNavigateToday}>
                    今日の予定を開く
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-white/90">今日の予定はまだありません。</p>
                  <div className="grid gap-2">
                    <Button variant="secondary" className="w-full bg-white text-slate-700 hover:bg-white/90" onClick={onNavigateWeekly}>
                      週計画を作成する
                    </Button>
                    <Button variant="secondary" className="w-full bg-white/80 text-slate-700 hover:bg-white/90" onClick={onNavigateToday}>
                      今日の予定を追加する
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                今週の目標
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>学習時間</span>
                  <span>
                    {formatMinutes(doneWeekMinutes)} / {formatMinutes(plannedWeekMinutes || 0)}
                  </span>
                </div>
                <Progress value={weekCompletionRate} className="h-2 bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>タスク消化</span>
                  <span>
                    {weekTaskDone} / {weekTaskCount}
                  </span>
                </div>
                <Progress
                  value={weekTaskCount > 0 ? (weekTaskDone / weekTaskCount) * 100 : 0}
                  className="h-2 bg-slate-100"
                />
              </div>
              {weekPlan?.goals && weekPlan.goals.length > 0 ? (
                <div className="text-xs text-muted-foreground">
                  目標達成: {weekPlan.goals.filter((goal) => goal.completed).length} / {weekPlan.goals.length}
                </div>
              ) : null}
              <Button variant="outline" className="w-full" onClick={onNavigateWeekly}>
                今週の計画を開く
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                もうすぐ締切
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingMaterials.length === 0 ? (
                <p className="text-sm text-muted-foreground">締切が近い教材はありません。</p>
              ) : (
                <div className="space-y-3">
                  {upcomingMaterials.map(({ material, days }) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">{material.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryMap.get(material.categoryId)?.name ?? '教材'}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white text-center text-xs font-semibold text-slate-600 shadow-sm">
                        <span className="text-[11px] text-slate-400">あと</span>
                        <span className="text-base text-slate-700">{Math.max(0, days ?? 0)}</span>
                        <span className="text-[11px] text-slate-400">日</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={onNavigateMaterials}>
                教材管理を開く
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </AppChrome>
  );
}
