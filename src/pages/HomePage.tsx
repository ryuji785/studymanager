import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Check, ChevronRight, Target, TrendingUp, X, Calendar, Plus, Flag } from 'lucide-react';
import Header from '../components/Header';
import { useTaskStore } from '../stores/useTaskStore';
import { useGoalStore } from '../stores/useGoalStore';
import { getTaskStartMinutes, toTimeString, toDateKey } from '../utils';

export default function HomePage() {
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const navigate = useNavigate();

  const todayKey = toDateKey(new Date());
  const todayGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return 'こんばんは';
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  }, []);

  const timelineTasks = useMemo(() =>
    tasks
      .filter((t) => t.date === todayKey)
      .sort((a, b) => getTaskStartMinutes(a) - getTaskStartMinutes(b)),
    [tasks, todayKey],
  );

  const nextActionTask = useMemo(() =>
    timelineTasks.find((t) => !t.isCompleted),
    [timelineTasks],
  );

  // 今日の合計予定時間（分）を動的計算
  const totalScheduledMinutesToday = useMemo(() => {
    return timelineTasks.reduce((sum, t) => sum + (Number(t.duration) || 0), 0);
  }, [timelineTasks]);

  // --- Goal Dashboard ---
  const goals = useGoalStore((s) => s.goals);
  const activeGoal = useGoalStore((s) => s.getActiveGoal());
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const addGoal = useGoalStore((s) => s.addGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const setActiveGoal = useGoalStore((s) => s.setActiveGoal);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isGoalListOpen, setIsGoalListOpen] = useState(false);
  const [isNewGoalMode, setIsNewGoalMode] = useState(false);
  const [goalDraft, setGoalDraft] = useState({
    title: activeGoal?.title || '',
    examDate: activeGoal?.examDate || '',
    targetHours: activeGoal?.targetHours ?? 150,
    weekdayHoursTarget: activeGoal?.weekdayHoursTarget ?? 1.5,
    weekendHoursTarget: activeGoal?.weekendHoursTarget ?? 3.0,
  });

  const openGoalEditModal = () => {
    if (activeGoal) {
      setGoalDraft({
        title: activeGoal.title,
        examDate: activeGoal.examDate,
        targetHours: activeGoal.targetHours,
        weekdayHoursTarget: activeGoal.weekdayHoursTarget,
        weekendHoursTarget: activeGoal.weekendHoursTarget,
      });
    } else {
      setGoalDraft({ title: '', examDate: '', targetHours: 150, weekdayHoursTarget: 1.5, weekendHoursTarget: 3.0 });
    }
    setIsNewGoalMode(false);
    setIsGoalModalOpen(true);
  };

  const openNewGoalModal = () => {
    setGoalDraft({ title: '', examDate: '', targetHours: 150, weekdayHoursTarget: 1.5, weekendHoursTarget: 3.0 });
    setIsNewGoalMode(true);
    setIsGoalModalOpen(true);
    setIsGoalListOpen(false);
  };

  const cumulativeStudyHours = useMemo(() => {
    const totalMinutes = tasks
      .filter((t) => t.type === 'study' && t.isCompleted)
      .reduce((sum, t) => sum + (Number(t.duration) || 0), 0);
    return Math.round(totalMinutes / 6) / 10; // e.g. 15.5 hr
  }, [tasks]);

  const goalDashboardData = useMemo(() => {
    if (!activeGoal) return null;
    const examDate = new Date(activeGoal.examDate);
    examDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));
    const targetHours = activeGoal.targetHours;
    const currentHours = cumulativeStudyHours;
    const progressPercent = targetHours > 0 ? Math.min(100, Math.round((currentHours / targetHours) * 100)) : 0;

    const remainingHours = Math.max(0, targetHours - currentHours);
    let isWarning = false;
    let requiredText = '目標達成ペースに乗っています';

    if (daysLeft > 0) {
      let remainingWeekdays = 0;
      let remainingWeekends = 0;
      for (let i = 0; i < daysLeft; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const day = d.getDay();
        if (day === 0 || day === 6) remainingWeekends++;
        else remainingWeekdays++;
      }

      const weightedDays = (remainingWeekdays * activeGoal.weekdayHoursTarget) + (remainingWeekends * activeGoal.weekendHoursTarget);

      if (weightedDays > 0) {
        const scale = remainingHours / weightedDays;
        const requiredWeekday = (activeGoal.weekdayHoursTarget * scale).toFixed(1);
        const requiredWeekend = (activeGoal.weekendHoursTarget * scale).toFixed(1);
        requiredText = `平日は日/${requiredWeekday}h、休日は日/${requiredWeekend}h 必要です`;

        if (scale > 1.2) {
          isWarning = true;
          requiredText = `⚠ 遅れ気味: 平日 ${requiredWeekday}h / 休日 ${requiredWeekend}h 必要`;
        }
      } else {
        const requiredHoursPerDay = Math.ceil(remainingHours / daysLeft * 10) / 10;
        requiredText = `今日から1日 ${requiredHoursPerDay}h の確保が必要です`;
      }
    } else if (remainingHours > 0) {
      isWarning = true;
      requiredText = '⚠ 試験日が経過したか、本日です';
    }

    return { daysLeft, targetHours, currentHours, progressPercent, requiredText, isWarning };
  }, [activeGoal, cumulativeStudyHours]);

  const saveGoal = () => {
    if (isNewGoalMode) {
      addGoal({ ...goalDraft, isActive: true });
    } else if (activeGoal) {
      updateGoal(activeGoal.id, goalDraft);
    }
    setIsGoalModalOpen(false);
  };

  const totalScheduledHours = (totalScheduledMinutesToday / 60).toFixed(1);

  return (
    <div className="pb-24 animate-fade-in">
      <Header title="ホーム" showSettings={false} />
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-slate-500 text-sm mb-1">{todayGreeting}</p>

        {/* --- Goal Dashboard --- */}
        {activeGoal && goalDashboardData ? (
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 mt-2 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target size={140} className="transform translate-x-4 -translate-y-4" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-indigo-200 text-sm font-bold mb-0.5">{activeGoal.title} まで</p>
                  <h2 className="text-3xl font-extrabold flex items-baseline gap-2">
                    あと <span className="text-5xl text-amber-400 font-black">{goalDashboardData.daysLeft}</span> 日
                  </h2>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  <button
                    onClick={openGoalEditModal}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md transition-colors"
                  >
                    設定
                  </button>
                  {goals.length > 1 && (
                    <button
                      onClick={() => setIsGoalListOpen(true)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md transition-colors"
                    >
                      切替
                    </button>
                  )}
                  <button
                    onClick={openNewGoalModal}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1"
                  >
                    <Plus size={10} /> 新規
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-xs sm:text-sm mb-1.5 items-end">
                  <span className="font-semibold text-indigo-100">目標: {goalDashboardData.targetHours}h</span>
                  <span className="font-bold flex items-center gap-1">
                    <span className="text-lg">{goalDashboardData.currentHours}h</span>
                    <span className="text-indigo-200">/ {goalDashboardData.progressPercent}%</span>
                  </span>
                </div>
                <div className="w-full bg-indigo-950/40 rounded-full h-3 backdrop-blur-sm overflow-hidden border border-indigo-800/50">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-1000 relative"
                    style={{ width: `${goalDashboardData.progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              <div className={`backdrop-blur-md rounded-xl p-3 flex items-center gap-4 ${goalDashboardData.isWarning ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-white/10'}`}>
                <div className={`p-2 rounded-lg shrink-0 ${goalDashboardData.isWarning ? 'bg-rose-500/30 text-rose-200' : 'bg-amber-400/20 text-amber-300'}`}>
                  <TrendingUp size={22} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold ${goalDashboardData.isWarning ? 'text-rose-200' : 'text-indigo-200'}`}>
                    目標達成のペースメイク
                  </p>
                  <p className="text-sm font-bold mt-0.5 truncate">{goalDashboardData.requiredText}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 mt-2 mb-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center mb-3">
              <Target size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">目標を設定しましょう</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-[240px]">
              試験日や目標時間を設定すると、ここに進捗ダッシュボードが表示されます。
            </p>
            <button
              onClick={() => { setIsNewGoalMode(true); setIsGoalModalOpen(true); }}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
            >
              目標を作成する
            </button>
          </div>
        )}

        {/* 今日の予定サマリー */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-800">
            今日の予定:{' '}
            <span className="text-indigo-600">{totalScheduledHours}h</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {timelineTasks.filter(t => t.isCompleted).length}/{timelineTasks.length} 完了
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-indigo-100 border border-indigo-50 mt-4">
          {nextActionTask ? (
            <>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">次のタスク</span>
              <h3 className="text-xl font-bold text-slate-800 mb-2 mt-3">{nextActionTask.title}</h3>
              <div className="space-y-2 text-sm text-slate-500 mb-6">
                <p className="flex items-center">
                  <Clock size={16} />
                  <span className="ml-2 font-medium">
                    {toTimeString(getTaskStartMinutes(nextActionTask))} -{' '}
                    {toTimeString(getTaskStartMinutes(nextActionTask) + Number(nextActionTask?.duration ?? 0))}
                  </span>
                </p>
                <p>所要時間: {nextActionTask.duration}分</p>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {nextActionTask.type === 'study' ? '学習' : '予定'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => navigate('/plan')} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  <Calendar size={18} /> 計画表を開く
                </button>
                <button
                  onClick={() => toggleTaskCompletion(nextActionTask.id)}
                  className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Check size={18} /> 完了
                </button>
              </div>
            </>
          ) : timelineTasks.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-emerald-600">🎉 本日の予定はすべて完了です！</p>
              <p className="text-slate-500 text-sm mt-2">この調子で明日も進めましょう。</p>
              <button onClick={() => navigate('/plan')} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                <Calendar size={16} /> 明日の計画を立てる
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-slate-700">まだ今日の予定がありません</p>
              <p className="text-slate-500 text-sm mt-2">15分だけでも学習を進めてみませんか？</p>
            </div>
          )}
        </div>

        <section className="mt-10">
          <h3 className="text-lg font-bold text-slate-800 mb-4">今日の予定</h3>
          {timelineTasks.length > 0 ? (
            <div className="relative pl-6 space-y-5">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200"></div>
              {timelineTasks.map((task) => {
                const isCompleted = Boolean(task.isCompleted);
                return (
                  <div key={task.id} className="relative">
                    <div className={`absolute -left-[18px] top-1.5 h-3 w-3 rounded-full ${isCompleted ? 'bg-slate-300' : 'bg-indigo-500'}`}></div>
                    <div
                      className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3"
                    >
                      {/* Completion toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(task.id); }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}
                        title={isCompleted ? '完了を取消' : '完了にする'}
                      >
                        {isCompleted && <Check size={12} strokeWidth={3} />}
                      </button>
                      <div
                        onClick={() => navigate(`/plan?date=${task.date}`)}
                        className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <p className={`text-xs font-semibold ${isCompleted ? 'text-slate-400' : 'text-slate-700'}`}>
                          {toTimeString(getTaskStartMinutes(task))} - {toTimeString(getTaskStartMinutes(task) + Number(task.duration ?? 0))}
                        </p>
                        <p className={`mt-1 font-semibold ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {task.title}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 shrink-0" onClick={() => navigate(`/plan?date=${task.date}`)} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">☀️</span>
              </div>
              <p className="text-sm font-bold text-slate-700 mb-1">今日の予定はありません</p>
              <p className="text-xs text-slate-500 mb-4">計画表からタスクを追加して、学習を始めましょう</p>
              <button
                onClick={() => navigate('/plan')}
                className="px-5 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={16} /> 予定を追加する
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Goal Setting Modal — センターダイアログ型 */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsGoalModalOpen(false)} />
          <div className="bg-white rounded-2xl p-5 shadow-2xl relative z-10 w-full max-w-md max-h-[88svh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{isNewGoalMode ? '新しい目標を追加' : '目標の設定'}</h3>
                <p className="text-xs text-slate-400">試験日と学習時間の目安を入力します</p>
              </div>
              <button onClick={() => setIsGoalModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">試験・目標名</span>
                <input
                  type="text"
                  value={goalDraft.title}
                  onChange={(e) => setGoalDraft({ ...goalDraft, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="例）TOEIC 800点、宅建士"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">試験日（目標日）</span>
                <input
                  type="date"
                  value={goalDraft.examDate}
                  onChange={(e) => setGoalDraft({ ...goalDraft, examDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">全学習時間（目標）: 時間</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={goalDraft.targetHours}
                  onChange={(e) => setGoalDraft({ ...goalDraft, targetHours: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[11px] text-slate-500 font-bold">平日の1日目標 (時間)</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={goalDraft.weekdayHoursTarget}
                    onChange={(e) => setGoalDraft({ ...goalDraft, weekdayHoursTarget: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500 font-bold">休日の1日目標 (時間)</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={goalDraft.weekendHoursTarget}
                    onChange={(e) => setGoalDraft({ ...goalDraft, weekendHoursTarget: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button onClick={() => setIsGoalModalOpen(false)} className="py-3 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 bg-slate-50 font-bold text-sm">キャンセル</button>
                <button
                  onClick={saveGoal}
                  className="py-3 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-50"
                  disabled={!goalDraft.title.trim() || !goalDraft.examDate}
                >
                  保存する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal List / Switcher Modal — センターダイアログ型 */}
      {isGoalListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsGoalListOpen(false)} />
          <div className="bg-white rounded-2xl p-5 shadow-2xl relative z-10 w-full max-w-md max-h-[88svh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">目標を切り替え</h3>
              <button onClick={() => setIsGoalListOpen(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setActiveGoal(g.id); setIsGoalListOpen(false); }}
                  className={`w-full text-left rounded-2xl px-4 py-3 border transition-colors flex items-center gap-3 ${g.isActive ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  <Flag size={16} className={g.isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-sm truncate ${g.isActive ? 'text-indigo-700' : 'text-slate-700'}`}>{g.title}</p>
                    <p className="text-xs text-slate-400">{g.examDate} / 目標 {g.targetHours}h</p>
                  </div>
                  {g.isActive && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">現在</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteGoal(g.id); }}
                    className="p-1 hover:bg-rose-100 rounded text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </button>
              ))}
            </div>
            <button
              onClick={openNewGoalModal}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50"
            >
              <Plus size={16} /> 新しい目標を追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
