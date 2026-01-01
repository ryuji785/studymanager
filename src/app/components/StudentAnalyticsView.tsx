import React, { useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay, subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CATEGORY_LABELS, type CategoryType, Student, WeeklyPlan } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AppChrome } from './layout/AppChrome';
import { PeriodSelector, type PeriodValue } from './ui/period-selector';

function normalizeDayIndex(date: Date) {
  // JS: Sun=0 ... Sat=6 -> Mon=0 ... Sun=6
  return (date.getDay() + 6) % 7;
}

function keyOf(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function studyMinutesOfPlanDay(plan: WeeklyPlan, dayOfWeek: number) {
  return plan.scheduleBlocks.reduce((sum, block) => {
    if (block.dayOfWeek !== dayOfWeek) return sum;
    if (block.category === 'sleep' || block.category === 'school') return sum;
    return sum + block.duration;
  }, 0);
}

function plannedActualMinutes(plan: WeeklyPlan) {
  const studyBlocks = plan.scheduleBlocks.filter((b) => b.category !== 'sleep' && b.category !== 'school');
  const planned = studyBlocks.reduce((sum, b) => sum + b.duration, 0);
  const actual = studyBlocks.reduce((sum, b) => sum + (b.actualDuration ?? 0), 0);
  return { planned, actual };
}

export function StudentAnalyticsView({
  student,
  weeklyPlans,
  onBack,
}: {
  student: Student;
  weeklyPlans: WeeklyPlan[];
  onBack: () => void;
}) {
  const [period, setPeriod] = useState<PeriodValue>(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 89);
    return { start: keyOf(start), end: keyOf(end) };
  });

  const plansAsc = useMemo(() => {
    const inRange = weeklyPlans.filter((p) => p.weekEnd >= period.start && p.weekStart <= period.end);
    return inRange.slice().sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }, [period.end, period.start, weeklyPlans]);

  const heatmap = useMemo(() => {
    const end = startOfDay(parseISO(period.end));
    const start = startOfDay(parseISO(period.start));
    const dayCount = Math.max(1, differenceInCalendarDays(end, start) + 1);
    const startOffset = normalizeDayIndex(start);

    const daily = new Map<string, number>();
    for (const plan of plansAsc) {
      const weekStartDate = parseISO(plan.weekStart);
      for (let d = 0; d < 7; d++) {
        const date = addDays(weekStartDate, d);
        const minutes = studyMinutesOfPlanDay(plan, d);
        daily.set(keyOf(date), (daily.get(keyOf(date)) ?? 0) + minutes);
      }
    }

    const totalCells = startOffset + dayCount;
    const cells = Array.from({ length: totalCells }).map((_, index) => {
      if (index < startOffset) return { date: null as Date | null, minutes: 0 };
      const date = addDays(start, index - startOffset);
      const minutes = daily.get(keyOf(date)) ?? 0;
      return { date, minutes };
    });

    const maxMinutes = Math.max(...cells.map((c) => c.minutes), 0);

    const color = (minutes: number) => {
      if (!minutes) return 'bg-slate-100';
      const ratio = maxMinutes ? minutes / maxMinutes : 0;
      if (ratio < 0.25) return 'bg-indigo-100';
      if (ratio < 0.5) return 'bg-indigo-200';
      if (ratio < 0.75) return 'bg-indigo-300';
      return 'bg-indigo-400';
    };

    return { cells, color };
  }, [plansAsc]);

  const allocation = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const plan of plansAsc) {
      for (const block of plan.scheduleBlocks) {
        if (block.category === 'sleep' || block.category === 'school') continue;
        byCategory.set(block.category, (byCategory.get(block.category) ?? 0) + block.duration);
      }
    }
    return Array.from(byCategory.entries())
      .map(([category, minutes]) => ({
        category: CATEGORY_LABELS[category as CategoryType] ?? category,
        hours: Math.round((minutes / 60) * 10) / 10,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [plansAsc]);

  const adherence = useMemo(() => {
    return plansAsc.map((plan) => {
      const { planned, actual } = plannedActualMinutes(plan);
      const rate = planned > 0 ? Math.round((actual / planned) * 100) : 0;
      return {
        week: plan.weekStart.slice(5),
        adherenceRate: Math.min(150, rate),
      };
    });
  }, [plansAsc]);

  const focusSessions = useMemo(() => {
    const sessions: Array<{ id: string; date: string; label: string; minutes: number; score: number }> = [];
    for (const plan of plansAsc) {
      const base = parseISO(plan.weekStart);
      for (const block of plan.scheduleBlocks) {
        if (block.category === 'sleep' || block.category === 'school') continue;
        if (block.status !== 'completed') continue;
        const date = format(addDays(base, block.dayOfWeek), 'yyyy/MM/dd');
        const planned = block.duration;
        const actual = block.actualDuration ?? block.duration;
        const score = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0;
        sessions.push({ id: `${plan.id}_${block.id}`, date, label: block.label, minutes: actual, score });
      }
    }
    return sessions
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 10);
  }, [plansAsc]);

  return (
    <AppChrome
      title="学習統計"
      back={{ label: '戻る', onClick: onBack }}
      subHeader={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">{student.name}（{student.grade}）</p>
          <PeriodSelector value={period} onChange={setPeriod} mode="range" />
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-[var(--app-section-gap)]">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">学習量ヒートマップ（期間内）</CardTitle>
          </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="grid grid-rows-7 grid-flow-col gap-1">
                  {heatmap.cells.map((cell, idx) => (
                    <div
                      key={idx}
                      className={`h-3 w-3 rounded-sm ${heatmap.color(cell.minutes)}`}
                      title={cell.date ? `${format(cell.date, 'yyyy/MM/dd')}：${cell.minutes}分` : ''}
                      aria-label={cell.date ? `${format(cell.date, 'yyyy/MM/dd')} ${cell.minutes}分` : ''}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  <p className="font-medium text-gray-900 mb-1">見方</p>
                  <p>色が濃いほど学習量（計画）が多い日です。</p>
                  <p className="text-gray-500 mt-1">データが増えるほど傾向が見えやすくなります。</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--app-section-gap)]">
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">科目別の時間配分</CardTitle>
              </CardHeader>
              <CardContent>
                {allocation.length === 0 ? (
                  <div className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                    予定（学習ブロック）が登録されると、科目別の時間配分が表示されます。
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={allocation.slice(0, 8)} layout="vertical" margin={{ left: 24, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} stroke="#64748b" width={64} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                      <Bar dataKey="hours" fill="#4F46E5" radius={[4, 4, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">計画の達成率</CardTitle>
              </CardHeader>
              <CardContent>
                {adherence.length < 2 ? (
                  <div className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                    複数週分のデータがあると推移が表示されます。実績時間を入力すると精度が上がります。
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={adherence}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#64748b" domain={[0, 120]} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                      <Line type="monotone" dataKey="adherenceRate" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">直近の学習（完了）</CardTitle>
            </CardHeader>
            <CardContent>
              {focusSessions.length === 0 ? (
                <div className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                  完了になった学習ブロックがあると表示されます。
                </div>
              ) : (
                <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                  {focusSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 truncate">{s.label}</div>
                        <div className="text-xs text-gray-500">{s.date}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-700">
                        <span>{Math.round(s.minutes / 30) * 30}分</span>
                        <span className="tabular-nums">{s.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </AppChrome>
  );
}
