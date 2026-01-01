import React from 'react';

export type NavKey = 'weekly' | 'today' | 'history' | 'materials' | 'settings';

export type AppNavContextValue = {
  activeNav: NavKey;
  navigateToToday: () => void;
  navigateToWeeklyPlan: () => void;
  navigateToHistory: () => void;
  navigateToMaterials: () => void;
  navigateToSettings: () => void;
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
