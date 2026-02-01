import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from './AuthContext';
import { Button } from '../ui/button';
import { loadGoogleIdentityScript, parseGoogleCredential } from '../../runtime/googleAuth';
import { setStoredSession } from '../../runtime/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const isServerAuthEnabled = Boolean(API_BASE_URL);
const isClientAuthEnabled = Boolean(GOOGLE_CLIENT_ID);

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const loginTitle = useMemo(() => {
    if (isServerAuthEnabled) return 'Googleでログイン';
    if (isClientAuthEnabled) return 'Googleアカウントでログイン';
    return 'ログイン';
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    // 既にログイン済みの場合はトップに戻す。
    window.history.replaceState(null, '', '/');
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isClientAuthEnabled) return;
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) return;
        if (!buttonRef.current) return;
        if (!window.google?.accounts?.id) {
          setClientError('Googleログインの初期化に失敗しました。');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (!response.credential) {
              setClientError('Google認証に失敗しました。');
              return;
            }
            const profile = parseGoogleCredential(response.credential);
            if (!profile) {
              setClientError('Google認証の解析に失敗しました。');
              return;
            }

            setStoredSession({
              provider: 'google',
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              avatarUrl: profile.picture,
            });
            window.location.assign('/');
          },
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 360,
          shape: 'pill',
        });
      })
      .catch((error) => {
        console.error(error);
        setClientError('Googleログインの読み込みに失敗しました。');
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
          {isClientAuthEnabled ? <div ref={buttonRef} className="flex justify-center" /> : null}
          {isServerAuthEnabled ? (
            <Button
              className="w-full"
              onClick={() => {
                // サーバー側でCSRF対策したOAuth認可フローに遷移する。
                window.location.assign(`${API_BASE_URL}/auth/google`);
              }}
            >
              Googleログイン
            </Button>
          ) : null}
          {!isClientAuthEnabled && !isServerAuthEnabled ? (
            <p className="text-sm text-muted-foreground">
              ログイン設定が未構成です。管理者に環境変数の設定を依頼してください。
            </p>
          ) : null}
          {clientError ? <p className="text-sm text-destructive">{clientError}</p> : null}
        </div>
      </div>
    </div>
  );
}
