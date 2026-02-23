import React, { useMemo, useRef, useEffect } from 'react';
import Header from '../components/Header';
import { useTaskStore } from '../stores/useTaskStore';
import { useBookStore } from '../stores/useBookStore';
import { useGoalStore } from '../stores/useGoalStore';
import { getTaskStartMinutes, addDays, toDateKey, getWeekStartMonday } from '../utils';

function getHeatmapTone(minutes: number): string {
  if (minutes <= 0) return 'bg-slate-100';
  if (minutes <= 30) return 'bg-indigo-200';
  if (minutes <= 90) return 'bg-indigo-400';
  return 'bg-indigo-600';
}

export default function HistoryPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const books = useBookStore((s) => s.books);
  const activeGoal = useGoalStore((s) => s.getActiveGoal());
  const heatmapScrollRef = useRef<HTMLDivElement>(null);

  const historyData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = 140;
    const startDate = addDays(today, -(totalDays - 1));

    // 実タスクデータのみで日別学習時間を集計（完了済みタスクのみ）
    const taskMinutesByDate = tasks.reduce<Record<string, number>>((acc, task) => {
      if (!task?.date || !task.isCompleted) return acc;
      acc[task.date] = (acc[task.date] || 0) + (Number(task.duration) || 0);
      return acc;
    }, {});

    // 未完了も含めたスケジュール済みデータ（ヒートマップ用・計画ベース）
    const scheduledMinutesByDate = tasks.reduce<Record<string, number>>((acc, task) => {
      if (!task?.date) return acc;
      acc[task.date] = (acc[task.date] || 0) + (Number(task.duration) || 0);
      return acc;
    }, {});

    const dailyRecords = Array.from({ length: totalDays }, (_, index) => {
      const date = addDays(startDate, index);
      const dateKey = toDateKey(date);
      // 完了済みのみで集計（実績ベース）
      const minutes = Math.min(240, taskMinutesByDate[dateKey] || 0);
      return { date, dateKey, minutes };
    });

    // 総学習時間は完了済みタスクのみ
    const totalMinutes = tasks
      .filter(t => t.isCompleted && t.type === 'study')
      .reduce((sum, t) => sum + (Number(t.duration) || 0), 0);

    // 連続学習日数（完了済みタスクがある日）
    let currentStreak = 0;
    for (let i = dailyRecords.length - 1; i >= 0; i--) {
      if (dailyRecords[i].minutes <= 0) break;
      currentStreak++;
    }

    // 時間帯別集計（実タスクの開始時刻から）
    const hourlyCounts = Array.from({ length: 24 }, () => 0);
    tasks.forEach((task) => {
      if (!task.isCompleted) return;
      const startHour = Math.floor((getTaskStartMinutes(task) || 0) / 60);
      hourlyCounts[Math.max(0, Math.min(23, startHour))] += Number(task.duration) || 0;
    });

    // 科目別集計（完了済みタスクの duration を紐付けカテゴリに加算）
    const categoryAcc: Record<string, number> = {};
    tasks.forEach((task) => {
      if (!task.isCompleted) return;
      const linkedBook = books.find((b) => b.id === task.bookId);
      const cat = linkedBook?.category || 'その他';
      categoryAcc[cat] = (categoryAcc[cat] || 0) + (Number(task.duration) || 0);
    });

    const subjectBreakdown = Object.entries(categoryAcc)
      .map(([category, minutes]) => ({ category, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    // ヒートマップ（スケジュール済みタスクを可視化）
    const recordMap = dailyRecords.reduce<Record<string, number>>((acc, e) => { acc[e.dateKey] = e.minutes; return acc; }, {});
    const firstWeekStart = getWeekStartMonday(addDays(today, -133));
    const heatmapCells: { key: string; minutes: number; column: number; row: number }[] = [];
    for (let week = 0; week < 20; week++) {
      const weekStart = addDays(firstWeekStart, week * 7);
      for (let d = 0; d < 7; d++) {
        const date = addDays(weekStart, d);
        const key = toDateKey(date);
        heatmapCells.push({ key, minutes: recordMap[key] || 0, column: week + 1, row: d + 1 });
      }
    }

    // ピーク時間帯の分析
    const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
    let insightComment = 'まだ学習記録がありません。最初のタスクを完了させましょう！';
    if (tasks.some(t => t.isCompleted)) {
      if (peakHour <= 5) insightComment = '早朝型の努力家タイプです。朝の集中力を活かせています。';
      else if (peakHour <= 11) insightComment = '午前の立ち上がりが速いタイプです。理論学習との相性抜群です。';
      else if (peakHour <= 17) insightComment = '日中安定型です。計画的に積み上げられています。';
      else insightComment = '夜型の集中タイプですね。静かな時間を武器にできています。';
    }

    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const encouragement =
      currentStreak >= 14 ? '驚異的な継続力です。この調子で合格まで駆け抜けましょう！' :
        currentStreak >= 7 ? '素晴らしいペースです！習慣化が完全に軌道に乗っています。' :
          totalHours >= 100 ? '100時間の壁を突破しました。実力が確実に積み上がっています！' :
            totalHours > 0 ? '今日の一歩が未来を変えます。小さくても前進を続けましょう。' :
              'まずは最初の一歩を踏み出しましょう。全ての達成はここから始まります！';

    return {
      totalHours,
      currentStreak,
      encouragement,
      heatmapCells,
      hourlyCounts,
      subjectBreakdown,
      insightComment,
    };
  }, [books, tasks]);

  useEffect(() => {
    if (!heatmapScrollRef.current) return;
    const el = heatmapScrollRef.current;
    el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
  }, [historyData.heatmapCells]);

  const maxHourlyCount = Math.max(...historyData.hourlyCounts, 1);
  const totalSubjectMinutes = historyData.subjectBreakdown.reduce((s, i) => s + i.minutes, 0) || 1;
  const hasAnyCompletedTask = tasks.some(t => t.isCompleted);

  return (
    <div className="pb-24 animate-fade-in text-slate-700">
      <Header title="あゆみ" showSettings={false} />
      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Dashboard Card */}
        <section className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg">
          <p className="text-indigo-100 text-sm font-medium mb-3">あなたの学習ダッシュボード</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs tracking-wider text-indigo-100">総学習時間（完了済み）</p>
              <p className="text-4xl font-bold tracking-tight mt-1">{historyData.totalHours}<span className="text-xl ml-1 align-middle">時間</span></p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-indigo-100">継続日数</p>
              <p className="text-4xl font-bold tracking-tight mt-1">{historyData.currentStreak}<span className="text-xl ml-1 align-middle">日</span></p>
            </div>
          </div>
          {activeGoal && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-indigo-100 mb-1">
                <span>目標: {activeGoal.targetHours}h</span>
                <span className="font-bold text-white">{historyData.totalHours}h 完了</span>
              </div>
              <div className="w-full bg-white/15 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((historyData.totalHours / activeGoal.targetHours) * 100))}%` }}></div>
              </div>
            </div>
          )}
          <p className="mt-4 text-sm sm:text-base bg-white/15 rounded-2xl px-4 py-3">{historyData.encouragement}</p>
        </section>

        {/* Heatmap */}
        <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-700">学習の足あと（直近3ヶ月）</h3>
            <p className="text-xs text-slate-500 mt-1">色の濃さで学習量を表しています</p>
          </div>
          {hasAnyCompletedTask ? (
            <>
              <div className="flex gap-2">
                <div className="grid gap-1 text-[10px] text-slate-500 pr-1 text-right" style={{ gridTemplateRows: 'repeat(7, 16px)' }}>
                  <div style={{ gridRow: 1 }} className="flex items-center justify-end">月</div>
                  <div style={{ gridRow: 3 }} className="flex items-center justify-end">水</div>
                  <div style={{ gridRow: 5 }} className="flex items-center justify-end">金</div>
                </div>
                <div ref={heatmapScrollRef} className="overflow-x-auto pb-2">
                  <div className="grid min-w-max gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gridAutoColumns: '16px' }}>
                    {historyData.heatmapCells.map((cell) => (
                      <div key={cell.key} title={`${cell.key} / ${cell.minutes}分`} className={`h-4 w-4 rounded-[4px] ${getHeatmapTone(cell.minutes)}`} style={{ gridColumn: cell.column, gridRow: cell.row }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>少</span><span>・・・</span>
                <span className="h-3 w-3 rounded-sm bg-slate-100" />
                <span className="h-3 w-3 rounded-sm bg-indigo-200" />
                <span className="h-3 w-3 rounded-sm bg-indigo-400" />
                <span className="h-3 w-3 rounded-sm bg-indigo-600" />
                <span>・・・</span><span>多</span>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">まだ完了したタスクがありません。</p>
              <p className="text-xs mt-1">タスクを完了すると、ここに学習記録が表示されます。</p>
            </div>
          )}
        </section>

        {/* Hourly Chart */}
        <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-700">時間帯別の集中度</h3>
            <p className="text-xs text-slate-500 mt-1">よく学習する時間帯がひと目でわかります</p>
          </div>
          <div className="h-48 flex items-end gap-1 rounded-xl bg-slate-50 p-3">
            {historyData.hourlyCounts.map((count, hour) => {
              const height = Math.max(4, (count / maxHourlyCount) * 100);
              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end min-w-[12px]">
                  <div className={`w-full rounded-t-md ${count > 0 ? 'bg-indigo-500/90' : 'bg-slate-200'}`} style={{ height: `${height}%` }} />
                  <span className="mt-1 h-3 text-[10px] text-slate-500">{hour % 6 === 0 ? hour : ''}</span>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{historyData.insightComment}</p>
        </section>

        {/* Subject Breakdown */}
        <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-700">科目別のバランス</h3>
            <p className="text-xs text-slate-500 mt-1">カテゴリ別の学習比率（完了済みタスクより）</p>
          </div>
          {historyData.subjectBreakdown.length > 0 ? (
            <div className="space-y-3">
              {historyData.subjectBreakdown.map((subject, index) => {
                const ratio = Math.round((subject.minutes / totalSubjectMinutes) * 100);
                const hours = (subject.minutes / 60).toFixed(1);
                return (
                  <div key={subject.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{subject.category}</span>
                      <span className="text-slate-500">{hours}h ({ratio}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${index % 2 === 0 ? 'bg-indigo-500' : 'bg-violet-500'}`} style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <p className="text-sm">完了した学習タスクがないため、科目別データを表示できません。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
