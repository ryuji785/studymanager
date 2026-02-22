import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient, type Client } from '@libsql/client';

// ========== Config ==========
const {
  GOOGLE_CLIENT_ID = '',
  GOOGLE_CLIENT_SECRET = '',
  GOOGLE_CALLBACK_URL = '',
  FRONTEND_ORIGIN = 'http://localhost:5173',
  JWT_SECRET = 'dev-jwt-secret-change-in-production',
  TURSO_DATABASE_URL = '',
  TURSO_AUTH_TOKEN = '',
  NODE_ENV = 'development',
  ENABLE_DEV_LOGIN = 'true',
} = process.env;

// ========== DB ==========
let db: Client;
function getDb(): Client {
  if (!db) {
    const url = TURSO_DATABASE_URL || (NODE_ENV === 'production' ? '' : 'file:./server/data/study.db');
    if (!url) throw new Error('TURSO_DATABASE_URL is required in production. Set it in Vercel Environment Variables.');
    db = createClient({ url, ...(TURSO_AUTH_TOKEN ? { authToken: TURSO_AUTH_TOKEN } : {}) });
  }
  return db;
}

let dbReady = false;
async function ensureDb() {
  if (dbReady) return;
  const c = getDb();
  await c.executeMultiple(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT 'local',
      title TEXT NOT NULL, exam_date TEXT NOT NULL, target_hours REAL NOT NULL DEFAULT 150,
      weekday_hours_target REAL NOT NULL DEFAULT 1.5, weekend_hours_target REAL NOT NULL DEFAULT 3.0,
      is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT 'local',
      title TEXT NOT NULL, color_key TEXT NOT NULL DEFAULT 'blue', color TEXT NOT NULL DEFAULT '',
      task_color TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'その他',
      lap INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'active',
      last_used TEXT NOT NULL DEFAULT '新規', total_pages INTEGER DEFAULT NULL,
      completed_pages INTEGER NOT NULL DEFAULT 0, deadline TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL DEFAULT 'local',
      book_id INTEGER REFERENCES books(id) ON DELETE SET NULL, date TEXT NOT NULL,
      start_minutes INTEGER NOT NULL, duration INTEGER NOT NULL DEFAULT 60,
      title TEXT NOT NULL, color TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'study',
      is_completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  dbReady = true;
}

// ========== JWT ==========
const COOKIE_NAME = 'sm_token';
const COOKIE_OPTS: express.CookieOptions = {
  httpOnly: true, sameSite: 'lax',
  secure: NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
};
function signToken(payload: object) { return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); }

// ========== Express ==========
const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

// Cookie parser
app.use((req, _res, next) => {
  const cookie = req.headers.cookie;
  (req as any).cookies = cookie
    ? Object.fromEntries(cookie.split(';').map(c => { const [k, ...v] = c.trim().split('='); return [k, decodeURIComponent(v.join('='))]; }))
    : {};
  next();
});

// Lazy DB init
app.use(async (_req, _res, next) => { try { await ensureDb(); next(); } catch (e) { console.error('DB init error:', e); next(e); } });

// Auth middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (token) {
    try { (req as any).userId = (jwt.verify(token, JWT_SECRET) as any).id; return next(); } catch { }
  }
  if (NODE_ENV !== 'production' || ENABLE_DEV_LOGIN === 'true') { (req as any).userId = 'local'; return next(); }
  res.status(401).json({ message: 'Unauthorized' });
}

// ========== Auth routes ==========
app.get('/auth/google', (_req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { ...COOKIE_OPTS, maxAge: 600000 });
  const p = new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_CALLBACK_URL, response_type: 'code', scope: 'openid email profile', state, access_type: 'online', prompt: 'select_account' });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${p}`);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (typeof code !== 'string' || typeof state !== 'string') return res.status(400).send('Bad request');
  res.clearCookie('oauth_state');
  try {
    const tr = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_CALLBACK_URL, grant_type: 'authorization_code' }),
    });
    if (!tr.ok) return res.status(500).send('Token exchange failed');
    const { access_token } = await tr.json() as any;
    const ur = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${access_token}` } });
    if (!ur.ok) return res.status(500).send('Profile fetch failed');
    const u = await ur.json() as any;
    res.cookie(COOKIE_NAME, signToken({ id: u.sub, name: u.name, email: u.email, picture: u.picture }), COOKIE_OPTS);
    res.redirect(FRONTEND_ORIGIN || '/');
  } catch (e) { console.error(e); res.status(500).send('Auth error'); }
});

app.get('/auth/me', (req, res) => {
  const t = (req as any).cookies?.[COOKIE_NAME];
  if (!t) return res.status(401).json({ message: 'Unauthorized' });
  try { res.json(jwt.verify(t, JWT_SECRET)); } catch { res.status(401).json({ message: 'Unauthorized' }); }
});

app.post('/auth/logout', (_req, res) => { res.clearCookie(COOKIE_NAME, COOKIE_OPTS); res.json({ ok: true }); });

app.post('/auth/dev-login', (_req, res) => {
  if (NODE_ENV === 'production' && ENABLE_DEV_LOGIN !== 'true') return res.status(404).json({ message: 'Not found' });
  const user = { id: 'local', name: '開発ユーザー', email: 'dev@localhost' };
  res.cookie(COOKIE_NAME, signToken(user), COOKIE_OPTS);
  res.json(user);
});

// ========== Books ==========
app.get('/api/books', requireAuth, async (req, res) => {
  try {
    const r = await getDb().execute({ sql: 'SELECT * FROM books WHERE user_id=? ORDER BY id', args: [(req as any).userId] });
    res.json(r.rows.map((b: any) => ({ id: b.id, title: b.title, colorKey: b.color_key, color: b.color, taskColor: b.task_color, category: b.category, lap: b.lap, status: b.status, lastUsed: b.last_used, totalPages: b.total_pages, completedPages: b.completed_pages, deadline: b.deadline })));
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.post('/api/books', requireAuth, async (req, res) => {
  const uid = (req as any).userId;
  const { title, colorKey, color, taskColor, category, lap, status, lastUsed, totalPages, deadline } = req.body;
  try {
    const r = await getDb().execute({
      sql: `INSERT INTO books (user_id,title,color_key,color,task_color,category,lap,status,last_used,total_pages,completed_pages,deadline) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [uid, title?.trim(), colorKey || 'blue', color || '', taskColor || '', category || 'その他', Number(lap) || 1, status || 'active', lastUsed || '新規', totalPages ?? null, 0, deadline ?? null]
    });
    const b = (await getDb().execute({ sql: 'SELECT * FROM books WHERE id=?', args: [Number(r.lastInsertRowid)] })).rows[0] as any;
    res.status(201).json({ id: b.id, title: b.title, colorKey: b.color_key, color: b.color, taskColor: b.task_color, category: b.category, lap: b.lap, status: b.status, lastUsed: b.last_used, totalPages: b.total_pages, completedPages: b.completed_pages, deadline: b.deadline });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.put('/api/books/:id', requireAuth, async (req, res) => {
  const uid = (req as any).userId; const id = Number(req.params.id);
  const { title, colorKey, color, taskColor, category, lap, status, lastUsed, totalPages, completedPages, deadline } = req.body;
  try {
    await getDb().execute({
      sql: `UPDATE books SET title=COALESCE(?,title),color_key=COALESCE(?,color_key),color=COALESCE(?,color),task_color=COALESCE(?,task_color),category=COALESCE(?,category),lap=COALESCE(?,lap),status=COALESCE(?,status),last_used=COALESCE(?,last_used),total_pages=COALESCE(?,total_pages),completed_pages=COALESCE(?,completed_pages),deadline=COALESCE(?,deadline),updated_at=datetime('now') WHERE id=? AND user_id=?`,
      args: [title ?? null, colorKey ?? null, color ?? null, taskColor ?? null, category ?? null, lap != null ? Number(lap) : null, status ?? null, lastUsed ?? null, totalPages !== undefined ? (totalPages === null ? null : Number(totalPages)) : null, completedPages !== undefined ? Number(completedPages) : null, deadline !== undefined ? (deadline ?? null) : null, id, uid]
    });
    const b = (await getDb().execute({ sql: 'SELECT * FROM books WHERE id=?', args: [id] })).rows[0] as any;
    res.json({ id: b.id, title: b.title, colorKey: b.color_key, color: b.color, taskColor: b.task_color, category: b.category, lap: b.lap, status: b.status, lastUsed: b.last_used, totalPages: b.total_pages, completedPages: b.completed_pages, deadline: b.deadline });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.delete('/api/books/:id', requireAuth, async (req, res) => {
  try { await getDb().execute({ sql: 'DELETE FROM books WHERE id=? AND user_id=?', args: [Number(req.params.id), (req as any).userId] }); res.json({ ok: true }); }
  catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

// ========== Tasks ==========
app.get('/api/tasks', requireAuth, async (req, res) => {
  const uid = (req as any).userId; const { from, to } = req.query as any;
  try {
    const r = (from && to)
      ? await getDb().execute({ sql: 'SELECT * FROM tasks WHERE user_id=? AND date>=? AND date<=? ORDER BY date,start_minutes', args: [uid, from, to] })
      : await getDb().execute({ sql: 'SELECT * FROM tasks WHERE user_id=? ORDER BY date,start_minutes', args: [uid] });
    res.json(r.rows.map((t: any) => ({ id: t.id, date: t.date, startMinutes: t.start_minutes, duration: t.duration, title: t.title, color: t.color, type: t.type, bookId: t.book_id, isCompleted: Boolean(t.is_completed) })));
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.post('/api/tasks', requireAuth, async (req, res) => {
  const uid = (req as any).userId;
  const { date, startMinutes, duration, title, color, type, bookId, isCompleted } = req.body;
  try {
    const r = await getDb().execute({
      sql: `INSERT INTO tasks (user_id,book_id,date,start_minutes,duration,title,color,type,is_completed) VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [uid, bookId ?? null, date, Number(startMinutes) || 0, Number(duration) || 60, title, color || '', type || 'study', isCompleted ? 1 : 0]
    });
    const t = (await getDb().execute({ sql: 'SELECT * FROM tasks WHERE id=?', args: [Number(r.lastInsertRowid)] })).rows[0] as any;
    res.status(201).json({ id: t.id, date: t.date, startMinutes: t.start_minutes, duration: t.duration, title: t.title, color: t.color, type: t.type, bookId: t.book_id, isCompleted: Boolean(t.is_completed) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  const uid = (req as any).userId; const id = Number(req.params.id);
  const { date, startMinutes, duration, title, color, type, bookId, isCompleted } = req.body;
  try {
    await getDb().execute({
      sql: `UPDATE tasks SET date=COALESCE(?,date),start_minutes=COALESCE(?,start_minutes),duration=COALESCE(?,duration),title=COALESCE(?,title),color=COALESCE(?,color),type=COALESCE(?,type),book_id=COALESCE(?,book_id),is_completed=COALESCE(?,is_completed),updated_at=datetime('now') WHERE id=? AND user_id=?`,
      args: [date ?? null, startMinutes != null ? Number(startMinutes) : null, duration != null ? Number(duration) : null, title ?? null, color ?? null, type ?? null, bookId !== undefined ? (bookId ?? null) : null, isCompleted !== undefined ? (isCompleted ? 1 : 0) : null, id, uid]
    });
    const t = (await getDb().execute({ sql: 'SELECT * FROM tasks WHERE id=?', args: [id] })).rows[0] as any;
    res.json({ id: t.id, date: t.date, startMinutes: t.start_minutes, duration: t.duration, title: t.title, color: t.color, type: t.type, bookId: t.book_id, isCompleted: Boolean(t.is_completed) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try { await getDb().execute({ sql: 'DELETE FROM tasks WHERE id=? AND user_id=?', args: [Number(req.params.id), (req as any).userId] }); res.json({ ok: true }); }
  catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

// ========== Goals ==========
app.get('/api/goals', requireAuth, async (req, res) => {
  try {
    const r = await getDb().execute({ sql: 'SELECT id,title,exam_date as examDate,target_hours as targetHours,weekday_hours_target as weekdayHoursTarget,weekend_hours_target as weekendHoursTarget,is_active as isActive FROM goals WHERE user_id=? ORDER BY created_at DESC', args: [(req as any).userId] });
    res.json(r.rows.map((g: any) => ({ ...g, isActive: Boolean(g.isActive) })));
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.post('/api/goals', requireAuth, async (req, res) => {
  const uid = (req as any).userId;
  const { title, examDate, targetHours, weekdayHoursTarget, weekendHoursTarget, isActive } = req.body;
  try {
    const r = await getDb().execute({
      sql: `INSERT INTO goals (user_id,title,exam_date,target_hours,weekday_hours_target,weekend_hours_target,is_active) VALUES (?,?,?,?,?,?,?)`,
      args: [uid, title, examDate, targetHours ?? 150, weekdayHoursTarget ?? 1.5, weekendHoursTarget ?? 3.0, isActive !== undefined ? (isActive ? 1 : 0) : 1]
    });
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.put('/api/goals/:id', requireAuth, async (req, res) => {
  const uid = (req as any).userId; const id = req.params.id; const u = req.body;
  try {
    const s: string[] = [], v: any[] = [];
    if (u.title !== undefined) { s.push('title=?'); v.push(u.title); }
    if (u.examDate !== undefined) { s.push('exam_date=?'); v.push(u.examDate); }
    if (u.targetHours !== undefined) { s.push('target_hours=?'); v.push(u.targetHours); }
    if (u.weekdayHoursTarget !== undefined) { s.push('weekday_hours_target=?'); v.push(u.weekdayHoursTarget); }
    if (u.weekendHoursTarget !== undefined) { s.push('weekend_hours_target=?'); v.push(u.weekendHoursTarget); }
    if (u.isActive !== undefined) { s.push('is_active=?'); v.push(u.isActive ? 1 : 0); }
    if (s.length === 0) return res.json({ success: true });
    s.push("updated_at=datetime('now')"); v.push(id, uid);
    await getDb().execute({ sql: `UPDATE goals SET ${s.join(',')} WHERE id=? AND user_id=?`, args: v });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

app.delete('/api/goals/:id', requireAuth, async (req, res) => {
  try { await getDb().execute({ sql: 'DELETE FROM goals WHERE id=? AND user_id=?', args: [req.params.id, (req as any).userId] }); res.json({ success: true }); }
  catch (e) { console.error(e); res.status(500).json({ message: 'Error' }); }
});

// ========== Error handler ==========
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: String(err?.message || err) });
});

export default app;
