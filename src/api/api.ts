import type { Book, Task, Goal } from '../constants';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ---------- Dev Mode (localhost without backend) ----------

const DEV_LOGIN_ENABLED = import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';
const DEV_SESSION_KEY = 'sm_dev_session';
const LS_PREFIX = 'sm_dev_';

export function isDevMode(): boolean {
  return DEV_LOGIN_ENABLED && localStorage.getItem(DEV_SESSION_KEY) === '1';
}

export function isDevLoginEnabled(): boolean {
  return DEV_LOGIN_ENABLED;
}

export function setDevSession(active: boolean): void {
  if (active) {
    localStorage.setItem(DEV_SESSION_KEY, '1');
    // Seed data on first activation (when no data exists yet)
    if (!localStorage.getItem(LS_PREFIX + 'goals')) {
      import('./devSeedData').then(({ SEED_GOALS, SEED_BOOKS, SEED_TASKS }) => {
        lsSet('goals', SEED_GOALS);
        lsSet('books', SEED_BOOKS);
        lsSet('tasks', SEED_TASKS);
        console.log('[DevMode] テストデータを投入しました:', { goals: SEED_GOALS.length, books: SEED_BOOKS.length, tasks: SEED_TASKS.length });
        // Reload to pick up seed data in stores
        window.location.reload();
      });
    }
  } else {
    localStorage.removeItem(DEV_SESSION_KEY);
  }
}

// --- localStorage helpers ---
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(LS_PREFIX + key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown): void {
  localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
}
let _nextId = Date.now();
function nextId(): number { return _nextId++; }

// ---------- 共通 ----------

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // If in dev mode, use localStorage mock
  if (isDevMode()) {
    return devMockRequest<T>(path, init);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ---------- Dev Mock Router ----------

function devMockRequest<T>(path: string, init?: RequestInit): T {
  const method = (init?.method || 'GET').toUpperCase();
  const body = init?.body ? JSON.parse(init.body as string) : undefined;

  // Auth
  if (path === '/auth/me') return { id: 'dev-user', name: 'Dev User', email: 'dev@localhost' } as T;
  if (path === '/auth/logout') { setDevSession(false); return { ok: true } as T; }

  // Goals
  if (path === '/api/goals' && method === 'GET') return lsGet<Goal[]>('goals', []) as T;
  if (path === '/api/goals' && method === 'POST') {
    const goals = lsGet<Goal[]>('goals', []);
    const newGoal = { ...body, id: nextId() };
    goals.push(newGoal);
    lsSet('goals', goals);
    return newGoal as T;
  }
  if (path.startsWith('/api/goals/') && method === 'PUT') {
    const id = Number(path.split('/').pop());
    const goals = lsGet<Goal[]>('goals', []).map(g => g.id === id ? { ...g, ...body } : g);
    lsSet('goals', goals);
    return { success: true } as T;
  }
  if (path.startsWith('/api/goals/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    lsSet('goals', lsGet<Goal[]>('goals', []).filter(g => g.id !== id));
    return { success: true } as T;
  }

  // Books
  if (path === '/api/books' && method === 'GET') return lsGet<Book[]>('books', []) as T;
  if (path === '/api/books' && method === 'POST') {
    const books = lsGet<Book[]>('books', []);
    const newBook = { ...body, id: nextId() };
    books.push(newBook);
    lsSet('books', books);
    return newBook as T;
  }
  if (path.startsWith('/api/books/') && method === 'PUT') {
    const id = Number(path.split('/').pop());
    let updated: Book | undefined;
    const books = lsGet<Book[]>('books', []).map(b => {
      if (b.id === id) { updated = { ...b, ...body }; return updated; }
      return b;
    });
    lsSet('books', books);
    return (updated || {}) as T;
  }
  if (path.startsWith('/api/books/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    lsSet('books', lsGet<Book[]>('books', []).filter(b => b.id !== id));
    return { ok: true } as T;
  }

  // Tasks
  if (path.startsWith('/api/tasks') && method === 'GET') return lsGet<Task[]>('tasks', []) as T;
  if (path === '/api/tasks' && method === 'POST') {
    const tasks = lsGet<Task[]>('tasks', []);
    const newTask = { ...body, id: nextId() };
    tasks.push(newTask);
    lsSet('tasks', tasks);
    return newTask as T;
  }
  if (path.startsWith('/api/tasks/') && method === 'PUT') {
    const id = Number(path.split('/').pop());
    let updated: Task | undefined;
    const tasks = lsGet<Task[]>('tasks', []).map(t => {
      if (t.id === id) { updated = { ...t, ...body }; return updated; }
      return t;
    });
    lsSet('tasks', tasks);
    return (updated || {}) as T;
  }
  if (path.startsWith('/api/tasks/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    lsSet('tasks', lsGet<Task[]>('tasks', []).filter(t => t.id !== id));
    return { ok: true } as T;
  }

  throw new ApiError(404, `Dev mock: unknown route ${method} ${path}`);
}

// ---------- Auth ----------

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

export const authApi = {
  me: () => request<AuthUser>('/auth/me'),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  /** Google OAuth のエントリポイント URL */
  googleLoginUrl: `${BASE_URL}/auth/google`,
};

// ---------- Books ----------

type BookCreate = Omit<Book, 'id'>;
type BookUpdate = Partial<Omit<Book, 'id'>>;

export const booksApi = {
  list: () => request<Book[]>('/api/books'),
  create: (data: BookCreate) => request<Book>('/api/books', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: BookUpdate) => request<Book>(`/api/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<{ ok: boolean }>(`/api/books/${id}`, { method: 'DELETE' }),
};

// ---------- Tasks ----------

type TaskCreate = Omit<Task, 'id'>;
type TaskUpdate = Partial<Omit<Task, 'id'>>;

export const tasksApi = {
  list: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request<Task[]>(`/api/tasks${qs ? `?${qs}` : ''}`);
  },
  create: (data: TaskCreate) => request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: TaskUpdate) => request<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<{ ok: boolean }>(`/api/tasks/${id}`, { method: 'DELETE' }),
};

// ---------- Goals ----------

type GoalCreate = Omit<Goal, 'id'>;
type GoalUpdate = Partial<Omit<Goal, 'id'>>;

export const goalsApi = {
  list: () => request<Goal[]>('/api/goals'),
  create: (data: GoalCreate) => request<Goal & { id: number }>('/api/goals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: GoalUpdate) => request<{ success: boolean }>(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<{ success: boolean }>(`/api/goals/${id}`, { method: 'DELETE' }),
};

