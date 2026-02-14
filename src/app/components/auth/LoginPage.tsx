import React, { useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from './AuthContext';
import { Button } from '../ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const isServerAuthEnabled = Boolean(API_BASE_URL);

export function LoginPage() {
  const { isAuthenticated, isLoading, signIn } = useAuth();

  const loginTitle = useMemo(() => {
    if (isServerAuthEnabled) return 'Googleでログイン';
    return 'モックログイン';
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    // 既にログイン済みの場合はトップに戻す。
    window.history.replaceState(null, '', '/');
  }, [isAuthenticated]);

  if (isLoading) {
    // 認証状態が未確定の間は描画を止める。
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-border text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Study Manager</p>
          <h1 className="text-2xl font-bold text-foreground">{loginTitle}</h1>
        </div>
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              void signIn();
            }}
          >
            {isServerAuthEnabled ? 'Googleログイン' : 'ログイン（モック）'}
          </Button>
          {!isServerAuthEnabled ? (
            <p className="text-sm text-muted-foreground">
              現在はモックログインです。ボタン押下で認証済みとして扱います。
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
