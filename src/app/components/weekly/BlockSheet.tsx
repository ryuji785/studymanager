import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import type { Category, Material, PlanItem } from '../../types';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { useMediaQuery } from '../../hooks/useMediaQuery';

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
const MAX_DURATION_MINUTES = 24 * 60;
const PRESET_DURATIONS = [30, 60, 120, 180, 360, 480];

function clampToStep(minutes: number, step: number) {
  return Math.round(minutes / step) * step;
}

function timeStringToMinutes(value: string) {
  const [h, m] = value.split(':').map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function minutesToTimeString(minutes: number) {
  const display = minutes % 1440;
  const h = Math.floor(display / 60) % 24;
  const m = display % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function BlockSheet({
  open,
  onOpenChange,
  categories,
  materials,
  initial,
  defaultCategoryId,
  onSave,
  onDelete,
  onCreateCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  materials: Material[];
  initial: Partial<PlanItem> & Pick<PlanItem, 'dayOfWeek' | 'startTime' | 'duration'>;
  defaultCategoryId?: string;
  onSave: (item: PlanItem) => void;
  onDelete?: () => void;
  onCreateCategory: (name: string) => Category | null;
}) {
  const isEdit = Boolean(initial.id);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const initialStart = useMemo(() => minutesToTimeString(initial.startTime), [initial.startTime]);
  const initialDuration = useMemo(
    () => Math.min(MAX_DURATION_MINUTES, Math.max(STEP_MINUTES, clampToStep(initial.duration, STEP_MINUTES))),
    [initial.duration],
  );

  const [dayOfWeek, setDayOfWeek] = useState<number>(initial.dayOfWeek);
  const [categoryId, setCategoryId] = useState<string>(initial.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? '');
  const [materialId, setMaterialId] = useState<string>(initial.materialId ?? 'none');
  const [label, setLabel] = useState<string>(initial.label ?? '');
  const [notes, setNotes] = useState<string>(initial.notes ?? '');
  const [time, setTime] = useState<string>(initialStart);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [status, setStatus] = useState<PlanItem['status']>(initial.status ?? 'planned');
  const [newCategoryName, setNewCategoryName] = useState('');
  const selectedMaterial = useMemo(
    () => (materialId === 'none' ? undefined : materials.find((m) => m.id === materialId)),
    [materialId, materials],
  );
  const isCategoryLocked = Boolean(selectedMaterial);

  useEffect(() => {
    if (!open) return;
    setDayOfWeek(initial.dayOfWeek);
    setCategoryId(initial.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? '');
    setMaterialId(initial.materialId ?? 'none');
    setLabel(initial.label ?? '');
    setNotes(initial.notes ?? '');
    setTime(minutesToTimeString(initial.startTime));
    setDuration(Math.min(MAX_DURATION_MINUTES, Math.max(STEP_MINUTES, clampToStep(initial.duration, STEP_MINUTES))));
    setStatus(initial.status ?? 'planned');
    setNewCategoryName('');
  }, [open, initial, defaultCategoryId, categories]);

  useEffect(() => {
    if (!open) return;
    if (!selectedMaterial) return;
    setCategoryId(selectedMaterial.categoryId);
  }, [open, selectedMaterial]);

  const durationOptions = useMemo(() => {
    const mins = Array.from({ length: MAX_DURATION_MINUTES / STEP_MINUTES }, (_, idx) => (idx + 1) * STEP_MINUTES);
    return mins.map((m) => ({ value: m, label: formatDuration(m) }));
  }, []);

  const endTimeLabel = useMemo(() => {
    const start = clampToStep(timeStringToMinutes(time), STEP_MINUTES);
    const end = start + duration;
    const endLabel = minutesToTimeString(end);
    return end >= 1440 ? `${endLabel}（翌日）` : endLabel;
  }, [duration, time]);

  const validationError = useMemo(() => {
    if (!categoryId) return 'カテゴリを選択してください。';
    if (!Number.isFinite(duration)) return '時間の入力が不正です。';
    if (duration <= 0) return '所要時間は0分にできません。';
    if (duration % STEP_MINUTES !== 0) return '所要時間は30分単位で入力してください。';
    if (duration > MAX_DURATION_MINUTES) return '所要時間は最大24時間までです。';
    return null;
  }, [categoryId, duration]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validationError) return;

    const roundedStart = clampToStep(timeStringToMinutes(time), STEP_MINUTES);

    const next: PlanItem = {
      id: initial.id ?? `item_${Date.now()}`,
      weekId: initial.weekId ?? 'week_temp',
      type: 'study',
      dayOfWeek,
      startTime: roundedStart,
      duration: Math.max(STEP_MINUTES, clampToStep(duration, STEP_MINUTES)),
      categoryId: selectedMaterial?.categoryId ?? categoryId,
      materialId: materialId === 'none' ? undefined : materialId,
      label: label.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      isAutoGenerated: initial.isAutoGenerated ?? false,
      actualDuration: initial.actualDuration,
    };

    onSave(next);
    onOpenChange(false);
  };

  const handleCreateCategory = () => {
    const created = onCreateCategory(newCategoryName);
    if (!created) return;
    setCategoryId(created.id);
    setNewCategoryName('');
  };

  const content = (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>開始日（曜日）</Label>
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
            <Label>カテゴリ *</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={isCategoryLocked}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCategoryLocked ? (
              <p className="text-xs text-muted-foreground">
                教材を選ぶとカテゴリは教材に合わせて固定されます。
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>教材（任意）</Label>
          <Select value={materialId} onValueChange={setMaterialId}>
            <SelectTrigger>
              <SelectValue placeholder="教材を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未選択</SelectItem>
              {materials.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>内容（任意）</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：英単語 / 模試復習" />
        </div>

        <div className="grid gap-2">
          <Label>実施内容（任意）</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="取り組み内容や気づきをメモできます（JIRAの説明欄のように自由に記載）"
            className="min-h-[140px]"
          />
          <p className="text-xs text-muted-foreground">
            例：問題集P.12-15／間違い直し／次回は時間配分を意識する
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>開始時刻</Label>
            <Input
              type="time"
              step={1800}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => setTime(minutesToTimeString(clampToStep(timeStringToMinutes(time), STEP_MINUTES)))}
            />
          </div>

          <div className="grid gap-2">
            <Label>所要時間</Label>
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
            <div className="flex flex-wrap gap-2">
              {PRESET_DURATIONS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white"
                  onClick={() => setDuration(preset)}
                >
                  {formatDuration(preset)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">終了時刻: {endTimeLabel}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>完了状態</Label>
          <div className="flex items-center gap-3">
            <Switch
              checked={status === 'done'}
              onCheckedChange={(checked) => setStatus(checked ? 'done' : 'planned')}
            />
            <span className="text-sm text-muted-foreground">{status === 'done' ? '完了' : '予定'}</span>
          </div>
        </div>

        <div className="grid gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-3">
          <Label>カテゴリを追加</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="新しいカテゴリ名"
            />
            <Button type="button" variant="outline" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              追加
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">追加するとこのブロックにすぐ選択できます。</p>
        </div>

        {validationError && <p className="text-xs text-red-600">{validationError}</p>}
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
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? '学習ブロックを編集' : '学習ブロックを追加'}</DialogTitle>
            <DialogDescription>
              曜日と開始時刻を変更して予定を移動できます。終了が開始より前の場合は翌日扱いになります。
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <SheetHeader>
          <SheetTitle>{isEdit ? '学習ブロックを編集' : '学習ブロックを追加'}</SheetTitle>
          <SheetDescription>
            曜日と開始時刻を変更して予定を移動できます。終了が開始より前の場合は翌日扱いになります。
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">{content}</div>
      </SheetContent>
    </Sheet>
  );
}
