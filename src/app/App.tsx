import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { addWeeks, parseISO } from 'date-fns';
import { toast } from 'sonner';

import type { AppData, PlanWeek } from './types';
import { AppNavProvider, type NavKey, type SettingsFocus } from './components/layout/AppNavContext';
import { WeeklyPlanPage } from './components/WeeklyPlanPage';
import { TodayPage } from './components/TodayPage';
import { MaterialsPage } from './components/MaterialsPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { MyPage } from './components/MyPage';
import { Toaster } from './components/ui/sonner';
import { StateCard } from './components/states/StateCard';
import { WeeklyPlanSkeleton } from './components/states/Skeletons';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { PrivateRoute } from './components/auth/PrivateRoute';

import { loadAppData, saveAppData } from './data/appDataStore';
import { getWeekRange } from './utils/week';
import { formatIsoDate } from './utils/date';

type View = 'mypage' | 'weekly' | 'today' | 'history' | 'materials' | 'settings';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const isServerAuthEnabled = Boolean(API_BASE_URL);
const VIEW_PATHS: Record<View, string> = {
  mypage: '/mypage',
  weekly: '/weekly',
  today: '/today',
  history: '/history',
  materials: '/materials',
  settings: '/settings',
};

function getViewFromParam(value?: string): View | null {
  if (value === 'mypage') return 'mypage';
  if (value === 'weekly') return 'weekly';
  if (value === 'today') return 'today';
  if (value === 'history') return 'history';
  if (value === 'materials') return 'materials';
  if (value === 'settings') return 'settings';
  return null;
}

function AppContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { view: routeViewParam } = useParams<{ view?: string }>();

  const routeView = useMemo(() => getViewFromParam(routeViewParam), [routeViewParam]);
  const view = routeView ?? 'weekly';

  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dataError, setDataError] = useState<string | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);

  const settingsFocus = useMemo<SettingsFocus | null>(() => {
    try {
      const focus = new URLSearchParams(location.search).get('focus');
      return focus === 'goal' ? 'goal' : null;
    } catch {
      return null;
    }
  }, [location.search]);

  const currentWeek = useMemo(() => getWeekRange(new Date()), []);
  const [period, setPeriod] = useState({ start: currentWeek.weekStart, end: currentWeek.weekEnd });
  const todayPeriod = useMemo(() => {
    const { weekStart, weekEnd } = getWeekRange(new Date());
    return { start: weekStart, end: weekEnd };
  }, [view]);
  const [historyPeriod, setHistoryPeriod] = useState(() => ({
    start: formatIsoDate(addWeeks(parseISO(currentWeek.weekStart), -8)),
    end: currentWeek.weekEnd,
  }));

  const activeNav = useMemo<NavKey>(() => view, [view]);

  const navigateToMyPage = useCallback(() => navigate(VIEW_PATHS.mypage), [navigate]);
  const navigateToToday = useCallback(() => navigate(VIEW_PATHS.today), [navigate]);
  const navigateToWeeklyPlan = useCallback(() => navigate(VIEW_PATHS.weekly), [navigate]);
  const navigateToHistory = useCallback(() => navigate(VIEW_PATHS.history), [navigate]);
  const navigateToMaterials = useCallback(() => navigate(VIEW_PATHS.materials), [navigate]);
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
      setDataError(error instanceof Error ? error.message : '読み込みに失敗しました');
      setDataStatus('error');
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (isServerAuthEnabled && !isAuthenticated) return;
    reloadData();
  }, [isAuthLoading, isAuthenticated, reloadData]);

  useEffect(() => {
    if (!routeView) {
      navigate(VIEW_PATHS.weekly, { replace: true });
    }
  }, [navigate, routeView]);

  useEffect(() => {
    if (!user || !appData || appData.userName || !user.name) return;
    updateAppData((prev) => ({ ...prev, userName: user.name }));
  }, [appData, updateAppData, user]);

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
        navigateToMyPage,
        navigateToToday,
        navigateToWeeklyPlan,
        navigateToHistory,
        navigateToMaterials,
        navigateToSettings,
      }}
    >
      {view === 'mypage' && (
        <MyPage
          data={appData}
          onNavigateSettings={navigateToSettings}
          onNavigateWeekly={navigateToWeeklyPlan}
          onNavigateToday={navigateToToday}
          onNavigateMaterials={navigateToMaterials}
        />
      )}

      {view === 'today' && (
        <TodayPage
          data={appData}
          period={todayPeriod}
          onUpdateData={updateAppData}
          onNavigateWeekly={navigateToWeeklyPlan}
        />
      )}

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
            navigateToWeeklyPlan();
            toast.message('週計画を開きました');
          }}
          onNavigateWeekly={navigateToWeeklyPlan}
        />
      )}

      {view === 'settings' && (
        <SettingsPage
          data={appData}
          onUpdateData={updateAppData}
          focusSection={settingsFocus}
        />
      )}

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
            <Route path="/" element={<Navigate to={VIEW_PATHS.weekly} replace />} />
            <Route path="/:view" element={<AppContent />} />
          </Route>
          <Route path="*" element={<Navigate to={VIEW_PATHS.weekly} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
