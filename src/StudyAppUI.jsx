import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, Calendar, BookOpen, Footprints, Settings, Check, Plus, MoreHorizontal, ChevronRight, Book, Play, Pause, X, Zap, Crown, BarChart2, Trash2, Clock, RefreshCw } from 'lucide-react';

const DEFAULT_PLAN_START_HOUR = 7;
const DEFAULT_PLAN_END_HOUR = 23;
const PLAN_SLOT_MINUTES = 30;
const PLAN_ROW_HEIGHT = 56;
const DEFAULT_FOCUS_MINUTES = 25;
const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];
const BOOK_COLOR_PALETTE = [
  {
    key: 'amber',
    label: 'Amber',
    card: 'bg-amber-100 text-amber-800',
    task: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    key: 'blue',
    label: 'Blue',
    card: 'bg-blue-100 text-blue-800',
    task: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    key: 'rose',
    label: 'Rose',
    card: 'bg-rose-100 text-rose-800',
    task: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  {
    key: 'emerald',
    label: 'Emerald',
    card: 'bg-emerald-100 text-emerald-800',
    task: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    key: 'violet',
    label: 'Violet',
    card: 'bg-violet-100 text-violet-800',
    task: 'bg-violet-50 text-violet-700 border-violet-100',
  },
];
const BOOK_CATEGORIES = ['学科', '実技', '論述', '法令', '過去問', 'その他'];
const DEFAULT_BOOKS = [
  {
    id: 1,
    title: '国家資格キャリアコンサルタント 学科試験テキスト',
    colorKey: 'amber',
    color: 'bg-amber-100 text-amber-800',
    taskColor: 'bg-amber-50 text-amber-700 border-amber-100',
    status: 'active',
    category: '学科',
    lap: 2,
    lastUsed: '2日前',
  },
  {
    id: 2,
    title: '論述試験 過去問題集 2024',
    colorKey: 'blue',
    color: 'bg-blue-100 text-blue-800',
    taskColor: 'bg-blue-50 text-blue-700 border-blue-100',
    status: 'active',
    category: '論述',
    lap: 1,
    lastUsed: '今日',
  },
  {
    id: 3,
    title: '労働関係法規 サブノート',
    colorKey: 'rose',
    color: 'bg-rose-100 text-rose-800',
    taskColor: 'bg-rose-50 text-rose-700 border-rose-100',
    status: 'active',
    category: '法令',
    lap: 3,
    lastUsed: '3日前',
  },
  {
    id: 4,
    title: 'カウンセリング理論まとめ',
    colorKey: 'violet',
    color: 'bg-violet-100 text-violet-800',
    taskColor: 'bg-violet-50 text-violet-700 border-violet-100',
    status: 'completed',
    category: '実技',
    lap: 5,
    lastUsed: '12日前',
  },
];

function getPaletteByKey(colorKey) {
  return BOOK_COLOR_PALETTE.find((entry) => entry.key === colorKey) ?? BOOK_COLOR_PALETTE[0];
}

function getTaskStartMinutes(task) {
  if (typeof task?.startMinutes === 'number') return task.startMinutes;
  if (typeof task?.startHour === 'number') return task.startHour * 60;
  return DEFAULT_PLAN_START_HOUR * 60;
}

function toTimeString(totalMinutes) {
  const safe = ((Number(totalMinutes) || 0) % (24 * 60) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(safe / 60)).padStart(2, '0');
  const mm = String(safe % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function addDays(baseDate, offsetDays) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function getWeekStartMonday(baseDate) {
  const date = new Date(baseDate);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function toDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getWeekDays(weekStartDate) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStartDate, index);
    return {
      key: toDateKey(date),
      day: WEEKDAY_LABELS[index],
      date: String(date.getDate()),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  });
}

function formatHourLabel(hour) {
  if (hour === 24) return '24:00';
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('plan'); // Default to plan for this demo
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const [focusTaskTitle, setFocusTaskTitle] = useState('学習');
  
  // --- State for Plan Management ---
  const [weekStartDate, setWeekStartDate] = useState(() => getWeekStartMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(() =>
    toDateKey(addDays(getWeekStartMonday(new Date()), 1)),
  );
  const [planStartHour, setPlanStartHour] = useState(DEFAULT_PLAN_START_HOUR);
  const [planEndHour, setPlanEndHour] = useState(DEFAULT_PLAN_END_HOUR);
  const [tasks, setTasks] = useState(() => [
    {
      id: 101,
      date: toDateKey(addDays(getWeekStartMonday(new Date()), 1)),
      startMinutes: 20 * 60,
      duration: 60,
      title: 'キャリコン実技（論述）',
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      type: 'study',
      bookId: 2,
      isCompleted: false,
    },
  ]);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null); // { date, startMinutes } or existing task object
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartMinutes, setEditStartMinutes] = useState(20 * 60);
  const [editDuration, setEditDuration] = useState(60);
  const [editIsCompleted, setEditIsCompleted] = useState(false);
  const [isPlanSettingsOpen, setIsPlanSettingsOpen] = useState(false);
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const [periodDateInput, setPeriodDateInput] = useState(() => selectedDate);
  const [justAddedTaskId, setJustAddedTaskId] = useState(null);
  const [materialsTab, setMaterialsTab] = useState('desk');
  const [materialsView, setMaterialsView] = useState('card');
  const [materialsFilterCategory, setMaterialsFilterCategory] = useState('all');
  const [materialsSortMode, setMaterialsSortMode] = useState('default');
  const [books, setBooks] = useState(DEFAULT_BOOKS);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('その他');
  const [newBookColorKey, setNewBookColorKey] = useState(BOOK_COLOR_PALETTE[0].key);
  const [newBookLap, setNewBookLap] = useState(1);
  const [isBookDetailModalOpen, setIsBookDetailModalOpen] = useState(false);
  const [bookDraft, setBookDraft] = useState(null);
  const [addTaskDuration, setAddTaskDuration] = useState(60);

  useEffect(() => {
    if (!isFocusMode || !isFocusRunning) return;
    const timerId = window.setInterval(() => {
      setFocusSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsFocusRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [isFocusMode, isFocusRunning]);

  useEffect(() => {
    if (!isFocusMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFocusMode]);

  const weekDays = useMemo(() => getWeekDays(weekStartDate), [weekStartDate]);
  const selectedWeekdayIndex = weekDays.findIndex((day) => day.key === selectedDate);
  const planStartMinutes = planStartHour * 60;
  const planEndMinutes = planEndHour * 60;
  const planSlots = useMemo(() => {
    const spanMinutes = Math.max(PLAN_SLOT_MINUTES, planEndMinutes - planStartMinutes);
    const rows = Math.max(1, Math.ceil(spanMinutes / PLAN_SLOT_MINUTES));
    return Array.from({ length: rows }, (_, index) => planStartMinutes + index * PLAN_SLOT_MINUTES);
  }, [planStartMinutes, planEndMinutes]);
  const currentWeekLabel = `${weekDays[0]?.month}/${weekDays[0]?.date} - ${weekDays[6]?.month}/${weekDays[6]?.date}`;

  useEffect(() => {
    if (weekDays.some((day) => day.key === selectedDate)) return;
    if (weekDays[0]) setSelectedDate(weekDays[0].key);
  }, [weekDays, selectedDate]);

  useEffect(() => {
    setTasks((prev) => {
      let changed = false;
      const next = prev.map((task) => {
        if (!task.bookId || task.isCompleted) return task;
        const linkedBook = books.find((book) => book.id === task.bookId);
        if (!linkedBook) return task;
        if (task.title === linkedBook.title && task.color === linkedBook.taskColor) return task;
        changed = true;
        return {
          ...task,
          title: linkedBook.title,
          color: linkedBook.taskColor,
        };
      });
      return changed ? next : prev;
    });
  }, [books]);

  useEffect(() => {
    if (!justAddedTaskId) return;
    const timerId = window.setTimeout(() => setJustAddedTaskId(null), 420);
    return () => window.clearTimeout(timerId);
  }, [justAddedTaskId]);

  const shiftWeek = (offsetWeeks) => {
    const currentIndex = selectedWeekdayIndex >= 0 ? selectedWeekdayIndex : 0;
    const nextWeekStart = addDays(weekStartDate, offsetWeeks * 7);
    const nextWeekDays = getWeekDays(nextWeekStart);
    setWeekStartDate(nextWeekStart);
    setSelectedDate(nextWeekDays[currentIndex]?.key ?? nextWeekDays[0].key);
  };

  const openPeriodPicker = () => {
    setPeriodDateInput(selectedDate || toDateKey(weekStartDate));
    setIsPeriodPickerOpen(true);
  };

  const applyPeriodRangeFromDate = (nextDate) => {
    if (!nextDate) return;
    const selected = new Date(nextDate);
    if (Number.isNaN(selected.getTime())) return;

    const nextWeekStart = getWeekStartMonday(selected);

    setWeekStartDate(nextWeekStart);
    setSelectedDate(nextDate);
  };

  const handlePlanStartHourChange = (value) => {
    const nextStart = Math.max(0, Math.min(23, Number(value) || 0));
    setPlanStartHour(nextStart);
    if (nextStart >= planEndHour) {
      setPlanEndHour(Math.min(24, nextStart + 1));
    }
  };

  const handlePlanEndHourChange = (value) => {
    const nextEnd = Math.max(1, Math.min(24, Number(value) || 1));
    setPlanEndHour(nextEnd);
    if (nextEnd <= planStartHour) {
      setPlanStartHour(Math.max(0, nextEnd - 1));
    }
  };

  // --- Helper Functions ---
  const addTask = (book, duration = 60) => {
    if (!editingSlot) return;

    const taskColor =
      book.taskColor ??
      (book.color?.replace('text-', 'border-').replace('800', '200').replace('bg-', 'bg-opacity-20 bg-') ||
        'bg-slate-50 text-slate-700 border-slate-200');

    const newTask = {
      id: Date.now(),
      date: editingSlot.date,
      startMinutes: editingSlot.startMinutes,
      duration: duration,
      title: book.title,
      color: taskColor,
      type: 'study',
      bookId: book.id ?? null,
      isCompleted: false,
    };

    setTasks((prev) => [...prev, newTask]);
    setJustAddedTaskId(newTask.id);
    if (book.id) {
      setBooks((prev) =>
        prev.map((entry) =>
          entry.id === book.id
            ? {
                ...entry,
                lastUsed: '今日',
              }
            : entry,
        ),
      );
    }
    setIsAddModalOpen(false);
    setEditingSlot(null);
  };

  const removeTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const createBook = () => {
    const trimmed = newBookTitle.trim();
    if (!trimmed) return;
    const palette = getPaletteByKey(newBookColorKey);
    const lap = Math.max(1, Math.min(99, Number(newBookLap) || 1));

    setBooks((prev) => {
      return [
        ...prev,
        {
          id: Date.now(),
          title: trimmed,
          colorKey: palette.key,
          color: palette.card,
          taskColor: palette.task,
          status: 'active',
          category: newBookCategory || 'その他',
          lap,
          lastUsed: '未使用',
        },
      ];
    });
    setNewBookTitle('');
    setNewBookCategory('その他');
    setNewBookColorKey(BOOK_COLOR_PALETTE[0].key);
    setNewBookLap(1);
    setIsAddBookModalOpen(false);
    setMaterialsTab('desk');
  };

  const openAddBookModal = () => {
    const nextPalette = BOOK_COLOR_PALETTE[books.length % BOOK_COLOR_PALETTE.length];
    setNewBookTitle('');
    setNewBookCategory('その他');
    setNewBookLap(1);
    setNewBookColorKey(nextPalette.key);
    setIsAddBookModalOpen(true);
  };

  const openBookDetailModal = (book) => {
    setBookDraft({
      ...book,
      colorKey: book.colorKey ?? BOOK_COLOR_PALETTE.find((entry) => entry.card === book.color)?.key ?? 'amber',
      category: book.category ?? 'その他',
      lap: Math.max(1, Number(book.lap) || 1),
    });
    setIsBookDetailModalOpen(true);
  };

  const closeBookDetailModal = (shouldSave = true) => {
    if (shouldSave && bookDraft) {
      const palette = getPaletteByKey(bookDraft.colorKey ?? 'amber');
      const nextBook = {
        ...bookDraft,
        title: (bookDraft.title || '').trim() || '無題の教材',
        lap: Math.max(1, Number(bookDraft.lap) || 1),
        category: bookDraft.category || 'その他',
        colorKey: palette.key,
        color: palette.card,
        taskColor: palette.task,
      };
      setBooks((prev) => prev.map((book) => (book.id === nextBook.id ? nextBook : book)));
    }
    setIsBookDetailModalOpen(false);
    setBookDraft(null);
  };

  const updateBookDraft = (patch) => {
    setBookDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateBookDraftColor = (colorKey) => {
    const palette = getPaletteByKey(colorKey);
    updateBookDraft({
      colorKey: palette.key,
      color: palette.card,
      taskColor: palette.task,
    });
  };

  const updateBookDraftLap = (delta) => {
    setBookDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lap: Math.max(1, Math.min(99, (Number(prev.lap) || 1) + delta)),
      };
    });
  };

  const deleteBookFromDetail = () => {
    if (!bookDraft) return;
    const deletingId = bookDraft.id;
    setBooks((prev) => prev.filter((book) => book.id !== deletingId));
    setIsBookDetailModalOpen(false);
    setBookDraft(null);
  };

  const openAddModal = (startMinutes) => {
    setEditingSlot({ date: selectedDate, startMinutes });
    setAddTaskDuration(60);
    setIsAddModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditStartMinutes(getTaskStartMinutes(task));
    setEditDuration(task.duration);
    setEditIsCompleted(Boolean(task.isCompleted));
    setIsEditModalOpen(true);
  };

  const saveTaskEdits = () => {
    if (!editingTask) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              title: editTitle.trim() || task.title,
              startMinutes: Number(editStartMinutes),
              duration: Number(editDuration),
              isCompleted: editIsCompleted,
            }
          : task,
      ),
    );
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const deleteEditingTask = () => {
    if (!editingTask) return;
    removeTask(editingTask.id);
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const startFocusMode = () => {
    setFocusTaskTitle(currentFocusTask?.title ?? '学習');
    const nextMinutes = Math.max(1, Number(currentFocusTask?.duration ?? DEFAULT_FOCUS_MINUTES));
    setFocusDurationMinutes(nextMinutes);
    setFocusSecondsLeft(nextMinutes * 60);
    setIsFocusRunning(false);
    setIsFocusMode(true);
  };

  const closeFocusMode = () => {
    setIsFocusRunning(false);
    setFocusSecondsLeft(focusDurationMinutes * 60);
    setIsFocusMode(false);
    setActiveTab('home');
  };

  const toggleFocusTimer = () => {
    if (focusSecondsLeft === 0) {
      setFocusSecondsLeft(focusDurationMinutes * 60);
      setIsFocusRunning(true);
      return;
    }
    setIsFocusRunning((prev) => !prev);
  };

  const resetFocusTimer = () => {
    setIsFocusRunning(false);
    setFocusSecondsLeft(focusDurationMinutes * 60);
  };

  const adjustFocusDurationBy = (deltaMinutes) => {
    setFocusDurationMinutes((prevDuration) => {
      const nextDuration = Math.max(1, Math.min(600, prevDuration + deltaMinutes));
      setFocusSecondsLeft((prevLeft) => {
        if (!isFocusRunning) return nextDuration * 60;
        const nextLeft = prevLeft + deltaMinutes * 60;
        return Math.max(0, Math.min(nextDuration * 60, nextLeft));
      });
      return nextDuration;
    });
  };

  const updateFocusDuration = (value) => {
    const next = Math.max(1, Math.min(600, Number(value) || 1));
    setFocusDurationMinutes(next);
    if (!isFocusRunning) {
      setFocusSecondsLeft(next * 60);
    }
  };

  const currentFocusTask = tasks
    .filter((t) => t.date === selectedDate)
    .slice()
    .sort((a, b) => getTaskStartMinutes(a) - getTaskStartMinutes(b))[0] ?? null;
  const editStartOptions = useMemo(() => {
    if (planSlots.includes(editStartMinutes)) return planSlots;
    return [...planSlots, editStartMinutes].sort((a, b) => a - b);
  }, [planSlots, editStartMinutes]);

  // --- Components ---

  const Header = ({ title, showSettings = true }) => (
    <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      {showSettings && (
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">フリープラン</span>
          <button
            onClick={() => setIsPlanSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
            aria-label="設定を開く"
          >
            <Settings size={20} />
          </button>
        </div>
      )}
    </div>
  );

  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-300 ${
        activeTab === id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-500'
      }`}
    >
      <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} className="mb-1" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  // --- Focus Overlay (Pomodoro) ---
  const renderFocusOverlay = () => {
    if (!isFocusMode) return null;

    const focusTotalSeconds = Math.max(1, focusDurationMinutes * 60);
    const progressRatio = Math.min(1, focusSecondsLeft / focusTotalSeconds);
    const progressDeg = Math.max(0, Math.min(360, progressRatio * 360));

    return (
      <div className="fixed inset-0 z-[80] bg-indigo-700 text-white">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-200">Focus Mode</p>
              <h2 className="text-2xl font-bold">集中モード</h2>
            </div>
            <button
              onClick={closeFocusMode}
              className="h-11 w-11 rounded-full border border-white/30 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="集中モードを終了"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md text-center">
              <div
                className={`mx-auto mb-8 h-72 w-72 rounded-full p-[10px] ${isFocusRunning ? 'focus-ring-running' : ''}`}
                style={{
                  background: `conic-gradient(rgba(255,255,255,0.95) ${progressDeg}deg, rgba(255,255,255,0.22) ${progressDeg}deg)`,
                }}
              >
                <div className="h-full w-full rounded-full border border-white/20 bg-indigo-800/55 backdrop-blur-sm flex flex-col items-center justify-center">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-200">Pomodoro</p>
                  <p className="text-6xl font-bold tracking-tight mt-1">{formatCountdown(focusSecondsLeft)}</p>
                  <p className="mt-3 text-sm text-indigo-100">
                    {focusSecondsLeft === 0
                      ? '1セット完了です'
                      : isFocusRunning
                      ? '集中タイム進行中'
                      : '準備ができたら開始'}
                  </p>
                  <p className="mt-1 text-xs text-indigo-200">{focusTaskTitle}</p>
                </div>
              </div>

              <div className="mx-auto mb-6 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">タイマー設定（分）</p>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    step={1}
                    value={focusDurationMinutes}
                    disabled={isFocusRunning}
                    onChange={(e) => updateFocusDuration(e.target.value)}
                    className="w-24 rounded-lg border border-white/30 bg-white/20 px-2 py-1 text-right text-white outline-none disabled:opacity-60"
                  />
                </div>
                <input
                  type="range"
                  min={5}
                  max={180}
                  step={1}
                  value={Math.max(5, Math.min(180, focusDurationMinutes))}
                  disabled={isFocusRunning}
                  onChange={(e) => updateFocusDuration(e.target.value)}
                  className="w-full h-3 rounded-full accent-indigo-200 cursor-pointer disabled:opacity-60"
                />
                <div className="mt-2 flex justify-between text-[11px] text-indigo-100/90">
                  <span>5分</span>
                  <span>60分</span>
                  <span>120分</span>
                  <span>180分</span>
                </div>
              </div>

              <button
                onClick={toggleFocusTimer}
                className="mx-auto min-w-[220px] py-4 px-6 rounded-2xl bg-white text-indigo-700 font-bold text-lg shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                {isFocusRunning ? <Pause size={22} /> : <Play size={22} />}
                <span>{isFocusRunning ? '一時停止' : focusSecondsLeft === 0 ? 'もう1セット始める' : '再生'}</span>
              </button>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => adjustFocusDurationBy(-5)}
                  className="py-2.5 rounded-xl border border-white/30 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  -5分
                </button>
                <button
                  onClick={resetFocusTimer}
                  className="py-2.5 rounded-xl border border-white/30 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  リセット
                </button>
                <button
                  onClick={() => adjustFocusDurationBy(5)}
                  className="py-2.5 rounded-xl border border-white/30 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  +5分
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Add Task Bottom Sheet ---
  const renderAddTaskSheet = () => {
    if (!isAddModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsAddModalOpen(false)}
        ></div>
        
        {/* Sheet Content */}
        <div
          className="bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative z-10 max-h-[85vh] overflow-y-auto sm:mx-auto sm:mb-6 sm:w-full sm:max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">予定を入れる</h3>
              <p className="text-slate-400 text-xs">
                開始: {editingSlot ? toTimeString(editingSlot.startMinutes) : '--:--'} 〜
              </p>
            </div>
            <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* 1. Duration Settings */}
          <div className="mb-8 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-end justify-between mb-4">
              <span className="text-sm font-bold text-slate-500">時間設定</span>
              <span className="text-3xl font-bold text-indigo-600 font-mono tracking-tight">
                {addTaskDuration}<span className="text-sm text-slate-400 ml-1 font-sans">分</span>
              </span>
            </div>

            {/* Slider */}
            <div className="relative mb-6 px-1 py-1">
              <input 
                type="range" 
                min="5" 
                max="180" 
                step="5" 
                value={addTaskDuration} 
                onChange={(e) => setAddTaskDuration(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                <span>5分</span>
                <span>60分</span>
                <span>120分</span>
                <span>180分</span>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {[30, 60, 90, 120].map((m) => (
                <button 
                  key={m}
                  onClick={() => setAddTaskDuration(m)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    addTaskDuration === m 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {m}分
                </button>
              ))}
            </div>
          </div>

          {/* 2. Book Selection */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">本棚から選ぶ</h4>
            <div className="grid grid-cols-1 gap-3">
              {books.filter((book) => book.status === 'active').map((book) => (
                <button
                  key={book.id}
                  onClick={() => addTask(book, addTaskDuration)}
                  className={`flex items-center p-4 rounded-xl text-left transition-transform active:scale-95 ${book.color} bg-opacity-20 border border-transparent hover:border-current hover:shadow-sm`}
                >
                  <div className={`w-10 h-10 rounded-lg ${book.color} flex items-center justify-center mr-4 shadow-sm shrink-0`}>
                    <Book size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold block truncate">{book.title}</span>
                    <span className="text-xs opacity-70">{addTaskDuration}分で追加</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center ml-2 shrink-0">
                    <Plus size={18} className="opacity-70" />
                  </div>
                </button>
              ))}
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 pl-1">その他</h4>
            <div className="flex gap-3">
               <button onClick={() => addTask({title: "休憩", color: "bg-slate-100 text-slate-600", type: "break"}, addTaskDuration)} className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 active:scale-95 transition-transform">
                 ☕ 休憩 {addTaskDuration}分
               </button>
               <button onClick={() => addTask({title: "予備/復習", color: "bg-indigo-50 text-indigo-600", type: "review"}, addTaskDuration)} className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 active:scale-95 transition-transform">
                 📝 復習 {addTaskDuration}分
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Edit Task Bottom Sheet ---
  const renderEditTaskSheet = () => {
    if (!isEditModalOpen || !editingTask) return null;

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsEditModalOpen(false)}
        ></div>

        <div
          className="bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative z-10 max-h-[85vh] overflow-y-auto sm:mx-auto sm:mb-6 sm:w-full sm:max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">予定を編集</h3>
              <p className="text-slate-400 text-xs">日時を変更できます</p>
            </div>
            <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">タイトル</span>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="予定名"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-500 font-bold">開始時刻</span>
                  <select
                    value={editStartMinutes}
                    onChange={(e) => setEditStartMinutes(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {editStartOptions.map((slotMinutes) => (
                      <option key={slotMinutes} value={slotMinutes}>
                        {toTimeString(slotMinutes)}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="text-xs text-slate-500 font-bold">時間</span>
                  <div className="mt-1 text-xl font-bold text-indigo-600">{editDuration}分</div>
                </div>
              </div>

              <div className="relative px-1 pt-1">
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                  <span>5分</span>
                  <span>60分</span>
                  <span>120分</span>
                  <span>180分</span>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {[30, 60, 90, 120].map((m) => (
                  <button
                    key={m}
                    onClick={() => setEditDuration(m)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      editDuration === m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {m}分
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="text-xs text-slate-500 font-bold mb-2">完了状態</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditIsCompleted(false)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border ${
                      !editIsCompleted
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    未完了
                  </button>
                  <button
                    onClick={() => setEditIsCompleted(true)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border inline-flex items-center justify-center gap-1 ${
                      editIsCompleted
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Check size={12} />
                    完了
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={deleteEditingTask}
                className="sm:col-span-1 py-3 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 font-bold text-sm active:scale-95 transition-transform inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                削除
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="sm:col-span-1 py-3 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 font-bold text-sm active:scale-95 transition-transform"
              >
                キャンセル
              </button>
              <button
                onClick={saveTaskEdits}
                className="sm:col-span-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm active:scale-95 transition-transform"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPeriodPickerModal = () => {
    if (!isPeriodPickerOpen) return null;

    return (
      <div className="fixed inset-0 z-[66] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsPeriodPickerOpen(false)}
        ></div>

        <div
          className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">期間を選択</h3>
              <p className="text-xs text-slate-400">タップしてカレンダーから指定できます</p>
            </div>
            <button onClick={() => setIsPeriodPickerOpen(false)} className="p-2 bg-slate-100 rounded-full touch-manipulation">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-slate-500 font-bold">日付</span>
              <input
                type="date"
                value={periodDateInput}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setPeriodDateInput(nextDate);
                  applyPeriodRangeFromDate(nextDate);
                  setIsPeriodPickerOpen(false);
                }}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none appearance-none box-border focus:ring-2 focus:ring-indigo-200"
              />
            </label>
          </div>

          <div className="mt-5">
            <button
              onClick={() => setIsPeriodPickerOpen(false)}
              className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 font-bold text-sm touch-manipulation active:scale-95 transition-transform"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPlanSettingsModal = () => {
    if (!isPlanSettingsOpen) return null;
    const selectedDayTasks = tasks.filter((task) => task.date === selectedDate);
    const outOfRangeCount = selectedDayTasks.filter((task) => {
      const start = getTaskStartMinutes(task);
      const end = start + Number(task.duration || 0);
      return end <= planStartMinutes || start >= planEndMinutes;
    }).length;

    return (
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsPlanSettingsOpen(false)}
        ></div>

        <div
          className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">計画表の表示設定</h3>
              <p className="text-xs text-slate-400">生活リズムに合わせて時間帯を調整できます</p>
            </div>
            <button onClick={() => setIsPlanSettingsOpen(false)} className="p-2 bg-slate-100 rounded-full">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">開始時刻</span>
                <select
                  value={planStartHour}
                  onChange={(e) => handlePlanStartHourChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {formatHourLabel(hour)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-slate-500 font-bold">終了時刻</span>
                <select
                  value={planEndHour}
                  onChange={(e) => handlePlanEndHourChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {Array.from({ length: 24 }, (_, offset) => {
                    const hour = offset + 1;
                    return (
                      <option key={hour} value={hour}>
                        {formatHourLabel(hour)}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              表示範囲: {formatHourLabel(planStartHour)} - {formatHourLabel(planEndHour)}
            </div>

            {outOfRangeCount > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                現在の表示範囲外の予定が {outOfRangeCount} 件あります。
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsPlanSettingsOpen(false)}
              className="py-3 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 font-bold text-sm"
            >
              閉じる
            </button>
            <button
              onClick={() => setIsPlanSettingsOpen(false)}
              className="py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Add Book Bottom Sheet ---
  const renderAddBookSheet = () => {
    if (!isAddBookModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsAddBookModalOpen(false)}
        ></div>

        <div
          className="bg-white rounded-3xl p-6 shadow-2xl relative z-10 w-full max-w-xl max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >

          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">本棚に追加</h3>
              <p className="text-xs text-slate-400">カテゴリ・色・周回数も先に設定できます</p>
            </div>
            <button onClick={() => setIsAddBookModalOpen(false)} className="p-2 bg-slate-100 rounded-full">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-slate-500 font-bold">教材名</span>
              <input
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="例）論述試験 過去問題集"
              />
            </label>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs text-slate-500 font-bold mb-2">周回数</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNewBookLap((prev) => Math.max(1, prev - 1))}
                  className="h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-600 text-xl font-bold"
                  aria-label="周回数を減らす"
                >
                  -
                </button>
                <div className="min-w-[96px] rounded-xl bg-white border border-slate-200 px-4 py-2 text-center">
                  <span className="text-2xl font-bold text-indigo-600">{Math.max(1, Number(newBookLap) || 1)}</span>
                  <span className="ml-1 text-sm text-slate-500">周目</span>
                </div>
                <button
                  onClick={() => setNewBookLap((prev) => Math.min(99, prev + 1))}
                  className="h-10 w-10 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 text-xl font-bold"
                  aria-label="周回数を増やす"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-bold mb-2">カテゴリ</p>
              <div className="flex flex-wrap gap-2">
                {BOOK_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setNewBookCategory(category)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                      newBookCategory === category
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-bold mb-2">カラー</p>
              <div className="flex flex-wrap gap-2">
                {BOOK_COLOR_PALETTE.map((palette) => {
                  const isActive = newBookColorKey === palette.key;
                  return (
                    <button
                      key={palette.key}
                      onClick={() => setNewBookColorKey(palette.key)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive ? 'border-slate-700 bg-slate-100 text-slate-800' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full ${palette.card.split(' ')[0]}`}></span>
                      {palette.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
              「{newBookCategory} / {Math.max(1, Number(newBookLap) || 1)}周目」で登録されます。登録後もカードから編集できます。
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setIsAddBookModalOpen(false)}
                className="py-3 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 font-bold text-sm active:scale-95 transition-transform"
              >
                キャンセル
              </button>
              <button
                onClick={createBook}
                className="py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-50"
                disabled={!newBookTitle.trim()}
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBookDetailModal = () => {
    if (!isBookDetailModalOpen || !bookDraft) return null;
    const isCompleted = bookDraft.status === 'completed';

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => closeBookDetailModal(true)}
        ></div>

        <div
          className="relative z-10 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">教材詳細</h3>
              <p className="text-xs text-slate-400">閉じると内容は保存されます</p>
            </div>
            <button onClick={() => closeBookDetailModal(true)} className="p-2 bg-slate-100 rounded-full">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-xs text-slate-500 font-bold">タイトル</span>
              <input
                value={bookDraft.title}
                onChange={(e) => updateBookDraft({ title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="教材名"
              />
            </label>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs text-slate-500 font-bold mb-2">周回数</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateBookDraftLap(-1)}
                  className="h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-600 text-xl font-bold"
                  aria-label="周回数を減らす"
                >
                  -
                </button>
                <div className="min-w-[96px] rounded-xl bg-white border border-slate-200 px-4 py-2 text-center">
                  <span className="text-2xl font-bold text-indigo-600">{Math.max(1, Number(bookDraft.lap) || 1)}</span>
                  <span className="ml-1 text-sm text-slate-500">周目</span>
                </div>
                <button
                  onClick={() => updateBookDraftLap(1)}
                  className="h-10 w-10 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 text-xl font-bold"
                  aria-label="周回数を増やす"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-bold mb-2">カテゴリ</p>
              <div className="flex flex-wrap gap-2">
                {BOOK_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => updateBookDraft({ category })}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                      bookDraft.category === category
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-bold mb-2">カラー</p>
              <div className="flex flex-wrap gap-2">
                {BOOK_COLOR_PALETTE.map((palette) => {
                  const isActive = bookDraft.colorKey === palette.key;
                  return (
                    <button
                      key={palette.key}
                      onClick={() => updateBookDraftColor(palette.key)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive ? 'border-slate-700 bg-slate-100 text-slate-800' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full ${palette.card.split(' ')[0]}`}></span>
                      {palette.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs text-slate-500 font-bold mb-2">ステータス</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateBookDraft({ status: 'active' })}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold border ${
                    !isCompleted
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  机の上
                </button>
                <button
                  onClick={() => updateBookDraft({ status: 'completed' })}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold border ${
                    isCompleted
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  殿堂入り
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={deleteBookFromDetail}
              className="sm:col-span-1 py-3 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 font-bold text-sm inline-flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} />
              削除
            </button>
            <button
              onClick={() => closeBookDetailModal(true)}
              className="sm:col-span-2 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Render Functions ---

  const renderHome = () => (
    <div className="pb-24 animate-fade-in">
      <Header title="ホーム" />
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-slate-500 text-sm mb-1">お疲れ様です</p>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          今週のゆとり: <span className="text-indigo-600">あと 5時間</span>
        </h2>
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-indigo-100 border border-indigo-50 mt-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">実技</span>
          <h3 className="text-xl font-bold text-slate-800 mb-2 mt-2">{currentFocusTask?.title ?? 'キャリコン実技（論述）'}</h3>
          <div className="flex items-center text-slate-500 mb-6">
            <Clock size={16} />{' '}
            <span className="ml-2 font-medium">
              {toTimeString(getTaskStartMinutes(currentFocusTask ?? { startMinutes: 20 * 60 }))} -{' '}
              {toTimeString(
                getTaskStartMinutes(currentFocusTask ?? { startMinutes: 20 * 60 }) +
                  Number(currentFocusTask?.duration ?? 60),
              )}
            </span>
          </div>
          <button onClick={startFocusMode} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2">
            <Play size={18} /> 集中モード
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlan = () => {
    const daysTasks = tasks
      .filter((t) => t.date === selectedDate)
      .sort((a, b) => getTaskStartMinutes(a) - getTaskStartMinutes(b));
    const slots = planSlots;
    const rowHeight = PLAN_ROW_HEIGHT;
    const firstMinute = slots[0] ?? planStartMinutes;
    const totalHeight = slots.length * rowHeight;
    const outOfRangeCount = daysTasks.filter((task) => {
      const start = getTaskStartMinutes(task);
      const end = start + Number(task.duration || 0);
      return end <= planStartMinutes || start >= planEndMinutes;
    }).length;

    return (
      <div className="pb-24 animate-fade-in relative">
        <Header title="計画表" />

        <div className="sticky top-[68px] z-20 bg-slate-50/95 backdrop-blur-sm pt-1">
          <div className="px-4 sm:px-6 lg:px-8 mb-3">
            <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 flex items-center justify-between">
              <button
                onClick={() => shiftWeek(-1)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 touch-manipulation active:scale-95 transition-transform"
              >
                <ChevronRight size={14} className="rotate-180" />
                前の週
              </button>
              <button
                onClick={openPeriodPicker}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 touch-manipulation active:scale-95 transition-transform"
              >
                <Calendar size={14} className="text-indigo-500" />
                {currentWeekLabel}
              </button>
              <button
                onClick={() => shiftWeek(1)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 touch-manipulation active:scale-95 transition-transform"
              >
                次の週
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Date Scroller */}
          <div className="px-4 sm:px-6 lg:px-8 pb-3 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-3 snap-x snap-mandatory">
            {weekDays.map((day) => {
              const isSelected = day.key === selectedDate;
              const dayTaskCount = tasks.filter((task) => task.date === day.key).length;
              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDate(day.key)}
                  className={`snap-start shrink-0 w-[23%] min-w-[84px] sm:w-20 h-20 flex flex-col items-center justify-center rounded-2xl border transition-all touch-manipulation active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105'
                      : 'bg-white text-slate-500 border-slate-100'
                  }`}
                >
                  <span className="text-xs font-medium mb-1">{day.day}</span>
                  <span className="text-base sm:text-lg font-bold">
                    {day.month}/{day.date}
                  </span>
                  <div className="mt-2 flex gap-0.5">
                    {[...Array(Math.min(dayTaskCount, 3))].map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-indigo-400'}`}></div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="px-4 sm:px-6 lg:px-8">
          {outOfRangeCount > 0 ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              表示範囲外の予定が {outOfRangeCount} 件あります。設定で時間帯を広げられます。
            </div>
          ) : null}

          <div className="max-h-[calc(100svh-290px)] min-h-[420px] overflow-y-auto overscroll-contain pb-2">
            <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-100 relative overflow-hidden">
              {/* Grid Header */}
              <div className="absolute top-0 right-0 p-3 z-10">
                 <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                   タップして追加
                 </span>
              </div>

              {slots.map((slotMinutes) => {
                const isHour = slotMinutes % 60 === 0;
                return (
                  <div key={slotMinutes} className="flex border-b border-slate-50 last:border-0" style={{ height: `${rowHeight}px` }}>
                    {/* Time Label */}
                    <div className="w-14 px-1 text-[11px] text-slate-400 text-center border-r border-slate-50 flex items-center justify-center">
                      <span className={isHour ? 'font-semibold text-slate-500' : 'font-medium'}>
                        {toTimeString(slotMinutes)}
                      </span>
                    </div>
                    
                    {/* Slot Area */}
                    <div className="flex-1 p-1 relative">
                      {/* Empty Slot (Clickable Area) */}
                      <button 
                        onClick={() => openAddModal(slotMinutes)}
                        className="w-full h-full rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 gap-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-400 transition-colors group touch-manipulation active:scale-[0.99]"
                      >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">予定を入れる</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Duration-aware Task Blocks */}
              <div className="absolute left-14 right-0 top-0 bottom-0 pointer-events-none">
                {daysTasks.map((task) => {
                  const startMinutes = getTaskStartMinutes(task);
                  const taskEndMinutes = startMinutes + Number(task.duration || 0);
                  const visibleStartMinutes = Math.max(startMinutes, planStartMinutes);
                  const visibleEndMinutes = Math.min(taskEndMinutes, planEndMinutes);
                  if (visibleEndMinutes <= visibleStartMinutes) return null;

                  const top = ((visibleStartMinutes - firstMinute) / PLAN_SLOT_MINUTES) * rowHeight + 4;
                  if (top < 0 || top >= totalHeight) return null;
                  const maxHeight = Math.max(24, totalHeight - top - 4);
                  const rawHeight = ((visibleEndMinutes - visibleStartMinutes) / PLAN_SLOT_MINUTES) * rowHeight - 8;
                  const height = Math.max(28, Math.min(rawHeight, maxHeight));
                  const endMinutes = startMinutes + Number(task.duration || 0);
                  const isCompleted = Boolean(task.isCompleted);

                  return (
                    <div
                      key={task.id}
                      className="absolute left-1 right-1 pointer-events-auto"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div
                        onClick={() => openEditTaskModal(task)}
                        className={`relative group h-full ${task.color} rounded-xl p-3 border shadow-sm transition-transform cursor-pointer hover:scale-[1.01] ${
                          isCompleted ? 'opacity-70 saturate-75' : ''
                        } ${justAddedTaskId === task.id ? 'animate-task-pop' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold opacity-80 truncate pr-2">
                            {task.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTask(task.id);
                            }}
                            className="p-1 hover:bg-black/10 rounded text-current opacity-0 group-hover:opacity-100 transition-opacity"
                            title="削除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] font-medium bg-white/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock size={10} /> {toTimeString(startMinutes)} - {toTimeString(endMinutes)}
                          </span>
                          <span className="text-[10px] font-medium bg-white/60 px-1.5 py-0.5 rounded">
                            {task.duration}分
                          </span>
                          {isCompleted ? (
                            <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                              <Check size={10} />
                              完了
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-[10px] opacity-70">タップして編集</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMaterials = () => {
    const statusBooks = books.filter((book) =>
      materialsTab === 'desk' ? book.status === 'active' : book.status === 'completed',
    );
    const filteredBooks = statusBooks.filter((book) =>
      materialsFilterCategory === 'all' ? true : (book.category || 'その他') === materialsFilterCategory,
    );
    const sortedBooks = filteredBooks.slice().sort((a, b) => {
      if (materialsSortMode !== 'category') return 0;
      const categoryA = a.category || 'その他';
      const categoryB = b.category || 'その他';
      const idxA = BOOK_CATEGORIES.indexOf(categoryA);
      const idxB = BOOK_CATEGORIES.indexOf(categoryB);
      if (idxA !== idxB) return idxA - idxB;
      return a.title.localeCompare(b.title, 'ja');
    });
    const showAddButton = materialsTab === 'desk';
    const isCategoryFiltering = materialsFilterCategory !== 'all';

    return (
      <div className="pb-24 animate-fade-in">
        <Header title="本棚" />
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMaterialsTab('desk')}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  materialsTab === 'desk'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                机の上
              </button>
              <button
                onClick={() => setMaterialsTab('hall')}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  materialsTab === 'hall'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                殿堂入り
              </button>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-3">
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-3 items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMaterialsView('card')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    materialsView === 'card'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  カード
                </button>
                <button
                  onClick={() => setMaterialsView('list')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    materialsView === 'list'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  リスト
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">カテゴリ</span>
                  <select
                    value={materialsFilterCategory}
                    onChange={(e) => setMaterialsFilterCategory(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="all">すべて</option>
                    {BOOK_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">並び替え</span>
                  <select
                    value={materialsSortMode}
                    onChange={(e) => setMaterialsSortMode(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="default">追加順</option>
                    <option value="category">カテゴリ順</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {materialsView === 'card' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {showAddButton ? (
                <button
                  onClick={openAddBookModal}
                  className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <Plus size={20} />
                  </div>
                  <span className="text-xs font-bold">新しい本</span>
                </button>
              ) : null}

              {sortedBooks.map((book) => {
                const isCompleted = book.status === 'completed';
                const badgeLabel = isCompleted ? '殿堂入り' : `${book.lap}周目`;
                return (
                  <button
                    key={book.id}
                    onClick={() => openBookDetailModal(book)}
                    className={`rounded-2xl p-4 shadow-sm border flex flex-col aspect-[3/4] relative overflow-hidden text-left transition-transform hover:scale-[1.01] ${
                      isCompleted
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-full h-2 ${isCompleted ? 'bg-amber-300' : book.color.split(' ')[0]}`}></div>

                    <span className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-white/80 border border-slate-200 text-slate-400 flex items-center justify-center">
                      <MoreHorizontal size={14} />
                    </span>

                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-slate-700/60 ${
                        isCompleted ? 'bg-amber-200' : book.color.split(' ')[0]
                      }`}
                    >
                      <Book size={20} />
                    </div>
                    <h3 className="font-bold text-slate-700 text-sm leading-tight mb-2 line-clamp-3 pr-2">
                      {book.title}
                    </h3>
                    <div className="mt-auto space-y-1.5 pr-16">
                      <p className="text-[11px] text-slate-500">最終: {book.lastUsed}</p>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                        {book.category || 'その他'}
                      </span>
                    </div>

                    <span
                      className={`absolute bottom-3 right-3 rounded-full px-2 py-1 text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {badgeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {showAddButton ? (
                <button
                  onClick={openAddBookModal}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-4 text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  <span className="text-sm font-semibold">新しい本を追加</span>
                </button>
              ) : null}

              {sortedBooks.map((book) => {
                const isCompleted = book.status === 'completed';
                const badgeLabel = isCompleted ? '殿堂入り' : `${book.lap}周目`;
                return (
                  <button
                    key={book.id}
                    onClick={() => openBookDetailModal(book)}
                    className={`w-full rounded-2xl border p-4 text-left flex items-center gap-3 transition-colors ${
                      isCompleted
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center text-slate-700/60 shrink-0 ${
                        isCompleted ? 'bg-amber-200' : book.color.split(' ')[0]
                      }`}
                    >
                      <Book size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-700 truncate">{book.title}</h3>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold shrink-0 ${
                            isCompleted
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                          {book.category || 'その他'}
                        </span>
                        <span className="text-[11px] text-slate-500">最終: {book.lastUsed}</span>
                      </div>
                    </div>

                    <span className="h-8 w-8 rounded-full bg-white/80 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                      <MoreHorizontal size={14} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {sortedBooks.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              {isCategoryFiltering
                ? '選択中のカテゴリに該当する本がありません'
                : materialsTab === 'desk'
                ? '机の上に本がありません'
                : '殿堂入りの本はまだありません'}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const heatmapScrollRef = useRef(null);

  const historyData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = 140;
    const startDate = addDays(today, -(totalDays - 1));

    const taskMinutesByDate = tasks.reduce((acc, task) => {
      if (!task?.date) return acc;
      acc[task.date] = (acc[task.date] || 0) + (Number(task.duration) || 0);
      return acc;
    }, {});

    const dailyRecords = Array.from({ length: totalDays }, (_, index) => {
      const date = addDays(startDate, index);
      const dateKey = toDateKey(date);
      const syntheticMinutes = Math.max(0, ((index * 17 + date.getDay() * 9) % 150) - 35);
      const minutes = Math.min(240, syntheticMinutes + (taskMinutesByDate[dateKey] || 0));
      return { date, dateKey, minutes };
    });

    const totalMinutes = dailyRecords.reduce((sum, entry) => sum + entry.minutes, 0);

    let currentStreak = 0;
    for (let i = dailyRecords.length - 1; i >= 0; i -= 1) {
      if (dailyRecords[i].minutes <= 0) break;
      currentStreak += 1;
    }

    const hourlyCounts = Array.from({ length: 24 }, () => 0);
    dailyRecords.forEach((entry, index) => {
      if (entry.minutes <= 0) return;
      const syntheticHour = (index * 5 + 6) % 24;
      hourlyCounts[syntheticHour] += 1;
    });

    tasks.forEach((task) => {
      const startHour = typeof task?.startHour === 'number'
        ? task.startHour
        : Math.floor((getTaskStartMinutes(task) || 0) / 60);
      const normalizedHour = Math.max(0, Math.min(23, startHour));
      hourlyCounts[normalizedHour] += 3;
    });

    const activeBooks = books.filter((book) => book.status !== 'completed');
    const categoryAccumulator = {};
    if (activeBooks.length > 0) {
      activeBooks.forEach((book, index) => {
        const seed = ((index + 1) * 19) % 45 + 20;
        categoryAccumulator[book.category || 'その他'] = (categoryAccumulator[book.category || 'その他'] || 0) + seed;
      });
    }

    tasks.forEach((task, index) => {
      const linkedBook = books.find((book) => book.id === task.bookId);
      const category = linkedBook?.category || 'その他';
      categoryAccumulator[category] = (categoryAccumulator[category] || 0) + (Number(task.duration) || 0) + index * 3;
    });

    const subjectBreakdown = Object.entries(categoryAccumulator)
      .map(([category, minutes]) => ({ category, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    const recordMap = dailyRecords.reduce((acc, entry) => {
      acc[entry.dateKey] = entry.minutes;
      return acc;
    }, {});

    const firstWeekStart = getWeekStartMonday(addDays(today, -133));
    const heatmapCells = [];
    for (let week = 0; week < 20; week += 1) {
      const weekStart = addDays(firstWeekStart, week * 7);
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const date = addDays(weekStart, dayIndex);
        const key = toDateKey(date);
        heatmapCells.push({
          key,
          minutes: recordMap[key] || 0,
          column: week + 1,
          row: dayIndex + 1,
        });
      }
    }

    const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));

    let insightComment = 'バランス型の学習リズムです。継続力が強みです。';
    if (peakHour <= 5) insightComment = '早朝型の努力家タイプです。朝の集中力を活かせています。';
    else if (peakHour <= 11) insightComment = '午前の立ち上がりが速いタイプです。理論学習との相性抜群です。';
    else if (peakHour <= 17) insightComment = '日中安定型です。計画的に積み上げられています。';
    else insightComment = '夜型の集中タイプですね。静かな時間を武器にできています。';

    const encouragement =
      currentStreak >= 14
        ? '驚異的な継続力です。この調子で合格まで駆け抜けましょう！'
        : currentStreak >= 7
        ? '素晴らしいペースです！習慣化が完全に軌道に乗っています。'
        : totalMinutes / 60 >= 100
        ? '100時間の壁を突破しました。実力が確実に積み上がっています！'
        : '今日の一歩が未来を変えます。小さくても前進を続けましょう。';

    return {
      totalHours: Math.round(totalMinutes / 60),
      currentStreak,
      encouragement,
      heatmapCells,
      heatmapWeeks: 20,
      hourlyCounts,
      subjectBreakdown,
      insightComment,
    };
  }, [books, tasks]);

  useEffect(() => {
    if (!heatmapScrollRef.current) return;
    const { scrollWidth, clientWidth } = heatmapScrollRef.current;
    heatmapScrollRef.current.scrollLeft = Math.max(0, scrollWidth - clientWidth);
  }, [historyData.heatmapCells]);

  const getHeatmapTone = (minutes) => {
    if (minutes <= 0) return 'bg-slate-100';
    if (minutes <= 30) return 'bg-indigo-200';
    if (minutes <= 90) return 'bg-indigo-400';
    return 'bg-indigo-600';
  };

  const renderHistory = () => {
    const maxHourlyCount = Math.max(...historyData.hourlyCounts, 1);
    const totalSubjectMinutes = historyData.subjectBreakdown.reduce((sum, item) => sum + item.minutes, 0) || 1;

    return (
      <div className="pb-24 animate-fade-in text-slate-700">
        <Header title="あゆみ" />
        <div className="px-4 sm:px-6 lg:px-8 space-y-6">
          <section className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg">
            <p className="text-indigo-100 text-sm font-medium mb-3">あなたの学習ダッシュボード</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs tracking-wider text-indigo-100">総学習時間</p>
                <p className="text-4xl font-bold tracking-tight mt-1">{historyData.totalHours}<span className="text-xl ml-1 align-middle">時間</span></p>
              </div>
              <div>
                <p className="text-xs tracking-wider text-indigo-100">継続日数</p>
                <p className="text-4xl font-bold tracking-tight mt-1">{historyData.currentStreak}<span className="text-xl ml-1 align-middle">日</span></p>
              </div>
            </div>
            <p className="mt-4 text-sm sm:text-base bg-white/15 rounded-2xl px-4 py-3">{historyData.encouragement}</p>
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-700">学習の足あと（直近3ヶ月）</h3>
              <p className="text-xs text-slate-500 mt-1">日々の学習時間をGitHub風に可視化しています</p>
            </div>
            <div className="flex gap-3">
              <div className="pt-1 text-[11px] text-slate-500 leading-[18px]">
                <p className="h-[18px]">月</p>
                <p className="h-[18px]">&nbsp;</p>
                <p className="h-[18px]">水</p>
                <p className="h-[18px]">&nbsp;</p>
                <p className="h-[18px]">金</p>
              </div>
              <div ref={heatmapScrollRef} className="overflow-x-auto pb-2">
                <div
                  className="grid min-w-max gap-1"
                  style={{
                    gridTemplateRows: 'repeat(7, 1fr)',
                    gridAutoFlow: 'column',
                    gridAutoColumns: '16px',
                  }}
                >
                  {historyData.heatmapCells.map((cell) => (
                    <div
                      key={cell.key}
                      title={`${cell.key} / ${cell.minutes}分`}
                      className={`h-4 w-4 rounded-[4px] ${getHeatmapTone(cell.minutes)}`}
                      style={{ gridColumn: cell.column, gridRow: cell.row }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>少</span>
              <span>・・・</span>
              <span className="h-3 w-3 rounded-sm bg-slate-100" />
              <span className="h-3 w-3 rounded-sm bg-indigo-200" />
              <span className="h-3 w-3 rounded-sm bg-indigo-400" />
              <span className="h-3 w-3 rounded-sm bg-indigo-600" />
              <span>・・・</span>
              <span>多</span>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-700">時間帯別の集中度</h3>
              <p className="text-xs text-slate-500 mt-1">よく学習する時間帯がひと目でわかります</p>
            </div>
            <div className="h-48 flex items-end gap-1 rounded-xl bg-slate-50 p-3">
              {historyData.hourlyCounts.map((count, hour) => {
                const height = Math.max(8, (count / maxHourlyCount) * 100);
                const showHourLabel = hour % 6 === 0;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center justify-end min-w-[12px]">
                    <div className="w-full rounded-t-md bg-indigo-500/90" style={{ height: `${height}%` }} />
                    <span className="mt-1 h-3 text-[10px] text-slate-500">{showHourLabel ? hour : ''}</span>
                  </div>
                );
              })}
            </div>
            <p className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{historyData.insightComment}</p>
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-700">科目別のバランス</h3>
              <p className="text-xs text-slate-500 mt-1">カテゴリ別の学習比率</p>
            </div>
            <div className="space-y-3">
              {historyData.subjectBreakdown.map((subject, index) => {
                const ratio = Math.round((subject.minutes / totalSubjectMinutes) * 100);
                return (
                  <div key={subject.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{subject.category}</span>
                      <span className="text-slate-500">{ratio}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${index % 2 === 0 ? 'bg-indigo-500' : 'bg-violet-500'}`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  };


  // --- Main Layout ---
  return (
    <div className="bg-slate-50 min-h-screen w-full font-sans antialiased text-slate-600">
      {renderAddTaskSheet()}
      {renderEditTaskSheet()}
      {renderPeriodPickerModal()}
      {renderPlanSettingsModal()}
      {renderAddBookSheet()}
      {renderBookDetailModal()}
      {renderFocusOverlay()}
      
      <div className="mx-auto w-full max-w-[1200px] min-h-screen bg-slate-50 relative flex flex-col overflow-y-auto hide-scrollbar lg:shadow-2xl">
        <main className="flex-1">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'plan' && renderPlan()}
          {activeTab === 'materials' && renderMaterials()}
          {activeTab === 'history' && renderHistory()}
        </main>

        <nav className="fixed inset-x-0 bottom-0 bg-white/95 border-t border-slate-100 pb-safe pt-1 shadow-lg z-40 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-4 lg:px-6">
            <div className="flex justify-around items-center">
              <TabButton id="home" icon={Home} label="ホーム" />
              <TabButton id="plan" icon={Calendar} label="計画表" />
              <TabButton id="materials" icon={BookOpen} label="本棚" />
              <TabButton id="history" icon={Footprints} label="あゆみ" />
            </div>
          </div>
        </nav>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes focus-pulse {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.015); filter: brightness(1.08); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .focus-ring-running {
          animation: focus-pulse 2.6s ease-in-out infinite;
        }
        @keyframes task-pop {
          0% { transform: scale(0.9); opacity: 0.6; }
          70% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-task-pop {
          animation: task-pop 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}
