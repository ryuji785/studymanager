import { create } from 'zustand';
import { authApi, type AuthUser, ApiError } from '../api/api';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  devLogin: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
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
    set({ user: null });
  },

  devLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.devLogin();
      set({ user, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: '開発ログインに失敗しました。バックエンドが起動しているか確認してください。' });
    }
  },
}));
