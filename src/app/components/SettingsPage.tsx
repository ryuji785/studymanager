import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { AppData, LifestyleTemplate } from '../types';
import { createDefaultLifestyleTemplate } from '../data/appDataStore';
import { formatMinutes } from '../utils/time';
import { AppChrome } from './layout/AppChrome';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LifestyleForm } from './LifestyleForm';
import { PageHeader } from './ui/page-header';
import { PageLayout } from './ui/page-layout';
import { StatCard } from './ui/stat-card';
import { Input } from './ui/input';
import { Label } from './ui/label';

function getLifestyleDurationMinutes(startTime: number, endTime: number) {
  if (startTime === endTime) return 0;
  if (endTime < startTime) return endTime + 1440 - startTime;
  return endTime - startTime;
}

function computeAvailableMinutes(template: LifestyleTemplate | undefined) {
  if (!template) return 0;
  const totalWeekMinutes = 7 * 24 * 60;
  let lifestyleMinutes = 0;
  for (let day = 0; day < 7; day += 1) {
    const isWeekend = day === 5 || day === 6;
    const sleep = template.weekendEnabled && isWeekend && template.weekendSleep ? template.weekendSleep : template.weekdaySleep;
    lifestyleMinutes += getLifestyleDurationMinutes(sleep.startTime, sleep.endTime);
  }
  lifestyleMinutes += template.optionalBlocks.reduce((sum, block) => {
    const count = Array.isArray(block.daysOfWeek) ? block.daysOfWeek.length : 0;
    return sum + block.duration * count;
  }, 0);
  return Math.max(0, totalWeekMinutes - lifestyleMinutes);
}

export function SettingsPage({
  data,
  onUpdateData,
  focusSection,
}: {
  data: AppData;
  onUpdateData: (updater: (prev: AppData) => AppData) => void;
  focusSection?: 'goal' | null;
}) {
  const [draft, setDraft] = useState<LifestyleTemplate>(
    data.lifestyleTemplate ?? createDefaultLifestyleTemplate(),
  );
  const [userName, setUserName] = useState(data.userName ?? '');
  const [goalTitle, setGoalTitle] = useState(data.userGoalTitle ?? '');
  const [goalDeadline, setGoalDeadline] = useState(data.userGoalDeadline ?? '');
  const goalSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft(data.lifestyleTemplate ?? createDefaultLifestyleTemplate());
    setUserName(data.userName ?? '');
    setGoalTitle(data.userGoalTitle ?? '');
    setGoalDeadline(data.userGoalDeadline ?? '');
  }, [data.lifestyleTemplate, data.userGoalDeadline, data.userGoalTitle, data.userName]);

  useEffect(() => {
    if (focusSection !== 'goal') return;
    const target = goalSectionRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusSection]);

  const handleSave = () => {
    if (draft.weekdaySleep.startTime === draft.weekdaySleep.endTime) {
      toast.error('平日の睡眠時間を正しく設定してください');
      return;
    }
    onUpdateData((prev) => ({
      ...prev,
      lifestyleTemplate: { ...draft, updatedAt: new Date().toISOString() },
      userName: userName.trim() || undefined,
      userGoalTitle: goalTitle.trim() || undefined,
      userGoalDeadline: goalDeadline || undefined,
    }));
    toast.success('設定を保存しました');
  };

  const lifestyleReady = Boolean(
    draft.weekdaySleep && draft.weekdaySleep.startTime !== draft.weekdaySleep.endTime,
  );
  const availableMinutes = computeAvailableMinutes(draft);

  return (
    <AppChrome title="設定" actions={null}>
      <PageLayout>
        <PageHeader
          title="設定"
          description="生活時間とユーザー設定をまとめて管理します。"
          action={<Button onClick={handleSave}>保存</Button>}
        />

        <StatCard
          label="この設定から算出される学習可能時間（目安）"
          value={lifestyleReady ? `最大 ${formatMinutes(availableMinutes)}` : '未設定'}
          helper="生活時間から算出した目安です。"
          valueClassName={lifestyleReady ? undefined : 'text-base text-muted-foreground font-medium'}
        />

        <Card ref={goalSectionRef}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">目標・ユーザー設定</CardTitle>
            <p className="text-sm text-muted-foreground">
              目標名と期限を入れると、マイページの進捗表示がわかりやすくなります。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>表示名</Label>
                <Input
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  placeholder="例：田中 花子"
                />
              </div>
              <div className="grid gap-2">
                <Label>目標名（任意）</Label>
                <Input
                  value={goalTitle}
                  onChange={(event) => setGoalTitle(event.target.value)}
                  placeholder="例：TOEIC 800"
                />
              </div>
              <div className="grid gap-2">
                <Label>期限（任意）</Label>
                <Input
                  type="date"
                  value={goalDeadline}
                  onChange={(event) => setGoalDeadline(event.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              目標は週計画の判断材料として表示されます（MVPのため最低限の項目のみ扱います）。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">生活時間（学習可能時間の計算）</CardTitle>
            <p className="text-sm text-muted-foreground">学習可能時間の計算に使用されます。</p>
          </CardHeader>
          <CardContent>
            <LifestyleForm value={draft} categories={data.categories} onChange={setDraft} />
          </CardContent>
        </Card>
      </PageLayout>
    </AppChrome>
  );
}
