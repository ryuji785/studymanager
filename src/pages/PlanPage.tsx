import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, ChevronRight, Plus, Clock, Check, Trash2, X, Book } from 'lucide-react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { useTaskStore } from '../stores/useTaskStore';
import { useBookStore } from '../stores/useBookStore';
import { useGoalStore } from '../stores/useGoalStore';
import {
  DEFAULT_PLAN_START_HOUR,
  DEFAULT_PLAN_END_HOUR,
  PLAN_SLOT_MINUTES,
  PLAN_ROW_HEIGHT,
  type Task,
} from '../constants';
import {
  getTaskStartMinutes,
  toTimeString,
  getWeekStartMonday,
  toDateKey,
  addDays,
  getWeekDays,
  calculateTaskLayout,
} from '../utils';

// --- TaskItem Component (with drag & drop) ---
function TaskItem({
  task, layoutStyle, planStartMinutes, planEndMinutes, firstMinute, rowHeight, slotMinutes,
  justAddedTaskId, onTaskClick, onTaskDelete, onUpdateTask, onToggleComplete,
}: {
  task: Task; layoutStyle?: { left: string; width: string; zIndex: number };
  planStartMinutes: number; planEndMinutes: number; firstMinute: number; rowHeight: number;
  slotMinutes: number; justAddedTaskId: number | null;
  onTaskClick: (task: Task) => void; onTaskDelete: (id: number) => void;
  onUpdateTask: (id: number, newStart: number) => void;
  onToggleComplete: (id: number) => void;
}) {

  const startMinutes = getTaskStartMinutes(task);
  const duration = Number(task.duration || 0);
  const endMinutes = startMinutes + duration;
  const visibleStart = Math.max(startMinutes, planStartMinutes);
  const visibleEnd = Math.min(endMinutes, planEndMinutes);
  if (visibleEnd <= visibleStart) return null;

  const top = ((visibleStart - firstMinute) / slotMinutes) * rowHeight + 4;
  const height = Math.max(28, ((visibleEnd - visibleStart) / slotMinutes) * rowHeight - 8);
  const isCompleted = Boolean(task.isCompleted);

  const wasDragged = useRef(false);

  const handleCardClick = () => {
    if (!wasDragged.current) {
      onTaskClick(task);
    }
  };

  return (
    <motion.div
      className="absolute pl-1 pr-1 pointer-events-auto"
      style={{ top, height, left: layoutStyle?.left || '0%', width: layoutStyle?.width || '100%', zIndex: 10, touchAction: 'none' }}
      drag="y" dragMomentum={false} dragElastic={0} dragSnapToOrigin
      whileDrag={{ zIndex: 50, scale: 1.03 }}
      onDragStart={() => { wasDragged.current = true; if (navigator.vibrate) navigator.vibrate(30); }}
      onDragEnd={(_, info) => {
        const dm = Math.round((info.offset.y / rowHeight) * slotMinutes / 5) * 5;
        if (dm !== 0) onUpdateTask(task.id, Math.max(0, startMinutes + dm));
        // Reset wasDragged after a short delay so onClick doesn't fire
        setTimeout(() => { wasDragged.current = false; }, 50);
      }}
      onPointerDown={() => { wasDragged.current = false; }}
      initial={false}
    >
      <div onClick={handleCardClick}
        className={`relative group h-full ${task.color} rounded-xl p-3 border shadow-sm transition-all ${isCompleted ? 'opacity-70 saturate-75' : ''} ${justAddedTaskId === task.id ? 'animate-task-pop' : ''} cursor-pointer hover:scale-[1.01]`}>
        <div className="flex items-start gap-2 h-full overflow-hidden">
          {/* Always-visible completion toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-current/40 hover:border-emerald-400 hover:bg-emerald-50'}`}
            title={isCompleted ? '完了を取消' : '完了にする'}
          >
            {isCompleted && <Check size={10} strokeWidth={3} />}
          </button>
          <div className="flex flex-col h-full min-w-0 flex-1">
            <span className="text-xs font-bold opacity-80 truncate pr-1">{task.title}</span>
            <div className="mt-1 flex items-center gap-2 flex-wrap content-start">
              <span className="text-[10px] font-medium bg-white/60 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"><Clock size={10} /> {toTimeString(startMinutes)} - {toTimeString(endMinutes)}</span>
              <span className="text-[10px] font-medium bg-white/60 px-1.5 py-0.5 rounded shrink-0">{task.duration}分</span>
              {isCompleted && <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0"><Check size={10} /> 完了</span>}
            </div>
          </div>
          {/* Always-visible delete button */}
          <button onClick={(e) => { e.stopPropagation(); onTaskDelete(task.id); }} className="p-1 hover:bg-black/10 rounded text-current/50 hover:text-current transition-colors shrink-0" title="削除"><Trash2 size={14} /></button>
        </div>
      </div>
    </motion.div>
  );
}

// --- PlanPage ---
export default function PlanPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const updateTaskStartMinutes = useTaskStore((s) => s.updateTaskStartMinutes);
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const books = useBookStore((s) => s.books);
  const updateBookProgress = useBookStore((s) => s.updateBookProgress);
  const activeGoal = useGoalStore((s) => s.getActiveGoal());

  const [searchParams] = useSearchParams();

  const [weekStartDate, setWeekStartDate] = useState(() => getWeekStartMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => {
    // URLパラメータから日付を読み込む（HomePageのタイムラインからの遷移対応）
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) return dateParam;
    }
    return toDateKey(addDays(getWeekStartMonday(new Date()), 1));
  });
  const [planStartHour, setPlanStartHour] = useState(DEFAULT_PLAN_START_HOUR);
  const [planEndHour, setPlanEndHour] = useState(DEFAULT_PLAN_END_HOUR);
  const [justAddedTaskId, setJustAddedTaskId] = useState<number | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [addTaskDuration, setAddTaskDuration] = useState(60);
  // フリーテキストタスク追加用
  const [addMode, setAddMode] = useState<'book' | 'free'>('book');
  const [freeTaskTitle, setFreeTaskTitle] = useState('');
  const [freeTaskColor, setFreeTaskColor] = useState('bg-slate-50 text-slate-700 border-slate-200');
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartMinutes, setEditStartMinutes] = useState(0);
  const [editDuration, setEditDuration] = useState(60);
  const [editIsCompleted, setEditIsCompleted] = useState(false);

  // タスク完了時の教材進捗連動
  const [progressLinkModal, setProgressLinkModal] = useState<{ taskId: number; bookId: number; bookTitle: string } | null>(null);

  const [isPlanSettingsOpen, setIsPlanSettingsOpen] = useState(false);
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const [periodDateInput, setPeriodDateInput] = useState(() => selectedDate);

  const weekDays = useMemo(() => getWeekDays(weekStartDate), [weekStartDate]);
  const selectedWeekdayIndex = weekDays.findIndex((d) => d.key === selectedDate);
  const planStartMinutes = planStartHour * 60;
  const planEndMinutes = planEndHour * 60;
  const planSlots = useMemo(() => {
    const span = Math.max(PLAN_SLOT_MINUTES, planEndMinutes - planStartMinutes);
    const rows = Math.max(1, Math.ceil(span / PLAN_SLOT_MINUTES));
    return Array.from({ length: rows }, (_, i) => planStartMinutes + i * PLAN_SLOT_MINUTES);
  }, [planStartMinutes, planEndMinutes]);
  const currentWeekLabel = `${weekDays[0]?.month}/${weekDays[0]?.date} - ${weekDays[6]?.month}/${weekDays[6]?.date}`;
  const rowHeight = PLAN_ROW_HEIGHT;

  // URLパラメータが変わったときに日付と週を同期
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) {
        setSelectedDate(dateParam);
        setWeekStartDate(getWeekStartMonday(d));
      }
    }
  }, [searchParams]);

  useEffect(() => { if (weekDays.some((d) => d.key === selectedDate)) return; if (weekDays[0]) setSelectedDate(weekDays[0].key); }, [weekDays, selectedDate]);
  useEffect(() => { if (!justAddedTaskId) return; const t = setTimeout(() => setJustAddedTaskId(null), 420); return () => clearTimeout(t); }, [justAddedTaskId]);

  const shiftWeek = (offset: number) => {
    const idx = selectedWeekdayIndex >= 0 ? selectedWeekdayIndex : 0;
    const next = addDays(weekStartDate, offset * 7);
    const nextDays = getWeekDays(next);
    setWeekStartDate(next);
    setSelectedDate(nextDays[idx]?.key || nextDays[0]?.key);
  };

  const openAddModal = (startMin: number) => {
    setEditingSlot({ date: selectedDate, startMinutes: startMin });
    setAddTaskDuration(60);
    setAddMode('book');
    setFreeTaskTitle('');
    setBookSearchQuery('');
    setIsAddModalOpen(true);
  };

  const handleAddTask = async (book: any, duration = 60) => {
    if (!editingSlot) return;
    const newId = await addTask({ date: editingSlot.date, startMinutes: editingSlot.startMinutes, duration, title: book.title, color: book.taskColor || book.task || '', type: 'study', bookId: book.id, isCompleted: false });
    setJustAddedTaskId(newId);
    setIsAddModalOpen(false);
    setEditingSlot(null);
  };

  const handleAddFreeTask = async () => {
    if (!editingSlot || !freeTaskTitle.trim()) return;
    const newId = await addTask({ date: editingSlot.date, startMinutes: editingSlot.startMinutes, duration: addTaskDuration, title: freeTaskTitle.trim(), color: freeTaskColor, type: 'event', isCompleted: false });
    setJustAddedTaskId(newId);
    setIsAddModalOpen(false);
    setEditingSlot(null);
    setFreeTaskTitle('');
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditStartMinutes(getTaskStartMinutes(task));
    setEditDuration(Number(task.duration || 60));
    setEditIsCompleted(Boolean(task.isCompleted));
    setIsEditModalOpen(true);
  };

  const saveTaskEdits = () => {
    if (!editingTask) return;
    useTaskStore.getState().updateTask(editingTask.id, { title: editTitle, startMinutes: editStartMinutes, duration: editDuration, isCompleted: editIsCompleted });
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  // タスク完了トグル + 教材連動チェック
  const handleToggleComplete = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const willBeCompleted = !task.isCompleted;
    toggleTaskCompletion(taskId);
    // 学習タスクが完了になる場合、紐付き教材があれば連動確認
    if (willBeCompleted && task.type === 'study' && task.bookId) {
      const book = books.find(b => b.id === task.bookId);
      if (book && book.totalPages && book.status !== 'completed') {
        setProgressLinkModal({ taskId, bookId: task.bookId, bookTitle: book.title });
      }
    }
  };

  const daysTasks = useMemo(() => tasks.filter((t) => t.date === selectedDate).sort((a, b) => getTaskStartMinutes(a) - getTaskStartMinutes(b)), [tasks, selectedDate]);
  const layoutMap = useMemo(() => calculateTaskLayout(daysTasks), [daysTasks]);
  const firstMinute = planSlots[0] ?? planStartMinutes;
  const outOfRangeCount = daysTasks.filter((t) => { const s = getTaskStartMinutes(t); const e = s + Number(t.duration || 0); return e <= planStartMinutes || s >= planEndMinutes; }).length;
  const activeBooks = books.filter((b) => b.status === 'active');
  const filteredActiveBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return activeBooks;
    const q = bookSearchQuery.toLowerCase();
    return activeBooks.filter((b) => b.title.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
  }, [activeBooks, bookSearchQuery]);

  // フリータスクカラーオプション
  const freeTaskColors = [
    { label: 'グレー', value: 'bg-slate-50 text-slate-700 border-slate-200' },
    { label: 'グリーン', value: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'レッド', value: 'bg-rose-50 text-rose-700 border-rose-200' },
    { label: 'パープル', value: 'bg-violet-50 text-violet-700 border-violet-100' },
    { label: 'イエロー', value: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  ];

  // --- Weekly Target Summary ---
  const weeklyTargetData = useMemo(() => {
    if (!activeGoal) return null;

    const weeklyTargetHours = (activeGoal.weekdayHoursTarget * 5) + (activeGoal.weekendHoursTarget * 2);
    const weekDateKeys = new Set(weekDays.map(d => d.key));
    const scheduledMinutes = tasks
      .filter(t => t.type === 'study' && weekDateKeys.has(t.date))
      .reduce((sum, t) => sum + (Number(t.duration) || 0), 0);

    const scheduledHours = Math.round(scheduledMinutes / 6) / 10;
    const progressPercent = weeklyTargetHours > 0 ? Math.min(100, Math.round((scheduledHours / weeklyTargetHours) * 100)) : 0;
    const isShortage = scheduledHours < weeklyTargetHours;
    const shortageHours = Math.max(0, Math.round((weeklyTargetHours - scheduledHours) * 10) / 10);

    return { weeklyTargetHours, scheduledHours, progressPercent, isShortage, shortageHours };
  }, [activeGoal, tasks, weekDays]);

  return (
    <div className="pb-24 animate-fade-in relative">
      <Header title="計画表" showFreePlanLabel={false} onSettingsClick={() => setIsPlanSettingsOpen(true)} />

      {/* Week Navigation */}
      <div className="sticky top-[68px] z-20 bg-slate-50/95 backdrop-blur-sm pt-1">
        <div className="px-4 sm:px-6 lg:px-8 mb-3">
          <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 flex items-center justify-between">
            <button onClick={() => shiftWeek(-1)} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 touch-manipulation active:scale-95"><ChevronRight size={14} className="rotate-180" /> 前の週</button>
            <button onClick={() => setIsPeriodPickerOpen(true)} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 touch-manipulation active:scale-95"><Calendar size={14} className="text-indigo-500" /> {currentWeekLabel}</button>
            <button onClick={() => shiftWeek(1)} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 touch-manipulation active:scale-95">次の週 <ChevronRight size={14} /></button>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 pb-3 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-3 snap-x snap-mandatory">
          {weekDays.map((day) => {
            const isSelected = day.key === selectedDate;
            const count = tasks.filter((t) => t.date === day.key).length;
            return (
              <button key={day.key} onClick={() => setSelectedDate(day.key)}
                className={`snap-start shrink-0 w-[23%] min-w-[84px] sm:w-20 h-20 flex flex-col items-center justify-center rounded-2xl border transition-all touch-manipulation active:scale-95 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105' : 'bg-white text-slate-500 border-slate-100'}`}>
                <span className="text-xs font-medium mb-1">{day.day}</span>
                <span className="text-base sm:text-lg font-bold">{day.month}/{day.date}</span>
                <div className="mt-2 flex gap-0.5">{[...Array(Math.min(count, 3))].map((_, i) => <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-indigo-400'}`} />)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Weekly Target Summary --- */}
      {activeGoal && weeklyTargetData && (
        <div className="px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-800">この週の学習スケジュール状況</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${weeklyTargetData.isShortage ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {weeklyTargetData.isShortage ? '予定不足' : '目標達成ペース'}
              </span>
            </div>

            <div className="flex items-end gap-2 mb-2.5">
              <span className="text-2xl font-extrabold text-slate-800">{weeklyTargetData.scheduledHours}h</span>
              <span className="text-sm text-slate-400 font-medium mb-[3px]">/ 目標 {weeklyTargetData.weeklyTargetHours}h</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${weeklyTargetData.isShortage ? 'bg-indigo-400' : 'bg-emerald-500'}`}
                style={{ width: `${weeklyTargetData.progressPercent}%` }}
              ></div>
            </div>

            {weeklyTargetData.isShortage && (
              <p className="text-[11px] text-slate-500 mt-2.5 flex items-start gap-1">
                <span className="text-indigo-500 mt-0.5">💡</span>
                <span>
                  目標まであと <span className="font-bold text-indigo-600">{weeklyTargetData.shortageHours}h</span> 分の予定をこの週のカレンダーに確保しましょう。
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timeline Grid */}
      <div className="px-4 sm:px-6 lg:px-8">
        {outOfRangeCount > 0 && <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">表示範囲外の予定が {outOfRangeCount} 件あります。</div>}
        <div className="max-h-[calc(100svh-290px)] min-h-[420px] overflow-y-auto overscroll-contain pb-2">
          <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 z-10"><span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">タップして追加</span></div>
            {planSlots.map((sm) => (
              <div key={sm} className="flex border-b border-slate-50 last:border-0" style={{ height: `${rowHeight}px` }}>
                <div className="w-14 px-1 text-[11px] text-slate-400 text-center border-r border-slate-50 flex items-center justify-center">
                  <span className={sm % 60 === 0 ? 'font-semibold text-slate-500' : 'font-medium'}>{toTimeString(sm)}</span>
                </div>
                <div className="flex-1 p-1 relative">
                  <button onClick={() => openAddModal(sm)} className="w-full h-full rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 gap-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-400 transition-colors group touch-manipulation active:scale-[0.99]">
                    <Plus size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">予定を入れる</span>
                  </button>
                </div>
              </div>
            ))}
            <div className="absolute left-14 right-0 top-0 bottom-0 pointer-events-none">
              {daysTasks.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none bg-white/50 backdrop-blur-[1px] z-0">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center mb-3">
                    <span className="text-2xl">📌</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 mb-1">予定がありません</p>
                  <p className="text-xs text-slate-500 mb-3 max-w-[200px]">＋ボタンを押して、学習計画を立てましょう</p>
                </div>
              )}
              {daysTasks.map((task) => (
                <TaskItem key={task.id} task={task} layoutStyle={layoutMap[task.id]} planStartMinutes={planStartMinutes} planEndMinutes={planEndMinutes} firstMinute={firstMinute} rowHeight={rowHeight} slotMinutes={PLAN_SLOT_MINUTES} justAddedTaskId={justAddedTaskId} onTaskClick={openEditTaskModal} onTaskDelete={removeTask} onUpdateTask={updateTaskStartMinutes} onToggleComplete={handleToggleComplete} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal — センターダイアログ型 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl z-10 animate-fade-in max-h-[88svh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">予定を追加</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-3">{editingSlot && toTimeString(editingSlot.startMinutes)} 開始</p>

            {/* 所要時間 */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 block mb-1">所要時間</label>
              <div className="flex items-center gap-3">
                <input type="range" min={15} max={180} step={5} value={addTaskDuration} onChange={(e) => setAddTaskDuration(Number(e.target.value))} className="flex-1" />
                <span className="text-sm font-bold text-slate-700 min-w-[50px] text-center">{addTaskDuration}分</span>
              </div>
            </div>

            {/* モード切替タブ */}
            <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setAddMode('book')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${addMode === 'book' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                <Book size={13} /> 教材から選ぶ
              </button>
              <button
                onClick={() => setAddMode('free')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${addMode === 'free' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                <Plus size={13} /> 自由入力
              </button>
            </div>

            {addMode === 'book' ? (
              <>
                <p className="text-xs text-slate-500 font-bold mb-2">教材を選択</p>
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder="教材名で検索…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 mb-2"
                />
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {filteredActiveBooks.length > 0 ? filteredActiveBooks.map((book) => {
                    const hasPages = book.totalPages && book.totalPages > 0;
                    const progressPct = hasPages ? Math.min(100, Math.round(((book.completedPages || 0) / book.totalPages!) * 100)) : null;
                    return (
                      <button key={book.id} onClick={() => handleAddTask(book, addTaskDuration)} className={`w-full text-left rounded-xl px-3 py-2 border ${book.color} transition-colors hover:shadow-sm flex items-center gap-3`}>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-semibold block truncate">{book.title}</span>
                        </div>
                        {progressPct !== null && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-12 bg-white/50 rounded-full h-1 overflow-hidden">
                              <div className="bg-indigo-400 h-1 rounded-full" style={{ width: `${progressPct}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{progressPct}%</span>
                          </div>
                        )}
                      </button>
                    );
                  }) : (
                    <p className="text-sm text-slate-400 text-center py-4">{bookSearchQuery ? '該当する教材がありません' : '机の上の教材がありません'}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">タイトル</label>
                  <input
                    type="text"
                    value={freeTaskTitle}
                    onChange={(e) => setFreeTaskTitle(e.target.value)}
                    placeholder="例）仮眠・移動・その他"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">カラー</label>
                  <div className="flex gap-2 flex-wrap">
                    {freeTaskColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setFreeTaskColor(c.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${c.value} ${freeTaskColor === c.value ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddFreeTask}
                  disabled={!freeTaskTitle.trim()}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 mt-2"
                >
                  追加する
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Task Modal — センターダイアログ型 */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl z-10 animate-fade-in max-h-[88svh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">予定を編集</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <label className="block"><span className="text-xs text-slate-500 font-bold">タイトル</span>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200" /></label>
              <div><span className="text-xs text-slate-500 font-bold block mb-1">開始時刻</span>
                <input type="range" min={0} max={24 * 60 - 30} step={5} value={editStartMinutes} onChange={(e) => setEditStartMinutes(Number(e.target.value))} className="w-full" />
                <p className="text-center text-sm font-bold text-slate-700">{toTimeString(editStartMinutes)}</p></div>
              <div><span className="text-xs text-slate-500 font-bold block mb-1">所要時間</span>
                <input type="range" min={15} max={180} step={5} value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} className="w-full" />
                <p className="text-center text-sm font-bold text-slate-700">{editDuration}分</p></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editIsCompleted} onChange={(e) => setEditIsCompleted(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm font-semibold text-slate-700">完了</span></label>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => { removeTask(editingTask.id); setIsEditModalOpen(false); setEditingTask(null); }} className="py-3 flex items-center justify-center rounded-xl border border-rose-200 text-rose-600 bg-rose-50 font-bold text-sm gap-1.5"><Trash2 size={14} /> 削除</button>
              <button onClick={saveTaskEdits} className="py-3 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Period Picker — センターダイアログ型 */}
      {isPeriodPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPeriodPickerOpen(false)} />
          <div className="relative bg-white rounded-2xl p-5 shadow-2xl z-10 w-full max-w-xs">
            <h3 className="text-lg font-bold text-slate-800 mb-4">期間を指定</h3>
            <input type="date" value={periodDateInput} onChange={(e) => setPeriodDateInput(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setIsPeriodPickerOpen(false)} className="flex items-center justify-center flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm">キャンセル</button>
              <button onClick={() => { const d = new Date(periodDateInput); if (!isNaN(d.getTime())) { setWeekStartDate(getWeekStartMonday(d)); setSelectedDate(periodDateInput); } setIsPeriodPickerOpen(false); }} className="flex items-center justify-center flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">移動</button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Settings — センターダイアログ型 */}
      {isPlanSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPlanSettingsOpen(false)} />
          <div className="relative bg-white rounded-2xl p-5 shadow-2xl z-10 w-full max-w-xs">
            <h3 className="text-lg font-bold text-slate-800 mb-4">計画表の設定</h3>
            <div className="space-y-4">
              <div><label className="text-xs text-slate-500 font-bold block mb-1">開始時刻</label>
                <select value={planStartHour} onChange={(e) => setPlanStartHour(Math.min(Number(e.target.value), planEndHour - 1))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{toTimeString(i * 60)}</option>)}
                </select></div>
              <div><label className="text-xs text-slate-500 font-bold block mb-1">終了時刻</label>
                <select value={planEndHour} onChange={(e) => setPlanEndHour(Math.max(Number(e.target.value), planStartHour + 1))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {Array.from({ length: 25 }, (_, i) => <option key={i} value={i}>{toTimeString(i * 60)}</option>)}
                </select></div>
            </div>
            <button onClick={() => setIsPlanSettingsOpen(false)} className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">閉じる</button>
          </div>
        </div>
      )}

      {/* 教材進捗連動モーダル — センターダイアログ型 */}
      {progressLinkModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setProgressLinkModal(null)} />
          <div className="relative bg-white rounded-2xl p-5 shadow-2xl z-10 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-800 mb-1">教材の進捗を更新しますか？</h3>
            <p className="text-sm text-slate-500 mb-5">
              <span className="font-semibold text-slate-700">{progressLinkModal.bookTitle}</span> の完了ページ数を更新
            </p>
            {(() => {
              const book = books.find(b => b.id === progressLinkModal.bookId);
              const task = tasks.find(t => t.id === progressLinkModal.taskId);
              const current = book?.completedPages || 0;
              const [inputVal, setInputVal] = React.useState(current + 1);
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 justify-center">
                    <button onClick={() => setInputVal(v => Math.max(0, v - 1))} className="h-9 w-9 rounded-full border border-slate-200 bg-slate-50 font-bold text-lg">−</button>
                    <div className="text-center">
                      <input
                        type="number"
                        value={inputVal}
                        min={0}
                        max={book?.totalPages}
                        onChange={(e) => setInputVal(Number(e.target.value))}
                        className="w-20 text-center rounded-xl border border-slate-200 px-2 py-2 text-lg font-bold text-indigo-600 outline-none"
                      />
                      {book?.totalPages && <p className="text-xs text-slate-400 mt-1">/ {book.totalPages} ページ</p>}
                    </div>
                    <button onClick={() => setInputVal(v => Math.min((book?.totalPages || 9999), v + 1))} className="h-9 w-9 rounded-full border border-indigo-200 bg-indigo-50 font-bold text-lg text-indigo-600">＋</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setProgressLinkModal(null)} className="py-2.5 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 font-bold text-sm">スキップ</button>
                    <button
                      onClick={() => { updateBookProgress(progressLinkModal.bookId, inputVal); setProgressLinkModal(null); }}
                      className="py-2.5 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm"
                    >
                      更新する
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
