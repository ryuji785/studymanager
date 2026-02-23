import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, CalendarDays, BookOpen, Footprints, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useBookStore } from '../stores/useBookStore';
import { useTaskStore } from '../stores/useTaskStore';
import { useGoalStore } from '../stores/useGoalStore';
import HomePage from '../pages/HomePage';
import PlanPage from '../pages/PlanPage';
import MaterialsPage from '../pages/MaterialsPage';
import HistoryPage from '../pages/HistoryPage';
import MonthlyCalendarPage from '../pages/MonthlyCalendarPage';
import SetupWizardPage from '../pages/SetupWizardPage';
import LoginPage from '../pages/LoginPage';
import '../styles/app.css';

// --- TabBar ---
function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'plan';

  const tabs = [
    { id: 'home', icon: Home, label: 'ホーム', path: '/home' },
    { id: 'plan', icon: Calendar, label: '計画表', path: '/plan' },
    { id: 'monthly', icon: CalendarDays, label: '月間', path: '/monthly' },
    { id: 'materials', icon: BookOpen, label: '本棚', path: '/materials' },
    { id: 'history', icon: Footprints, label: 'あゆみ', path: '/history' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 bg-white/95 border-t border-slate-100 pb-safe pt-1 shadow-lg z-40 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-4 lg:px-6">
        <div className="flex justify-around items-center">
          {tabs.map(({ id, icon: Icon, label, path }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors touch-manipulation active:scale-95 ${isActive
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// --- UserMenu (Header area) ---
function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 rounded-full bg-indigo-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center"
      >
        {user.picture ? (
          <img src={user.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-xs font-bold text-indigo-600">{(user.name || user.email || '?')[0]}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 w-56 animate-fade-in">
          <div className="px-2 py-1.5 mb-2">
            <p className="text-sm font-bold text-slate-800 truncate">{user.name || '名前未設定'}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={async () => { await logout(); setIsOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={14} /> ログアウト
          </button>
        </div>
      )}
    </div>
  );
}

// --- AuthenticatedLayout ---
function AuthenticatedLayout() {
  const fetchBooks = useBookStore((s) => s.fetchBooks);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const fetchGoals = useGoalStore((s) => s.fetchGoals);
  const goals = useGoalStore((s) => s.goals);
  const goalsLoading = useGoalStore((s) => s.isLoading);
  const [dataReady, setDataReady] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    Promise.all([fetchBooks(), fetchTasks(), fetchGoals()]).then(() => setDataReady(true));
  }, []);

  // Show loading while initial data is being fetched
  if (!dataReady) {
    return <LoadingScreen />;
  }

  // Show wizard if no goals exist (first time user)
  if (goals.length === 0 && !setupDone) {
    return <SetupWizardPage onComplete={() => {
      setSetupDone(true);
      fetchGoals();
      fetchBooks();
    }} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen w-full font-sans antialiased text-slate-600">
      <div className="mx-auto w-full max-w-[1200px] min-h-screen bg-slate-50 relative flex flex-col overflow-y-auto hide-scrollbar lg:shadow-2xl">
        <UserMenu />
        <main className="flex-1">
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/monthly" element={<MonthlyCalendarPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/plan" replace />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </div>
  );
}

// --- Loading Screen ---
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-sm text-slate-400 font-medium">読み込み中…</p>
    </div>
  );
}

// --- App ---
export default function App() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      {user ? <AuthenticatedLayout /> : <LoginPage />}
    </BrowserRouter>
  );
}
