import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Check, Clock } from 'lucide-react';
import Header from '../components/Header';
import { useTaskStore } from '../stores/useTaskStore';
import { useBookStore } from '../stores/useBookStore';
import { toDateKey, toTimeString, addDays } from '../utils';

export default function MonthlyCalendarPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const books = useBookStore((s) => s.books);
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // --- カレンダー生成 ---
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{ date: Date; key: string; inMonth: boolean }> = [];
    // 前月の日
    for (let i = startDow - 1; i >= 0; i--) {
      const d = addDays(firstDay, -i - 1);
      cells.push({ date: d, key: toDateKey(d), inMonth: false });
    }
    // 当月の日
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      cells.push({ date: d, key: toDateKey(d), inMonth: true });
    }
    // 翌月の日（6行分まで）
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i + 1);
      cells.push({ date: d, key: toDateKey(d), inMonth: false });
    }
    return cells;
  }, [viewYear, viewMonth]);

  // 日毎のタスク集計
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }, [tasks]);

  const selectedTasks = selectedDateKey ? (tasksByDate[selectedDateKey] || []) : [];

  const shiftMonth = (offset: number) => {
    const d = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDateKey(null);
  };

  const goToWeekPlan = (dateKey: string) => {
    navigate(`/plan?date=${dateKey}`);
  };

  const monthLabel = `${viewYear}年${viewMonth + 1}月`;
  const weekHeaders = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <div className="min-h-screen pb-28">
      <Header title="月間カレンダー" showFreePlanLabel={false} />

      <div className="px-4 pt-3 pb-4 max-w-4xl mx-auto">
        {/* 月ナビゲーション */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors active:scale-95">
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">{monthLabel}</h2>
          <button onClick={() => shiftMonth(1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors active:scale-95">
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-1">
          {weekHeaders.map((w, i) => (
            <div key={w} className={`text-center text-[11px] font-bold py-1 ${i >= 5 ? 'text-rose-400' : 'text-slate-400'}`}>
              {w}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
          {calendarDays.map((cell) => {
            const dayTasks = tasksByDate[cell.key] || [];
            const studyTasks = dayTasks.filter((t) => t.type === 'study');
            const completedCount = studyTasks.filter((t) => t.isCompleted).length;
            const totalMinutes = studyTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedDateKey;
            const hasEvents = dayTasks.length > 0;

            return (
              <button
                key={cell.key}
                onClick={() => setSelectedDateKey(cell.key === selectedDateKey ? null : cell.key)}
                className={`
                  relative bg-white p-1.5 min-h-[72px] sm:min-h-[88px] flex flex-col items-center transition-all
                  ${!cell.inMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'bg-indigo-50 ring-2 ring-indigo-400 ring-inset' : 'hover:bg-slate-50'}
                `}
              >
                <span className={`
                  w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold leading-none mb-1
                  ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}
                `}>
                  {cell.date.getDate()}
                </span>

                {/* タスクドットインジケーター */}
                {hasEvents && (
                  <div className="flex flex-col gap-0.5 mt-0.5 w-full">
                    {totalMinutes > 0 && (
                      <span className="text-[9px] font-bold text-indigo-500 text-center leading-tight">
                        {totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? `${totalMinutes % 60}m` : ''}` : `${totalMinutes}m`}
                      </span>
                    )}
                    <div className="flex gap-0.5 justify-center flex-wrap">
                      {dayTasks.slice(0, 4).map((t, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${t.isCompleted ? 'bg-emerald-400' : 'bg-indigo-300'}`}
                        />
                      ))}
                      {dayTasks.length > 4 && (
                        <span className="text-[8px] text-slate-400 font-bold">+{dayTasks.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 選択日のタスク一覧 */}
        {selectedDateKey && (
          <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {(() => {
                  const d = new Date(selectedDateKey);
                  return `${d.getMonth() + 1}月${d.getDate()}日（${weekHeaders[(d.getDay() + 6) % 7]}）`;
                })()}
              </h3>
              <button
                onClick={() => goToWeekPlan(selectedDateKey)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors active:scale-95"
              >
                <Plus size={12} /> 週間計画で編集
              </button>
            </div>

            {selectedTasks.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {selectedTasks
                  .sort((a, b) => a.startMinutes - b.startMinutes)
                  .map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 px-4 py-3 ${task.isCompleted ? 'opacity-60' : ''}`}
                    >
                      {/* Completion toggle */}
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}
                        title={task.isCompleted ? '完了を取消' : '完了にする'}
                      >
                        {task.isCompleted && <Check size={12} strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold text-slate-800 truncate ${task.isCompleted ? 'line-through' : ''}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {toTimeString(task.startMinutes)} ~ {toTimeString(task.startMinutes + task.duration)}
                          <span className="ml-1 text-slate-300">({task.duration}分)</span>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-400 mb-3">この日の予定はありません</p>
                <button
                  onClick={() => goToWeekPlan(selectedDateKey)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  <Plus size={12} /> 予定を追加する
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
