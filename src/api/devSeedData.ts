/**
 * Dev Mode テストデータ
 * VITE_ENABLE_DEV_LOGIN=true のとき、初回ログイン時に自動投入される。
 * localStorage の sm_dev_* キーが空の場合のみ投入。
 */
import type { Goal, Book, Task } from '../constants';
import { BOOK_COLOR_PALETTE } from '../constants';

// ---------- Helpers ----------

/** 今日を基準に ±days の YYYY-MM-DD を返す */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const today = dateOffset(0);
const pal = (key: string) => BOOK_COLOR_PALETTE.find(p => p.key === key)!;

// ---------- Goals ----------

export const SEED_GOALS: Goal[] = [
  {
    id: 9001,
    title: 'TOEIC L&R 800点',
    examDate: dateOffset(90),
    targetHours: 200,
    weekdayHoursTarget: 1.5,
    weekendHoursTarget: 3,
    isActive: true,
  },
];

// ---------- Books ----------

export const SEED_BOOKS: Book[] = [
  {
    id: 8001,
    title: '公式 TOEIC 問題集 Vol.10',
    colorKey: 'amber',
    color: pal('amber').card,
    taskColor: pal('amber').task,
    status: 'active',
    category: '問題集',
    lap: 1,
    lastUsed: today,
    totalPages: 200,
    completedPages: 45,
  },
  {
    id: 8002,
    title: '金のフレーズ',
    colorKey: 'blue',
    color: pal('blue').card,
    taskColor: pal('blue').task,
    status: 'active',
    category: '単語帳',
    lap: 2,
    lastUsed: dateOffset(-1),
    totalPages: 300,
    completedPages: 180,
  },
  {
    id: 8003,
    title: 'TOEIC L&R 出る問 特急',
    colorKey: 'rose',
    color: pal('rose').card,
    taskColor: pal('rose').task,
    status: 'active',
    category: '参考書',
    lap: 1,
    lastUsed: dateOffset(-2),
    totalPages: 160,
    completedPages: 30,
  },
  {
    id: 8004,
    title: '英文法 Forest',
    colorKey: 'emerald',
    color: pal('emerald').card,
    taskColor: pal('emerald').task,
    status: 'completed',
    category: 'テキスト',
    lap: 3,
    lastUsed: dateOffset(-10),
    totalPages: 400,
    completedPages: 400,
  },
];

// ---------- Tasks (今週 + 先週の一部) ----------

function buildTasks(): Task[] {
  const tasks: Task[] = [];
  let id = 7000;

  const add = (dayOff: number, startMin: number, dur: number, bookIdx: number, completed = false) => {
    const book = SEED_BOOKS[bookIdx];
    tasks.push({
      id: ++id,
      date: dateOffset(dayOff),
      startMinutes: startMin,
      duration: dur,
      title: book.title,
      color: book.taskColor,
      type: 'study',
      bookId: book.id,
      isCompleted: completed,
    });
  };

  const addFree = (dayOff: number, startMin: number, dur: number, title: string, completed = false) => {
    tasks.push({
      id: ++id,
      date: dateOffset(dayOff),
      startMinutes: startMin,
      duration: dur,
      title,
      color: 'bg-slate-50 text-slate-700 border-slate-100',
      type: 'event',
      isCompleted: completed,
    });
  };

  // --- 先週（完了済み） ---
  add(-7, 540, 60, 0, true);    // 7日前 09:00 公式問題集
  add(-6, 480, 45, 1, true);    // 6日前 08:00 金のフレーズ
  add(-5, 600, 90, 0, true);    // 5日前 10:00 公式問題集
  add(-4, 540, 60, 2, true);    // 4日前 09:00 出る問特急
  add(-3, 480, 60, 1, true);    // 3日前 08:00 金のフレーズ

  // --- 今日 ---
  add(0, 480, 60, 0, true);     // 08:00 公式問題集 (完了)
  add(0, 570, 45, 1, false);    // 09:30 金のフレーズ (未完了)
  addFree(0, 720, 60, '英語リスニング練習', false); // 12:00 自由入力
  add(0, 840, 60, 2, false);    // 14:00 出る問特急

  // --- 明日 ---
  add(1, 510, 60, 0, false);    // 08:30 公式問題集
  add(1, 600, 45, 1, false);    // 10:00 金のフレーズ
  addFree(1, 780, 30, 'オンライン英会話', false); // 13:00

  // --- 明後日 ---
  add(2, 540, 90, 0, false);    // 09:00 公式問題集
  add(2, 660, 60, 2, false);    // 11:00 出る問特急

  // --- 3日後 ---
  add(3, 480, 45, 1, false);    // 08:00 金のフレーズ
  add(3, 570, 60, 0, false);    // 09:30 公式問題集

  // --- 4日後（週末想定：長め） ---
  add(4, 540, 120, 0, false);   // 09:00 公式問題集 2h
  add(4, 720, 60, 2, false);    // 12:00 出る問特急
  add(4, 840, 60, 1, false);    // 14:00 金のフレーズ

  return tasks;
}

export const SEED_TASKS: Task[] = buildTasks();
