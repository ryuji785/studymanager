import React from 'react';
import { Target } from 'lucide-react';
import { authApi } from '../api/api';
import { useAuthStore } from '../stores/useAuthStore';

export default function LoginPage() {
  const devLogin = useAuthStore((s) => s.devLogin);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo / Icon */}
        <img
          src="/studymanager-icon.png"
          alt="StudyManager icon"
          className="w-24 h-24 rounded-[2rem] shadow-2xl shadow-indigo-500/30 mb-8 border border-white/10"
        />

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">StudyManager</h1>
        <p className="text-indigo-200 text-sm text-center leading-relaxed mb-10 max-w-[280px]">
          計画的に学習を積み上げて、目標達成を加速させましょう。
        </p>

        {/* Login Card */}
        <div className="w-full bg-white/10 backdrop-blur-lg border border-white/15 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">ログイン</h2>
          <p className="text-xs text-indigo-200 mb-6">Google アカウントで続けましょう</p>

          {error && (
            <div className="mb-4 bg-rose-500/20 border border-rose-400/30 rounded-xl px-4 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          )}

          <a
            href={authApi.googleLoginUrl}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white text-slate-700 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.2 24.2 0 000 21.56l7.98-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            Google で続ける
          </a>

          {/* 開発モード用ログインボタン */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={devLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-200 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              🛠 開発モードで続ける
            </button>
            <p className="text-[11px] text-indigo-300/40 text-center mt-2">
              Google OAuth 未設定時のみ使用
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-indigo-300/50 text-xs mt-10">
          © 2026 StudyManager
        </p>
      </div>
    </div>
  );
}
