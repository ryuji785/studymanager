import { create } from 'zustand';
import { authApi, type AuthUser, ApiError, isDevMode, isDevLoginEnabled, setDevSession } from '../api/api';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  devLogin: () => Promise<void>;
}

const DEV_USER: AuthUser = { id: 'dev-user', name: 'Dev User', email: 'dev@localhost' };

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    if (isDevMode()) {
      set({ user: DEV_USER, isLoading: false });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, isLoading: false });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        set({ user: null, isLoading: false });
      } else {
        set({ user: null, isLoading: false, error: 'サーバーとの通信に失敗しました' });
      }
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setDevSession(false);
    set({ user: null });
  },

  devLogin: async () => {
    set({ isLoading: true, error: null });
    if (isDevLoginEnabled()) {
      setDevSession(true);
      set({ user: DEV_USER, isLoading: false });
      return;
    }
    // Fallback: server-based dev login
    try {
      const res = await fetch('/auth/dev-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Dev login failed');
      const user = await res.json();
      set({ user, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: '開発ログインに失敗しました' });
    }
  },
}));

