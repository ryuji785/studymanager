import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Clock, HelpCircle, Info, Target, TrendingUp } from 'lucide-react';

import { Student, WeeklyPlan } from '../types';
import { formatPeriod } from '../utils/date';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AppChrome } from './layout/AppChrome';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { StateCard } from './states/StateCard';

interface HistoryViewProps {
  student: Student;
  weeklyPlans: WeeklyPlan[];
  period?: { start: string; end: string };
  onBack: () => void;
  onSelectWeek: (plan: WeeklyPlan) => void;
  userType: 'teacher' | 'student';
}

function calcStudyMinutes(plan: WeeklyPlan) {
  return plan.scheduleBlocks.reduce((sum, block) => {
    if (block.category !== 'sleep' && block.category !== 'school') {
      return sum + block.duration;
    }
    return sum;
  }, 0);
}

function calcStudyHours(plan: WeeklyPlan) {
  const minutes = calcStudyMinutes(plan);
  return Math.round((minutes / 60) * 10) / 10;
}

function calcAchievementRate(plan: WeeklyPlan) {
  const completedGoals = plan.goals.filter((g) => g.completed).length;
  const totalGoals = plan.goals.length;
  const rate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  return Math.round(rate);
}

export function HistoryView({ student, weeklyPlans, period, onBack, onSelectWeek, userType }: HistoryViewProps) {
  const plansAsc = useMemo(() => {
    const inRange = period
      ? weeklyPlans.filter((p) => p.weekEnd >= period.start && p.weekStart <= period.end)
      : weeklyPlans;
    return inRange.slice().sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }, [period?.end, period?.start, weeklyPlans]);

  const chartData = useMemo(() => {
    return plansAsc.map((plan) => ({
      week: plan.weekStart.slice(5),
      studyHours: calcStudyHours(plan),
      achievementRate: calcAchievementRate(plan),
    }));
  }, [plansAsc]);

  const periodLabel = period ? formatPeriod(period.start, period.end) : null;

  const totalStudyMinutes = useMemo(() => plansAsc.reduce((sum, plan) => sum + calcStudyMinutes(plan), 0), [plansAsc]);
  const totalStudyHours = useMemo(() => Math.round((totalStudyMinutes / 60) * 10) / 10, [totalStudyMinutes]);

  const totalGoals = useMemo(() => plansAsc.reduce((sum, plan) => sum + plan.goals.length, 0), [plansAsc]);
  const completedGoals = useMemo(
    () => plansAsc.reduce((sum, plan) => sum + plan.goals.filter((g) => g.completed).length, 0),
    [plansAsc],
  );
  const overallAchievementRate = useMemo(() => {
    if (totalGoals <= 0) return 0;
    return Math.round((completedGoals / totalGoals) * 100);
  }, [completedGoals, totalGoals]);

  const plansDesc = useMemo(() => plansAsc.slice().sort((a, b) => b.weekStart.localeCompare(a.weekStart)), [plansAsc]);

  if (plansAsc.length === 0) {
    return (
      <AppChrome
        title="学習の実績"
        back={{ label: '戻る', onClick: onBack }}
        subHeader={
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <span className="truncate">{student.name}（{student.grade}）</span>
            <span className="text-gray-500 whitespace-nowrap">
              {periodLabel ? periodLabel : ''}
              <span className="mx-2 text-gray-300">|</span>
              {userType === 'teacher' ? '講師用' : '生徒用'}
            </span>
          </div>
        }
      >
        <div className="max-w-3xl mx-auto">
          <StateCard
            tone="neutral"
            icon={<TrendingUp className="w-7 h-7" />}
            title="この期間の履歴がありません"
            description={
              periodLabel ? (
                <div className="space-y-1">
                  <p>週計画を作成すると、学習時間・目標達成率の推移が表示されます。</p>
                  <p className="text-xs text-gray-500">期間: {periodLabel}</p>
                </div>
              ) : (
                '週計画を作成すると、学習時間・目標達成率の推移が表示されます。'
              )
            }
            actions={[{ label: '戻る', onClick: onBack, variant: 'outline', icon: <ArrowLeft className="w-4 h-4" /> }]}
          />
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome
      title="学習の実績"
      back={{ label: '戻る', onClick: onBack }}
      subHeader={
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <span className="truncate">{student.name}（{student.grade}）</span>
          <span className="text-gray-500 whitespace-nowrap">
            {periodLabel ? periodLabel : ''}
            <span className="mx-2 text-gray-300">|</span>
            {userType === 'teacher' ? '講師用' : '生徒用'}
          </span>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">
          {/* サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  合計学習時間（期間内）
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          週タイムテーブルで「学校」「睡眠」以外のブロックの合計時間です。自習・塾・部活などが含まれます。
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-gray-900">
                  {totalStudyHours}
                  <span className="text-lg text-gray-500 ml-1">時間</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{plansAsc.length}週分の合計</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  目標達成率（期間内）
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          「今週の目標」で完了チェックされた目標の割合です。3つ中2つ完了なら約67%となります。
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-gray-900">
                  {overallAchievementRate}
                  <span className="text-lg text-gray-500 ml-1">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {completedGoals}/{totalGoals}（完了/総数）
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  計画作成週数
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">期間内で作成された週計画の数です。学習の蓄積状況を把握できます。</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-gray-900">
                  {plansAsc.length}
                  <span className="text-lg text-gray-500 ml-1">週</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">期間内で作成された週計画</p>
              </CardContent>
            </Card>
          </div>

          {chartData.length < 2 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5" />
              <div>
                <p className="font-medium">データが蓄積すると推移が表示されます</p>
                <p className="text-xs text-indigo-700/80">2週以上たまるとグラフの見え方が安定します。</p>
              </div>
            </div>
          )}

          {/* グラフ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">週あたり学習時間</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length < 2 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                    データが増えると推移が表示されます。
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                      />
                      <Bar dataKey="studyHours" fill="#4F46E5" name="学習時間（h）" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">目標達成率の推移</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length < 2 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                    データが増えると推移が表示されます。
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="achievementRate"
                        stroke="#34d399"
                        strokeWidth={2}
                        name="達成率（%）"
                        dot={{ fill: '#34d399', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 週カード */}
          <div>
            <h2 className="text-lg text-gray-900 mb-4">週別計画</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plansDesc.map((plan) => {
                const completedGoals = plan.goals.filter((g) => g.completed).length;
                const totalGoals = plan.goals.length;
                const achievementRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

                return (
                  <Card
                    key={plan.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
                    onClick={() => onSelectWeek(plan)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base mb-1">{formatPeriod(plan.weekStart, plan.weekEnd)}</CardTitle>
                          <p className="text-xs text-gray-500">{plan.isPublished ? '公開済み' : '下書き'}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">目標達成</span>
                          <span className={`${achievementRate === 100 ? 'text-green-600' : 'text-gray-900'}`}>
                            {completedGoals}/{totalGoals} ({achievementRate}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">学習時間</span>
                          <span className="text-gray-900">{calcStudyHours(plan)}時間</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4" size="sm">
                        週計画を開く
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
      </div>
    </AppChrome>
  );
}
