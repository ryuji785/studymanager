export type AuthSession = {
  provider: 'google';
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
};

const AUTH_STORAGE_KEY = 'study-manager.auth.session.v1';

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch (error) {
    console.warn('Auth session load failed.', error);
    return null;
  }
}

export function setStoredSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Auth session save failed.', error);
  }
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn('Auth session clear failed.', error);
  }
}
