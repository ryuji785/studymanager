import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { AppData, LifestyleTemplate } from '../types';
import { createDefaultLifestyleTemplate } from '../data/appDataStore';
import { computeAvailableMinutes } from '../utils/plan';
import { UI_TEXT } from '../constants/strings';
import { AppChrome } from './layout/AppChrome';
import { LifestyleForm } from './LifestyleForm';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

function normalizeDateInput(value?: string) {
  if (!value) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function normalizeTemplate(template?: LifestyleTemplate): LifestyleTemplate {
  const base = createDefaultLifestyleTemplate();
  if (!template) return base;

  return {
    ...base,
    ...template,
    weekdaySleep: {
      startTime: Number.isFinite(template.weekdaySleep?.startTime) ? template.weekdaySleep.startTime : base.weekdaySleep.startTime,
      endTime: Number.isFinite(template.weekdaySleep?.endTime) ? template.weekdaySleep.endTime : base.weekdaySleep.endTime,
    },
    optionalBlocks: Array.isArray(template.optionalBlocks) ? template.optionalBlocks : [],
  };
}

export function SettingsPage({
  data,
  onUpdateData,
  focusSection,
  onNavigateHome,
}: {
  data: AppData;
  onUpdateData: (updater: (prev: AppData) => AppData) => void;
  focusSection?: 'goal' | null;
  onNavigateHome?: () => void;
}) {
  const [draft, setDraft] = useState<LifestyleTemplate>(() => normalizeTemplate(data.lifestyleTemplate));
  const [userName, setUserName] = useState(data.userName ?? '');
  const [themeTitle, setThemeTitle] = useState(data.userGoalTitle ?? '');
  const [themeDeadline, setThemeDeadline] = useState(normalizeDateInput(data.userGoalDeadline));
  const [introOpen, setIntroOpen] = useState(false);
  const [introText, setIntroText] = useState('');

  const themeRef = useRef<HTMLDivElement | null>(null);
  const isFirstSetup = !data.lifestyleTemplate;
  const todayIso = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setDraft(normalizeTemplate(data.lifestyleTemplate));
    setUserName(data.userName ?? '');
    setThemeTitle(data.userGoalTitle ?? '');
    setThemeDeadline(normalizeDateInput(data.userGoalDeadline));
  }, [data.lifestyleTemplate, data.userGoalDeadline, data.userGoalTitle, data.userName]);

  useEffect(() => {
    if (focusSection !== 'goal') return;
    themeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusSection]);

  const availableMinutes = useMemo(() => computeAvailableMinutes(draft), [draft]);
  const lifestyleReady = draft.weekdaySleep.startTime !== draft.weekdaySleep.endTime;

  const save = () => {
    if (!lifestyleReady) return;

    onUpdateData((prev) => ({
      ...prev,
      lifestyleTemplate: { ...draft, updatedAt: new Date().toISOString() },
      userName: userName.trim() || undefined,
      userGoalTitle: themeTitle.trim() || undefined,
      userGoalDeadline: themeDeadline || undefined,
    }));

    if (isFirstSetup) {
      setIntroText(`今週は ${formatDuration(availableMinutes)} も自由時間があります！`);
      setIntroOpen(true);
      return;
    }
  };

  return (
    <AppChrome title={UI_TEXT.LABEL_SETTINGS} hideBottomNav>
      <div className="space-y-4 pb-4">
        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-700">まずは生活時間を決めましょう</p>
              <p className="text-xs text-slate-500">完璧な計画より、続けやすい余白をつくる設定です。</p>
            </div>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700"
            >
              保存
            </button>
          </div>
          <div className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
            設定から見た自由時間: {lifestyleReady ? formatDuration(availableMinutes) : '未設定'}
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm text-slate-700">生活時間</h2>
          <p className="mb-3 text-xs text-slate-500">睡眠時間と固定予定を先に入れると、計画がぐっと楽になります。</p>
          <LifestyleForm value={draft} categories={data.categories} onChange={(next) => setDraft(normalizeTemplate(next))} />
        </section>

        <section ref={themeRef} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm text-slate-700">{UI_TEXT.LABEL_WEEK_THEME}・プロフィール</h2>
          <p className="mb-3 text-xs text-slate-500">必要なときだけ、ゆるく設定してください。</p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-600">
              表示名
              <input
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                placeholder="例: さくら"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-300"
              />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              {UI_TEXT.LABEL_WEEK_THEME}
              <input
                value={themeTitle}
                onChange={(event) => setThemeTitle(event.target.value)}
                placeholder="例: 毎日20分だけ続ける"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-300"
              />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              期限（任意）
              <input
                type="date"
                min={todayIso}
                value={themeDeadline}
                onChange={(event) => setThemeDeadline(normalizeDateInput(event.target.value))}
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-300"
              />
            </label>
          </div>
        </section>
      </div>

      <Dialog open={introOpen} onOpenChange={setIntroOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>設定ができました</DialogTitle>
            <DialogDescription>{introText}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setIntroOpen(false);
                onNavigateHome?.();
              }}
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700"
            >
              ホームへ
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppChrome>
  );
}
