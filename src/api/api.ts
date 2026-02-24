import type { Book, Task, Goal } from '../constants';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ---------- Dev Login Control ----------

/** VITE_ENABLE_DEV_LOGIN=true のとき、ログイン画面に開発ボタンを表示 */
export function isDevLoginEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';
}

// ---------- 共通 ----------

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
  devLogin: () => request<AuthUser>('/auth/dev-login', { method: 'POST' }),
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
