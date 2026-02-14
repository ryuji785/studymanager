import React from 'react';

export type NavKey = 'home' | 'plan' | 'materials' | 'history';

export type SettingsFocus = 'goal';

export type AppNavContextValue = {
  activeNav: NavKey;
  navigateToHome: () => void;
  navigateToPlan: () => void;
  navigateToMaterials: () => void;
  navigateToHistory: () => void;
  navigateToSettings: (focus?: SettingsFocus) => void;
};

const AppNavContext = React.createContext<AppNavContextValue | null>(null);

export function AppNavProvider({
  value,
  children,
}: {
  value: AppNavContextValue;
  children: React.ReactNode;
}) {
  return <AppNavContext.Provider value={value}>{children}</AppNavContext.Provider>;
}

export function useAppNav(): AppNavContextValue {
  const ctx = React.useContext(AppNavContext);
  if (!ctx) {
    throw new Error('useAppNav must be used within <AppNavProvider>.');
  }
  return ctx;
}
