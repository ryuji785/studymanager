import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearStoredSession, getStoredSession } from '../../runtime/authStorage';

type AuthUser = {
  name?: string;
  email?: string;
  picture?: string;
};

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const isServerAuthEnabled = Boolean(API_BASE_URL);
const isClientAuthEnabled = Boolean(GOOGLE_CLIENT_ID);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    if (isServerAuthEnabled) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        });
        if (!response.ok) {
          setUser(null);
          return;
        }
        const payload = (await response.json()) as AuthUser;
        setUser(payload);
      } catch (error) {
        console.error('Auth check failed.', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isClientAuthEnabled) {
      const stored = getStoredSession();
      if (!stored) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setUser({
        name: stored.name,
        email: stored.email,
        picture: stored.avatarUrl,
      });
      setIsLoading(false);
      return;
    }

    setUser(null);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    if (isServerAuthEnabled) {
      // ログアウト時にサーバー側セッションも破棄して安全性を担保する。
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Logout failed.', error);
      } finally {
        setUser(null);
      }
      return;
    }

    clearStoredSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      isLoading,
      isAuthenticated: Boolean(user),
      user,
      refresh,
      signOut,
    };
  }, [isLoading, refresh, signOut, user]);

  useEffect(() => {
    // 初回ロード時に /auth/me を叩き、ログイン状態が確定するまで描画を止める。
    refresh();
  }, [refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
