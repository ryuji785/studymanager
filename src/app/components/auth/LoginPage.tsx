import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { AuthSession } from '../../runtime/authStorage';
import { loadGoogleIdentityScript, parseGoogleCredential } from '../../runtime/googleAuth';
import { Button } from '../ui/button';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Status = 'idle' | 'loading' | 'ready' | 'error';

type LoginPageProps = {
  onSignedIn: (session: AuthSession) => void;
};

export function LoginPage({ onSignedIn }: LoginPageProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  const canRenderButton = status === 'ready' && Boolean(GOOGLE_CLIENT_ID);
  const helperMessage = useMemo(() => {
    if (GOOGLE_CLIENT_ID) return null;
    return 'Googleログインを有効にするには .env に VITE_GOOGLE_CLIENT_ID を設定してください。';
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setStatus('error');
      return;
    }

    let isMounted = true;

    setStatus('loading');
    loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted) return;
        const googleAccounts = window.google?.accounts?.id;
        if (!googleAccounts) {
          setStatus('error');
          setErrorMessage('Googleログインの初期化に失敗しました。');
          return;
        }

        googleAccounts.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (!response.credential) {
              setErrorMessage('Google認証のレスポンスが取得できませんでした。');
              return;
            }
            const profile = parseGoogleCredential(response.credential);
            if (!profile?.sub) {
              setErrorMessage('Googleプロフィールの解析に失敗しました。');
              return;
            }
            onSignedIn({
              provider: 'google',
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              avatarUrl: profile.picture,
            });
          },
        });

        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          googleAccounts.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            width: 280,
            shape: 'pill',
          });
        }

        setStatus('ready');
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(error.message || 'Googleログインの読み込みに失敗しました。');
      });

    return () => {
      isMounted = false;
    };
  }, [onSignedIn]);

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg border border-border">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Study Manager</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Googleアカウントでログイン</h1>
          <p className="text-sm text-muted-foreground">
            学習計画を安全に管理するため、Googleアカウントでの認証に統一しました。
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div
            ref={buttonRef}
            className={canRenderButton ? 'flex justify-center' : 'hidden'}
          />

          {status !== 'ready' ? (
            <Button className="w-full" variant="outline" disabled>
              Googleログインを準備中…
            </Button>
          ) : null}

          {helperMessage ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              {helperMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-8 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">ご利用の流れ</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Googleでログイン</li>
            <li>学習計画を作成・更新</li>
            <li>進捗を記録して可視化</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
