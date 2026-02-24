import { createClient, type Client } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

let db: Client;

export function getDb(): Client {
  if (!db) {
    // ローカル開発: ファイルベースSQLite / 本番: Turso
    const url = process.env.TURSO_DATABASE_URL || 'file:./server/data/study.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;

    db = createClient({
      url,
      ...(authToken ? { authToken } : {}),
    });
  }
  return db;
}

export async function initDb(): Promise<void> {
  const client = getDb();

  // Create tables
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS goals (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id               TEXT    NOT NULL DEFAULT 'local',
      title                 TEXT    NOT NULL,
      exam_date             TEXT    NOT NULL,
      target_hours          REAL    NOT NULL DEFAULT 150,
      weekday_hours_target  REAL    NOT NULL DEFAULT 1.5,
      weekend_hours_target  REAL    NOT NULL DEFAULT 3.0,
      is_active             INTEGER NOT NULL DEFAULT 1,
      created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         TEXT    NOT NULL DEFAULT 'local',
      title           TEXT    NOT NULL,
      color_key       TEXT    NOT NULL DEFAULT 'blue',
      color           TEXT    NOT NULL DEFAULT '',
      task_color      TEXT    NOT NULL DEFAULT '',
      category        TEXT    NOT NULL DEFAULT 'その他',
      lap             INTEGER NOT NULL DEFAULT 1,
      status          TEXT    NOT NULL DEFAULT 'active',
      last_used       TEXT    NOT NULL DEFAULT '新規',
      total_pages     INTEGER DEFAULT NULL,
      completed_pages INTEGER NOT NULL DEFAULT 0,
      deadline        TEXT    DEFAULT NULL,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        TEXT    NOT NULL DEFAULT 'local',
      book_id        INTEGER REFERENCES books(id) ON DELETE SET NULL,
      date           TEXT    NOT NULL,
      start_minutes  INTEGER NOT NULL,
      duration       INTEGER NOT NULL DEFAULT 60,
      title          TEXT    NOT NULL,
      color          TEXT    NOT NULL DEFAULT '',
      type           TEXT    NOT NULL DEFAULT 'study',
      is_completed   INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default books if empty
  const bookCount = await client.execute('SELECT COUNT(*) AS cnt FROM books');
  if (Number((bookCount.rows[0] as any).cnt) === 0) {
    const bookSeeds = [
      { userId: 'local', title: 'キャリコン学科（過去問）', colorKey: 'indigo', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', taskColor: 'bg-indigo-50 text-indigo-700 border-indigo-100', category: '学科', lap: 3, status: 'active', lastUsed: '昨日', totalPages: 300, completedPages: 210, deadline: '2026-06-30' },
      { userId: 'local', title: '理論と実際', colorKey: 'amber', color: 'bg-amber-50 text-amber-700 border-amber-200', taskColor: 'bg-amber-50 text-amber-700 border-amber-100', category: '学科', lap: 1, status: 'active', lastUsed: '3日前', totalPages: 450, completedPages: 135, deadline: '2026-08-31' },
      { userId: 'local', title: 'キャリア理論まとめノート', colorKey: 'emerald', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', taskColor: 'bg-emerald-50 text-emerald-700 border-emerald-100', category: '学科', lap: 2, status: 'active', lastUsed: '1週間前', totalPages: 180, completedPages: 90, deadline: '2026-07-15' },
      { userId: 'local', title: '職業能力開発促進法テキスト', colorKey: 'blue', color: 'bg-blue-50 text-blue-700 border-blue-200', taskColor: 'bg-blue-50 text-blue-700 border-blue-100', category: '学科', lap: 1, status: 'active', lastUsed: '5日前', totalPages: 220, completedPages: 55, deadline: null },
      { userId: 'local', title: 'キャリコン実技（論述）', colorKey: 'blue', color: 'bg-blue-50 text-blue-700 border-blue-200', taskColor: 'bg-blue-50 text-blue-700 border-blue-100', category: '実技', lap: 2, status: 'active', lastUsed: '3日前', totalPages: null, completedPages: 0, deadline: null },
      { userId: 'local', title: 'キャリコン実技（面接）', colorKey: 'emerald', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', taskColor: 'bg-emerald-50 text-emerald-700 border-emerald-100', category: '実技', lap: 1, status: 'active', lastUsed: '5日前', totalPages: null, completedPages: 0, deadline: null },
      { userId: 'local', title: 'ロールプレイ練習帳', colorKey: 'violet', color: 'bg-violet-50 text-violet-700 border-violet-200', taskColor: 'bg-violet-50 text-violet-700 border-violet-100', category: '実技', lap: 1, status: 'active', lastUsed: '2日前', totalPages: 60, completedPages: 25, deadline: '2026-09-30' },
      { userId: 'local', title: '職業能力開発テキスト（初版）', colorKey: 'rose', color: 'bg-rose-50 text-rose-700 border-rose-200', taskColor: 'bg-rose-50 text-rose-700 border-rose-100', category: '学科', lap: 2, status: 'completed', lastUsed: '2週間前', totalPages: 200, completedPages: 200, deadline: null },
      { userId: 'local', title: 'キャリコン入門', colorKey: 'amber', color: 'bg-amber-50 text-amber-700 border-amber-200', taskColor: 'bg-amber-50 text-amber-700 border-amber-100', category: '学科', lap: 1, status: 'completed', lastUsed: '1ヶ月前', totalPages: 150, completedPages: 150, deadline: null },
    ];

    for (const b of bookSeeds) {
      await client.execute({
        sql: `INSERT INTO books (user_id, title, color_key, color, task_color, category, lap, status, last_used, total_pages, completed_pages, deadline)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [b.userId, b.title, b.colorKey, b.color, b.taskColor, b.category, b.lap, b.status, b.lastUsed, b.totalPages, b.completedPages, b.deadline],
      });
    }
    console.log(`Seeded ${bookSeeds.length} books.`);
  }

  // Seed default goals if empty
  const goalCount = await client.execute('SELECT COUNT(*) AS cnt FROM goals');
  if (Number((goalCount.rows[0] as any).cnt) === 0) {
    await client.execute({
      sql: `INSERT INTO goals (user_id, title, exam_date, target_hours, weekday_hours_target, weekend_hours_target, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['local', '国家資格キャリアコンサルタント試験', '2026-10-18', 150, 1.5, 3.0, 1],
    });
    await client.execute({
      sql: `INSERT INTO goals (user_id, title, exam_date, target_hours, weekday_hours_target, weekend_hours_target, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['local', 'TOEIC 800点（サブゴール）', '2026-12-01', 80, 1.0, 2.0, 0],
    });
    console.log('Seeded 2 goals.');
  }

  // Seed tasks if empty
  const taskCount = await client.execute('SELECT COUNT(*) AS cnt FROM tasks');
  if (Number((taskCount.rows[0] as any).cnt) === 0) {
    const today = new Date();
    function dateKey(off: number) { const d = new Date(today); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); }

    const templates = [
      { bookId: 1, title: 'キャリコン学科（過去問）', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', start: 390, dur: 45 },  // 06:30
      { bookId: 2, title: '理論と実際', color: 'bg-amber-50 text-amber-700 border-amber-100', start: 600, dur: 60 },  // 10:00
      { bookId: 3, title: 'キャリア理論まとめノート', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', start: 780, dur: 60 },  // 13:00
      { bookId: 7, title: 'ロールプレイ練習帳', color: 'bg-violet-50 text-violet-700 border-violet-100', start: 1170, dur: 45 },  // 19:30
      { bookId: 4, title: '職業能力開発促進法テキスト', color: 'bg-blue-50 text-blue-700 border-blue-100', start: 480, dur: 60 },  // 08:00
      { bookId: 5, title: 'キャリコン実技（論述）', color: 'bg-blue-50 text-blue-700 border-blue-100', start: 870, dur: 60 },  // 14:30
      { bookId: 6, title: 'キャリコン実技（面接）', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', start: 930, dur: 45 },  // 15:30
    ];

    for (let dayOff = -21; dayOff <= 7; dayOff++) {
      const key = dateKey(dayOff);
      const d = new Date(today); d.setDate(d.getDate() + dayOff);
      const dow = d.getDay();
      const isPast = dayOff < 0;

      // Morning study (06:30)
      await client.execute({
        sql: `INSERT INTO tasks (user_id, book_id, date, start_minutes, duration, title, color, type, is_completed) VALUES (?,?,?,?,?,?,?,?,?)`,
        args: ['local', templates[0].bookId, key, templates[0].start, templates[0].dur, templates[0].title, templates[0].color, 'study', isPast ? 1 : 0]
      });

      // Mid-morning study (08:00 or 10:00, alternating)
      const t2 = templates[dayOff % 2 === 0 ? 4 : 1];
      await client.execute({
        sql: `INSERT INTO tasks (user_id, book_id, date, start_minutes, duration, title, color, type, is_completed) VALUES (?,?,?,?,?,?,?,?,?)`,
        args: ['local', t2.bookId, key, t2.start, t2.dur, t2.title, t2.color, 'study', isPast ? 1 : 0]
      });

      // Afternoon study (13:00)
      const t3 = templates[2];
      await client.execute({
        sql: `INSERT INTO tasks (user_id, book_id, date, start_minutes, duration, title, color, type, is_completed) VALUES (?,?,?,?,?,?,?,?,?)`,
        args: ['local', t3.bookId, key, t3.start, t3.dur, t3.title, t3.color, 'study', isPast ? 1 : 0]
      });

      // Evening study (19:30) — Tue/Thu
      if (dow === 2 || dow === 4) {
        const t4 = templates[3];
        await client.execute({
          sql: `INSERT INTO tasks (user_id, book_id, date, start_minutes, duration, title, color, type, is_completed) VALUES (?,?,?,?,?,?,?,?,?)`,
          args: ['local', t4.bookId, key, t4.start, t4.dur, t4.title, t4.color, 'study', isPast ? 1 : 0]
        });
      }

      // Weekend extra (14:30 + 15:30)
      if (dow === 0 || dow === 6) {
        await client.execute({
          sql: `INSERT INTO tasks (user_id, book_id, date, start_minutes, duration, title, color, type, is_completed) VALUES (?,?,?,?,?,?,?,?,?)`,
          args: ['local', templates[5].bookId, key, templates[5].start, templates[5].dur, templates[5].title, templates[5].color, 'study', isPast ? 1 : 0]
        });
        await client.execute({
          sql: `INSERT INTO tasks (user_id, book_id, date, start_minutes, duration, title, color, type, is_completed) VALUES (?,?,?,?,?,?,?,?,?)`,
          args: ['local', templates[6].bookId, key, templates[6].start, templates[6].dur, templates[6].title, templates[6].color, 'study', isPast ? 1 : 0]
        });
      }
    }
    console.log('Seeded tasks.');
  }

  console.log('Database ready.');
}
