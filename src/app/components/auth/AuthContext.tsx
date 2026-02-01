import React, { createContext, useContext, useMemo, useState } from 'react';

import type { AuthSession } from '../../runtime/authStorage';
import { clearStoredSession, getStoredSession, setStoredSession } from '../../runtime/authStorage';

type AuthContextValue = {
  session: AuthSession | null;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      signIn: (nextSession) => {
        setSession(nextSession);
        setStoredSession(nextSession);
      },
      signOut: () => {
        setSession(null);
        clearStoredSession();
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
