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

export const BOOK_CATEGORIES = ['テキスト', '参考書', '問題集', '過去問', '単語帳', 'その他'];

// --- Demo Data ---
export const DEFAULT_BOOKS: Book[] = [
  {
    id: 1,
    title: 'TOEIC 公式問題集 Vol.10',
    colorKey: 'amber',
    color: 'bg-amber-100 text-amber-800',
    taskColor: 'bg-amber-50 text-amber-700 border-amber-100',
    status: 'active',
    category: '問題集',
    lap: 2,
    lastUsed: '2日前',
  },
  {
    id: 2,
    title: '英単語ターゲット 1900',
    colorKey: 'blue',
    color: 'bg-blue-100 text-blue-800',
    taskColor: 'bg-blue-50 text-blue-700 border-blue-100',
    status: 'active',
    category: '単語帳',
    lap: 1,
    lastUsed: '今日',
  },
  {
    id: 3,
    title: '合格テキスト 宅建士 基礎編',
    colorKey: 'rose',
    color: 'bg-rose-100 text-rose-800',
    taskColor: 'bg-rose-50 text-rose-700 border-rose-100',
    status: 'active',
    category: 'テキスト',
    lap: 3,
    lastUsed: '3日前',
  },
  {
    id: 4,
    title: '出る順 簿記2級 過去問',
    colorKey: 'violet',
    color: 'bg-violet-100 text-violet-800',
    taskColor: 'bg-violet-50 text-violet-700 border-violet-100',
    status: 'completed',
    category: '過去問',
    lap: 5,
    lastUsed: '12日前',
  },
];
