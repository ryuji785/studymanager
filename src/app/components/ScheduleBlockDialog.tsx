import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { CategoryType, CATEGORY_LABELS, ScheduleBlock } from '../types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const DAYS: Array<{ value: number; label: string }> = [
  { value: 0, label: '月' },
  { value: 1, label: '火' },
  { value: 2, label: '水' },
  { value: 3, label: '木' },
  { value: 4, label: '金' },
  { value: 5, label: '土' },
  { value: 6, label: '日' },
];

const CATEGORIES: CategoryType[] = ['english', 'math', 'science', 'japanese', 'social', 'school', 'sleep', 'club', 'other'];

const AXIS_START_MINUTES = 6 * 60; // 6:00
const STEP_MINUTES = 30;
const MAX_DURATION_MINUTES = 24 * 60; // 24h

function clampToStep(minutes: number, step: number) {
  return Math.round(minutes / step) * step;
}

function normalizeToAxis(minutesFromMidnight: number) {
  const rounded = clampToStep(minutesFromMidnight, STEP_MINUTES);
  return rounded < AXIS_START_MINUTES ? rounded + 1440 : rounded;
}

function minutesToTimeString(minutes: number) {
  const display = minutes >= 1440 ? minutes - 1440 : minutes;
  const h = Math.floor(display / 60) % 24;
  const m = display % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeStringToMinutes(value: string) {
  const [h, m] = value.split(':').map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function ScheduleBlockDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Partial<ScheduleBlock> & Pick<ScheduleBlock, 'dayOfWeek' | 'startTime' | 'duration'>;
  onSave: (block: ScheduleBlock) => void;
  onDelete?: () => void;
}) {
  const isEdit = Boolean(initial.id);

  const initialTime = useMemo(() => minutesToTimeString(initial.startTime), [initial.startTime]);
  const initialDuration = useMemo(
    () => Math.min(MAX_DURATION_MINUTES, Math.max(STEP_MINUTES, clampToStep(initial.duration, STEP_MINUTES))),
    [initial.duration],
  );

  const [dayOfWeek, setDayOfWeek] = useState<number>(initial.dayOfWeek);
  const [category, setCategory] = useState<CategoryType>((initial.category ?? 'english') as CategoryType);
  const [label, setLabel] = useState<string>(initial.label ?? '');
  const [time, setTime] = useState<string>(initialTime);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [status, setStatus] = useState<ScheduleBlock['status']>(initial.status ?? 'planned');

  useEffect(() => {
    if (!open) return;
    setDayOfWeek(initial.dayOfWeek);
    setCategory((initial.category ?? 'english') as CategoryType);
    setLabel(initial.label ?? '');
    setTime(minutesToTimeString(initial.startTime));
    setDuration(Math.min(MAX_DURATION_MINUTES, Math.max(STEP_MINUTES, clampToStep(initial.duration, STEP_MINUTES))));
    setStatus(initial.status ?? 'planned');
  }, [open, initial]);

  const durationOptions = useMemo(() => {
    const mins = Array.from({ length: MAX_DURATION_MINUTES / STEP_MINUTES }, (_, idx) => (idx + 1) * STEP_MINUTES);
    return mins.map((m) => ({ value: m, label: formatDuration(m) }));
  }, []);

  const timeModel = useMemo(() => {
    const rawStart = clampToStep(timeStringToMinutes(time), STEP_MINUTES);
    const normalizedStart = normalizeToAxis(rawStart);
    const normalizedEnd = normalizedStart + duration;
    const endTime = minutesToTimeString(normalizedEnd);

    const startDay = Math.floor(normalizedStart / 1440);
    const endDay = Math.floor(normalizedEnd / 1440);
    const dayDelta = endDay - startDay;

    return {
      normalizedStart,
      normalizedEnd,
      endTime,
      dayDelta,
    };
  }, [duration, time]);

  const validationError = useMemo(() => {
    if (!Number.isFinite(duration)) return '時間の入力が不正です';
    if (duration <= 0) return '所要時間は0分にできません';
    if (duration % STEP_MINUTES !== 0) return '所要時間は30分単位で入力してください';
    if (duration > MAX_DURATION_MINUTES) return '所要時間は最大24時間までです';
    return null;
  }, [duration]);

  const handleEndTimeChange = (value: string) => {
    const rawStart = clampToStep(timeStringToMinutes(time), STEP_MINUTES);
    const startNormalized = normalizeToAxis(rawStart);

    const rawEnd = clampToStep(timeStringToMinutes(value), STEP_MINUTES);
    let endNormalized = normalizeToAxis(rawEnd);
    if (endNormalized < startNormalized) endNormalized += 1440;

    const nextDuration = endNormalized - startNormalized;
    setDuration(Math.min(MAX_DURATION_MINUTES, Math.max(STEP_MINUTES, clampToStep(nextDuration, STEP_MINUTES))));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    const rawMinutes = timeStringToMinutes(time);
    const roundedMinutes = clampToStep(rawMinutes, STEP_MINUTES);
    const normalizedStart = normalizeToAxis(roundedMinutes);

    const next: ScheduleBlock = {
      id: initial.id ?? `block_${Date.now()}`,
      category,
      label: label.trim() || CATEGORY_LABELS[category],
      dayOfWeek,
      startTime: normalizedStart,
      duration: Math.max(STEP_MINUTES, clampToStep(duration, STEP_MINUTES)),
      status,
      actualDuration: initial.actualDuration,
    };

    onSave(next);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '予定を編集' : '予定を追加'}</DialogTitle>
          <DialogDescription>
            30分単位で入力できます（時間割の表示範囲：6:00〜翌5:30）。終了が開始より前の場合は「翌日扱い」になります。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>曜日</Label>
                <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>カテゴリ</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>内容</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：英単語 / 数学演習 / 睡眠" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>開始時刻</Label>
                <Input
                  type="time"
                  step={1800}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onBlur={() => setTime(minutesToTimeString(normalizeToAxis(timeStringToMinutes(time))))}
                />
                <p className="text-[11px] text-gray-500">0:00〜5:30は「翌日」として扱います</p>
              </div>

              <div className="grid gap-2">
                <Label>終了時刻</Label>
                <Input
                  type="time"
                  step={1800}
                  value={timeModel.endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                />
                <p className="text-[11px] text-gray-500">
                  所要：{formatDuration(duration)}
                  {timeModel.dayDelta >= 1 ? '（翌日）' : ''}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-end justify-between gap-3">
                <Label>所要時間</Label>
                <span className="text-[11px] text-gray-500">0分は不可 / 最大24時間</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[30, 60, 120, 180, 360, 480].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white"
                    onClick={() => setDuration(m)}
                  >
                    {formatDuration(m)}
                  </Button>
                ))}
              </div>
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationError && <p className="text-xs text-red-600">{validationError}</p>}
            </div>

            <div className="grid gap-2">
              <Label>状態</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ScheduleBlock['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">予定</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="incomplete">未完</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete} className="mr-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-white">
              キャンセル
            </Button>
            <Button type="submit" disabled={Boolean(validationError)}>
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
