import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addWeeks, parseISO } from 'date-fns';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import type { AppData, PlanWeek } from './types';
import { loadAppData, saveAppData } from './data/appDataStore';
import { formatIsoDate } from './utils/date';
import { getWeekRange } from './utils/week';
import { AppNavProvider, type NavKey, type SettingsFocus } from './components/layout/AppNavContext';
import { Toaster } from './components/ui/sonner';
import { WeeklyPlanSkeleton } from './components/states/Skeletons';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { HomePage } from './components/HomePage';
import { PlanPage } from './components/PlanPage';
import { StockListPage } from './components/StockListPage';
import { LogPage } from './components/LogPage';
import { SettingsPage } from './components/SettingsPage';

type View = 'home' | 'plan' | 'materials' | 'history' | 'settings';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const isServerAuthEnabled = Boolean(API_BASE_URL);

const VIEW_PATHS: Record<View, string> = {
  home: '/home',
  plan: '/plan',
  materials: '/materials',
  history: '/history',
  settings: '/settings',
};

function getViewFromParam(value?: string): View | null {
  if (value === 'home') return 'home';
  if (value === 'plan') return 'plan';
  if (value === 'materials') return 'materials';
  if (value === 'history') return 'history';
  if (value === 'settings') return 'settings';
  return null;
}

function AppContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { view: routeViewParam } = useParams<{ view?: string }>();

  const routeView = useMemo(() => getViewFromParam(routeViewParam), [routeViewParam]);
  const view: View = routeView ?? 'home';

  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dataError, setDataError] = useState<string | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);

  const settingsFocus = useMemo<SettingsFocus | null>(() => {
    const value = new URLSearchParams(location.search).get('focus');
    return value === 'goal' ? 'goal' : null;
  }, [location.search]);

  const currentWeek = useMemo(() => getWeekRange(new Date()), []);
  const [planPeriod, setPlanPeriod] = useState({ start: currentWeek.weekStart, end: currentWeek.weekEnd });
  const [historyPeriod, setHistoryPeriod] = useState(() => ({
    start: formatIsoDate(addWeeks(parseISO(currentWeek.weekStart), -8)),
    end: currentWeek.weekEnd,
  }));

  const homePeriod = useMemo(() => {
    const current = getWeekRange(new Date());
    return { start: current.weekStart, end: current.weekEnd };
  }, [view]);

  const activeNav = useMemo<NavKey>(() => {
    if (view === 'plan') return 'plan';
    if (view === 'materials') return 'materials';
    if (view === 'history') return 'history';
    return 'home';
  }, [view]);

  const navigateToHome = useCallback(() => navigate(VIEW_PATHS.home), [navigate]);
  const navigateToPlan = useCallback(() => navigate(VIEW_PATHS.plan), [navigate]);
  const navigateToMaterials = useCallback(() => navigate(VIEW_PATHS.materials), [navigate]);
  const navigateToHistory = useCallback(() => navigate(VIEW_PATHS.history), [navigate]);
  const navigateToSettings = useCallback(
    (focus?: SettingsFocus) => {
      const safeFocus = focus === 'goal' ? 'goal' : null;
      navigate(safeFocus ? `${VIEW_PATHS.settings}?focus=${safeFocus}` : VIEW_PATHS.settings);
    },
    [navigate],
  );

  const updateAppData = useCallback((updater: (prev: AppData) => AppData) => {
    setAppData((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  }, []);

  const reloadData = useCallback(() => {
    setDataStatus('loading');
    setDataError(null);
    try {
      const next = loadAppData();
      setAppData(next);
      setDataStatus('ready');
    } catch (error) {
      console.error(error);
      setDataError(error instanceof Error ? error.message : 'データの読み込みに失敗しました。');
      setDataStatus('error');
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (isServerAuthEnabled && !isAuthenticated) return;
    reloadData();
  }, [isAuthLoading, isAuthenticated, reloadData]);

  useEffect(() => {
    if (routeView) return;
    navigate(VIEW_PATHS.home, { replace: true });
  }, [navigate, routeView]);

  useEffect(() => {
    if (!appData) return;
    if (view === 'settings') return;
    if (appData.lifestyleTemplate) return;
    navigate(`${VIEW_PATHS.settings}?onboarding=1`, { replace: true });
  }, [appData, navigate, view]);

  useEffect(() => {
    if (!user || !appData || appData.userName || !user.name) return;
    updateAppData((prev) => ({ ...prev, userName: user.name }));
  }, [appData, updateAppData, user]);

  if (dataStatus === 'loading') return <WeeklyPlanSkeleton />;

  if (dataStatus === 'error' || !appData) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base text-slate-700">読み込みエラー</h2>
          <p className="mt-2 text-sm text-slate-500">{dataError ?? 'データを読み込めませんでした。'}</p>
          <button
            type="button"
            onClick={reloadData}
            className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white transition-colors hover:bg-sky-700"
          >
            再読み込み
          </button>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <AppNavProvider
      value={{
        activeNav,
        navigateToHome,
        navigateToPlan,
        navigateToMaterials,
        navigateToHistory,
        navigateToSettings,
      }}
    >
      {view === 'home' ? (
        <HomePage
          data={appData}
          period={homePeriod}
          onUpdateData={updateAppData}
          onNavigatePlan={navigateToPlan}
          onNavigateSettings={() => navigateToSettings()}
        />
      ) : null}

      {view === 'plan' ? (
        <PlanPage
          data={appData}
          period={planPeriod}
          onChangePeriod={setPlanPeriod}
          onUpdateData={updateAppData}
          onNavigateMaterials={navigateToMaterials}
          onNavigateSettings={() => navigateToSettings()}
        />
      ) : null}

      {view === 'materials' ? <StockListPage data={appData} onUpdateData={updateAppData} /> : null}

      {view === 'history' ? (
        <LogPage
          data={appData}
          period={historyPeriod}
          onChangePeriod={setHistoryPeriod}
          onOpenWeek={(week: PlanWeek) => {
            setPlanPeriod({ start: week.weekStartDate, end: week.weekEndDate });
            navigateToPlan();
            toast.message('この週の計画表を開きました');
          }}
          onNavigatePlan={navigateToPlan}
        />
      ) : null}

      {view === 'settings' ? (
        <SettingsPage
          data={appData}
          onUpdateData={updateAppData}
          focusSection={settingsFocus}
          onNavigateHome={navigateToHome}
        />
      ) : null}

      <Toaster />
    </AppNavProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to={VIEW_PATHS.home} replace />} />
            <Route path="/:view" element={<AppContent />} />
          </Route>
          <Route path="*" element={<Navigate to={VIEW_PATHS.home} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
