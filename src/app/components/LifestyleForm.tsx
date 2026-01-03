import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import type { Category, LifestyleBlock, LifestyleTemplate } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { clampToStep, minutesToTimeString, timeStringToMinutes, formatMinutes } from '../utils/time';

const DAYS: Array<{ value: number; label: string }> = [
  { value: 0, label: '月' },
  { value: 1, label: '火' },
  { value: 2, label: '水' },
  { value: 3, label: '木' },
  { value: 4, label: '金' },
  { value: 5, label: '土' },
  { value: 6, label: '日' },
];

const STEP_MINUTES = 30;
const DAY_MINUTES = 24 * 60;
const MAX_DURATION_MINUTES = 24 * 60;

function buildBlock(defaultCategoryId?: string): LifestyleBlock {
  return {
    id: `lb_${Date.now()}`,
    label: '固定予定',
    daysOfWeek: [0],
    startTime: 19 * 60,
    duration: 60,
    categoryId: defaultCategoryId,
  };
}

function getDurationFromEnd(startTime: number, endTime: number) {
  let duration = endTime - startTime;
  if (duration <= 0) duration += DAY_MINUTES;
  duration = clampToStep(duration, STEP_MINUTES);
  return Math.min(MAX_DURATION_MINUTES, Math.max(STEP_MINUTES, duration));
}

export function LifestyleForm({
  value,
  categories,
  onChange,
}: {
  value: LifestyleTemplate;
  categories: Category[];
  onChange: (next: LifestyleTemplate) => void;
}) {
  const update = (partial: Partial<LifestyleTemplate>) => {
    onChange({ ...value, ...partial });
  };

  const updateSleep = (key: 'weekdaySleep' | 'weekendSleep', startTime: number, endTime: number) => {
    if (key === 'weekdaySleep') {
      update({ weekdaySleep: { startTime, endTime } });
      return;
    }
    update({ weekendSleep: { startTime, endTime } });
  };

  const updateOptional = (nextBlocks: LifestyleBlock[]) => {
    update({ optionalBlocks: nextBlocks });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900">平日の睡眠（必須）</h3>
            <p className="text-xs text-slate-500">平日の睡眠時間は学習可能時間の算出に使います。</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>開始</Label>
            <Input
              type="time"
              step={1800}
              value={minutesToTimeString(value.weekdaySleep.startTime)}
              onChange={(e) => {
                const next = clampToStep(timeStringToMinutes(e.target.value), STEP_MINUTES);
                updateSleep('weekdaySleep', next, value.weekdaySleep.endTime);
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label>終了</Label>
            <Input
              type="time"
              step={1800}
              value={minutesToTimeString(value.weekdaySleep.endTime)}
              onChange={(e) => {
                const next = clampToStep(timeStringToMinutes(e.target.value), STEP_MINUTES);
                updateSleep('weekdaySleep', value.weekdaySleep.startTime, next);
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900">休日の睡眠（任意）</h3>
            <p className="text-xs text-slate-500">オンにすると土日だけ別の睡眠時間を設定できます。</p>
          </div>
          <Switch
            checked={value.weekendEnabled}
            onCheckedChange={(checked) => update({ weekendEnabled: checked })}
            aria-label="休日の睡眠設定を有効にする"
          />
        </div>
        {value.weekendEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>開始</Label>
              <Input
                type="time"
                step={1800}
                value={minutesToTimeString(value.weekendSleep?.startTime ?? value.weekdaySleep.startTime)}
                onChange={(e) => {
                  const next = clampToStep(timeStringToMinutes(e.target.value), STEP_MINUTES);
                  updateSleep('weekendSleep', next, value.weekendSleep?.endTime ?? value.weekdaySleep.endTime);
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>終了</Label>
              <Input
                type="time"
                step={1800}
                value={minutesToTimeString(value.weekendSleep?.endTime ?? value.weekdaySleep.endTime)}
                onChange={(e) => {
                  const next = clampToStep(timeStringToMinutes(e.target.value), STEP_MINUTES);
                  updateSleep('weekendSleep', value.weekendSleep?.startTime ?? value.weekdaySleep.startTime, next);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-slate-900">その他の固定予定</h3>
            <p className="text-xs text-slate-500">通勤・食事・部活など、学習以外で固定化したい時間を追加できます。</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-white"
            onClick={() => updateOptional([...value.optionalBlocks, buildBlock(categories[0]?.id)])}
          >
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </div>

        {value.optionalBlocks.length === 0 ? (
          <div className="text-xs text-slate-500 rounded-xl border border-dashed border-slate-100 bg-white px-3 py-2">
            まだ登録されていません。必要に応じて追加してください。
          </div>
        ) : (
          <div className="space-y-3">
            {value.optionalBlocks.map((block, index) => {
              const endTime = (block.startTime + block.duration) % DAY_MINUTES;
              const isNextDay = block.startTime + block.duration >= DAY_MINUTES;

              return (
                <div
                  key={block.id}
                  className="grid grid-cols-1 lg:grid-cols-[1.2fr,1.6fr,1fr,1.3fr,auto] gap-2 items-start"
                >
                  <Input
                    value={block.label}
                    onChange={(e) => {
                      const next = value.optionalBlocks.slice();
                      next[index] = { ...block, label: e.target.value };
                      updateOptional(next);
                    }}
                  />

                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    size="sm"
                    className="flex-wrap"
                    value={(block.daysOfWeek ?? []).map(String)}
                    onValueChange={(nextValue) => {
                      if (nextValue.length === 0) return;
                      const next = value.optionalBlocks.slice();
                      next[index] = { ...block, daysOfWeek: nextValue.map(Number) };
                      updateOptional(next);
                    }}
                  >
                    {DAYS.map((d) => (
                      <ToggleGroupItem key={d.value} value={String(d.value)} aria-label={`${d.label}曜`}>
                        {d.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>

                  <Select
                    value={block.categoryId ?? 'none'}
                    onValueChange={(v) => {
                      const next = value.optionalBlocks.slice();
                      next[index] = { ...block, categoryId: v === 'none' ? undefined : v };
                      updateOptional(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未選択</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label>開始</Label>
                        <Input
                          type="time"
                          step={1800}
                          value={minutesToTimeString(block.startTime)}
                          onChange={(e) => {
                            const next = value.optionalBlocks.slice();
                            next[index] = { ...block, startTime: clampToStep(timeStringToMinutes(e.target.value), STEP_MINUTES) };
                            updateOptional(next);
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>終了</Label>
                        <Input
                          type="time"
                          step={1800}
                          value={minutesToTimeString(endTime)}
                          onChange={(e) => {
                            const next = value.optionalBlocks.slice();
                            const endMinutes = clampToStep(timeStringToMinutes(e.target.value), STEP_MINUTES);
                            next[index] = { ...block, duration: getDurationFromEnd(block.startTime, endMinutes) };
                            updateOptional(next);
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      所要: {formatMinutes(block.duration)}{isNextDay ? '（翌日）' : ''}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-center"
                    onClick={() => {
                      updateOptional(value.optionalBlocks.filter((_, idx) => idx !== index));
                    }}
                    aria-label="固定予定を削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
