import React, { useEffect, useState } from 'react';
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
}: {
  data: AppData;
  onUpdateData: (updater: (prev: AppData) => AppData) => void;
}) {
  const [draft, setDraft] = useState<LifestyleTemplate>(
    data.lifestyleTemplate ?? createDefaultLifestyleTemplate(),
  );

  useEffect(() => {
    setDraft(data.lifestyleTemplate ?? createDefaultLifestyleTemplate());
  }, [data.lifestyleTemplate]);

  const handleSave = () => {
    if (draft.weekdaySleep.startTime === draft.weekdaySleep.endTime) {
      toast.error('平日の睡眠時間を正しく設定してください');
      return;
    }
    onUpdateData((prev) => ({
      ...prev,
      lifestyleTemplate: { ...draft, updatedAt: new Date().toISOString() },
    }));
    toast.success('生活時間を保存しました');
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
          description="この設定は、あなたに無理のない学習計画を作るために使われます。"
          action={<Button onClick={handleSave}>保存</Button>}
        />

        <StatCard
          label="この設定から算出される学習可能時間（目安）"
          value={lifestyleReady ? `最大 ${formatMinutes(availableMinutes)}` : '未設定'}
          helper="生活時間から算出した目安です。"
          valueClassName={lifestyleReady ? undefined : 'text-base text-muted-foreground font-medium'}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">生活時間の設定</CardTitle>
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
