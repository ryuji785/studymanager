import React, { useMemo } from 'react';
import { BookOpen, CalendarDays, Footprints, Home, Settings } from 'lucide-react';

import { cn } from '../ui/utils';
import { UI_TEXT } from '../../constants/strings';
import { useAppNav, type NavKey } from './AppNavContext';

type TabItem = {
  key: NavKey;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
};

export function AppChrome({
  title,
  actions,
  subHeader,
  children,
  mainClassName,
  showSettings = false,
  hideBottomNav = false,
}: {
  title: string;
  actions?: React.ReactNode;
  subHeader?: React.ReactNode;
  children: React.ReactNode;
  mainClassName?: string;
  showSettings?: boolean;
  hideBottomNav?: boolean;
}) {
  const {
    activeNav,
    navigateToHome,
    navigateToPlan,
    navigateToMaterials,
    navigateToHistory,
    navigateToSettings,
  } = useAppNav();

  const tabs = useMemo<TabItem[]>(
    () => [
      { key: 'home', label: UI_TEXT.NAV_HOME, icon: <Home className="h-4 w-4" />, onSelect: navigateToHome },
      { key: 'plan', label: UI_TEXT.NAV_PLAN, icon: <CalendarDays className="h-4 w-4" />, onSelect: navigateToPlan },
      {
        key: 'materials',
        label: UI_TEXT.NAV_MATERIALS,
        icon: <BookOpen className="h-4 w-4" />,
        onSelect: navigateToMaterials,
      },
      {
        key: 'history',
        label: UI_TEXT.NAV_HISTORY,
        icon: <Footprints className="h-4 w-4" />,
        onSelect: navigateToHistory,
      },
    ],
    [navigateToHistory, navigateToHome, navigateToMaterials, navigateToPlan],
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f9fdff_0%,#f7fafc_44%,#ffffff_100%)]">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/92 backdrop-blur-sm">
        <div className="mx-auto flex h-[56px] w-full max-w-[var(--app-content-max)] items-center gap-2 px-4">
          <h1 className="min-w-0 flex-1 truncate text-[18px] font-medium text-slate-700">{title}</h1>
          {actions}
          {showSettings ? (
            <button
              type="button"
              aria-label={UI_TEXT.LABEL_SETTINGS}
              onClick={() => navigateToSettings()}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <Settings className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        {subHeader ? (
          <div className="border-t border-slate-100/80">
            <div className="mx-auto w-full max-w-[var(--app-content-max)] px-4 py-2">{subHeader}</div>
          </div>
        ) : null}
      </header>

      <main className={cn('pb-[92px] pt-4', hideBottomNav ? 'pb-6' : '', mainClassName)}>
        <div className="mx-auto w-full max-w-[var(--app-content-max)] px-4">{children}</div>
      </main>

      {!hideBottomNav ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto grid h-[76px] w-full max-w-[var(--app-content-max)] grid-cols-4 px-2 pb-[max(env(safe-area-inset-bottom),0px)]">
            {tabs.map((tab) => {
              const isActive = tab.key === activeNav;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={tab.onSelect}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] transition-colors',
                    isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600',
                  )}
                >
                  <span className={cn('rounded-full p-1.5', isActive ? 'bg-sky-100' : '')}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
