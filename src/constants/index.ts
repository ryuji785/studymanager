// --- App Constants ---
export const DEFAULT_PLAN_START_HOUR = 7;
export const DEFAULT_PLAN_END_HOUR = 23;
export const PLAN_SLOT_MINUTES = 30;
export const PLAN_ROW_HEIGHT = 56;
export const DEFAULT_FOCUS_MINUTES = 25;
export const DEMO_TODAY_DAY = 15;
export const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

// --- Types ---
export interface BookColorPalette {
  key: string;
  label: string;
  card: string;
  task: string;
}

export interface Book {
  id: number;
  title: string;
  colorKey: string;
  color: string;
  taskColor: string;
  status: 'active' | 'completed';
  category: string;
  lap: number;
  lastUsed: string;
  totalPages?: number;
  completedPages?: number;
  deadline?: string;
}

export interface Task {
  id: number;
  date: string;
  startMinutes: number;
  duration: number;
  title: string;
  color: string;
  type: 'study' | 'event';
  bookId?: number;
  isCompleted: boolean;
}

export interface WeekDay {
  key: string;
  day: string;
  date: string;
  month: number;
  year: number;
}

export interface Goal {
  id: number;
  title: string;
  examDate: string;
  targetHours: number;
  weekdayHoursTarget: number;
  weekendHoursTarget: number;
  isActive: boolean;
}

// --- Color Palette ---
export const BOOK_COLOR_PALETTE: BookColorPalette[] = [
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

export const BOOK_CATEGORIES = ['学科', '実技', '論述', '法令', '過去問', 'その他'];

// --- Demo Data ---
export const DEFAULT_BOOKS: Book[] = [
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
