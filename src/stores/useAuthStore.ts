import { create } from 'zustand';
import { authApi, type AuthUser, ApiError, isDevMode, setDevSession } from '../api/api';

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
    // If dev session is active on localhost, return mock user immediately
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
    // On localhost: set dev session flag and use mock user (no backend needed)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      setDevSession(true);
      set({ user: DEV_USER, isLoading: false });
      return;
    }
    // Non-localhost: try server-based dev login
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

