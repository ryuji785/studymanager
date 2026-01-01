import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, History, Menu, Settings } from 'lucide-react';

import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { useIsMobile } from '../ui/use-mobile';
import { useAppNav, type NavKey } from './AppNavContext';

type NavItem = {
  key: NavKey;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
};

const SIDEBAR_COLLAPSED_KEY = 'study-manager:sidebar-collapsed';

export function AppChrome({
  title,
  back,
  actions,
  subHeader,
  children,
  mainClassName,
}: {
  title: string;
  back?: { label: string; onClick: () => void };
  actions?: React.ReactNode;
  subHeader?: React.ReactNode;
  children: React.ReactNode;
  mainClassName?: string;
}) {
  const isMobile = useIsMobile();
  const { activeNav, navigateToHistory, navigateToMaterials, navigateToSettings, navigateToWeeklyPlan } = useAppNav();
  const subHeaderSlot = subHeader ?? null;
  const hasSubHeader = Boolean(subHeader);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--app-chrome-sticky-top', `${height}px`);
    };

    update();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [actions, subHeader, sidebarCollapsed]);

  const navItems = useMemo<NavItem[]>(
    () => [
      { key: 'weekly', label: '週計画', icon: <CalendarDays className="w-4 h-4" />, onSelect: navigateToWeeklyPlan },
      { key: 'history', label: '学習履歴', icon: <History className="w-4 h-4" />, onSelect: navigateToHistory },
      { key: 'materials', label: '教材', icon: <BookOpen className="w-4 h-4" />, onSelect: navigateToMaterials },
      { key: 'settings', label: '設定', icon: <Settings className="w-4 h-4" />, onSelect: navigateToSettings },
    ],
    [navigateToHistory, navigateToMaterials, navigateToSettings, navigateToWeeklyPlan],
  );

  const toggleNav = () => {
    if (isMobile) {
      setMobileNavOpen(true);
      return;
    }
    setSidebarCollapsed((v) => !v);
  };

  const renderNav = (variant: 'desktop' | 'mobile') => (
    <nav className={cn('space-y-1', variant === 'desktop' ? 'p-2' : 'p-2')}>
      {navItems.map((item) => {
        const isActive = item.key === activeNav;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              item.onSelect();
              if (variant === 'mobile') setMobileNavOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-sm text-slate-700 hover:bg-slate-50',
              isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : '',
              variant === 'desktop' && sidebarCollapsed ? 'justify-center' : '',
            )}
            title={variant === 'desktop' && sidebarCollapsed ? item.label : undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-slate-500">{item.icon}</span>
            {variant === 'desktop' && sidebarCollapsed ? null : <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside
          className={cn(
            'hidden md:flex md:flex-col bg-white border-r border-slate-100',
            sidebarCollapsed ? 'w-14' : 'w-56',
          )}
        >
          <div
            className={cn(
              'h-[var(--app-header-height)] flex items-center gap-2 px-3 border-b border-slate-100',
              sidebarCollapsed ? 'justify-center' : '',
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNav}
              className="hidden md:inline-flex"
              aria-label="メニューを開く"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          {renderNav('desktop')}
        </aside>

        <div className="flex-1 min-w-0">
          <header
            ref={headerRef}
            className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="w-full px-4 md:px-6">
              <div className="h-[var(--app-header-height)] flex items-center justify-between gap-3">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleNav}
                    aria-label="メニューを開く"
                    className="md:hidden"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>

                  {back ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={back.onClick}
                        className="md:hidden"
                        aria-label={back.label}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={back.onClick} className="hidden md:inline-flex">
                        {back.label}
                      </Button>
                    </>
                  ) : null}

                  <div className="min-w-0">
                    <div className="text-base md:text-lg font-medium text-gray-900 truncate">{title}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 max-w-[60vw] overflow-x-auto">
                  {actions}
                </div>
              </div>
            </div>

            {hasSubHeader ? (
              <div className="border-t border-slate-100">
              <div className="w-full px-4 md:px-6">
                <div className="min-h-[var(--app-subheader-height)] flex items-center">
                  {subHeaderSlot}
                </div>
              </div>
            </div>
          ) : null}
          </header>

          <main>
            <div className={cn('w-full p-[var(--app-page-padding)]', mainClassName)}>
              {children}
            </div>
          </main>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-[18rem]">
          <SheetHeader className="p-4 border-b border-slate-100">
            <SheetTitle>メニュー</SheetTitle>
          </SheetHeader>
          {renderNav('mobile')}
        </SheetContent>
      </Sheet>
    </div>
  );
}

