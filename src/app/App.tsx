import React, { useEffect, useMemo, useState } from 'react';
import { addWeeks, parseISO } from 'date-fns';
import { toast } from 'sonner';

import type { AppData, PlanWeek } from './types';
import { AppNavProvider, type NavKey } from './components/layout/AppNavContext';
import { WeeklyPlanPage } from './components/WeeklyPlanPage';
import { MaterialsPage } from './components/MaterialsPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { Toaster } from './components/ui/sonner';
import { StateCard } from './components/states/StateCard';
import { WeeklyPlanSkeleton } from './components/states/Skeletons';

import { loadAppData, saveAppData } from './data/appDataStore';
import { getWeekRange } from './utils/week';
import { formatIsoDate } from './utils/date';

type View = 'weekly' | 'history' | 'materials' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('weekly');
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dataError, setDataError] = useState<string | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);

  const currentWeek = useMemo(() => getWeekRange(new Date()), []);
  const [period, setPeriod] = useState({ start: currentWeek.weekStart, end: currentWeek.weekEnd });
  const [historyPeriod, setHistoryPeriod] = useState(() => ({
    start: formatIsoDate(addWeeks(parseISO(currentWeek.weekStart), -8)),
    end: currentWeek.weekEnd,
  }));

  const activeNav = useMemo<NavKey>(() => {
    if (view === 'materials') return 'materials';
    if (view === 'settings') return 'settings';
    if (view === 'history') return 'history';
    return 'weekly';
  }, [view]);

  const navigateToWeeklyPlan = () => setView('weekly');
  const navigateToHistory = () => setView('history');
  const navigateToMaterials = () => setView('materials');
  const navigateToSettings = () => setView('settings');

  const updateAppData = (updater: (prev: AppData) => AppData) => {
    setAppData((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  };

  const reloadData = () => {
    setDataStatus('loading');
    setDataError(null);
    try {
      const next = loadAppData();
      setAppData(next);
      setDataStatus('ready');
    } catch (error) {
      console.error(error);
      setDataError(error instanceof Error ? error.message : '読み込みに失敗しました');
      setDataStatus('error');
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  if (dataStatus === 'loading') {
    return <WeeklyPlanSkeleton />;
  }

  if (dataStatus === 'error' || !appData) {
    return (
      <div className="min-h-screen bg-muted/30 p-[var(--app-page-padding)]">
        <div className="max-w-xl mx-auto">
          <StateCard
            tone="danger"
            title="読み込みに失敗しました"
            description={dataError ?? '保存データの読み込みに失敗しました。'}
            actions={[
              { label: '再読み込み', onClick: reloadData },
            ]}
          />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <AppNavProvider
      value={{
        activeNav,
        navigateToWeeklyPlan,
        navigateToHistory,
        navigateToMaterials,
        navigateToSettings,
      }}
    >
      {view === 'weekly' && (
        <WeeklyPlanPage
          data={appData}
          period={period}
          onChangePeriod={setPeriod}
          onUpdateData={updateAppData}
          onNavigateSettings={navigateToSettings}
          onNavigateMaterials={navigateToMaterials}
        />
      )}

      {view === 'materials' && (
        <MaterialsPage
          data={appData}
          onUpdateData={updateAppData}
        />
      )}

      {view === 'history' && (
        <HistoryPage
          data={appData}
          period={historyPeriod}
          onChangePeriod={setHistoryPeriod}
          onSelectWeek={(week: PlanWeek) => {
            setPeriod({ start: week.weekStartDate, end: week.weekEndDate });
            setView('weekly');
            toast.message('週計画を開きました');
          }}
          onNavigateWeekly={navigateToWeeklyPlan}
        />
      )}

      {view === 'settings' && (
        <SettingsPage
          data={appData}
          onUpdateData={updateAppData}
        />
      )}

      <Toaster />
    </AppNavProvider>
  );
}

