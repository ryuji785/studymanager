import React, { useEffect, useState } from 'react';

import type { PlanItem } from '../types';
import { minutesToTimeString, timeStringToMinutes } from '../utils/time';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];

type RescheduleMode = 'move' | 'next' | 'discard';

export function RescheduleDialog({
  open,
  item,
  title,
  onOpenChange,
  onMoveWithinWeek,
  onCarryOver,
  onDiscard,
}: {
  open: boolean;
  item: PlanItem | null;
  title: string;
  onOpenChange: (open: boolean) => void;
  onMoveWithinWeek: (payload: { dayOfWeek: number; startTime: number; duration: number }) => void;
  onCarryOver: () => void;
  onDiscard: () => void;
}) {
  const [mode, setMode] = useState<RescheduleMode>('move');
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('60');

  useEffect(() => {
    if (!item) return;
    setMode('move');
    setDayOfWeek(String(item.dayOfWeek));
    setStartTime(minutesToTimeString(item.startTime));
    setDuration(String(item.duration));
  }, [item, open]);

  const handleSave = () => {
    if (!item) return;
    if (mode === 'move') {
      const startMinutes = timeStringToMinutes(startTime);
      const durationMinutes = Math.max(30, Number(duration) || 0);
      onMoveWithinWeek({
        dayOfWeek: Number(dayOfWeek),
        startTime: startMinutes,
        duration: durationMinutes,
      });
    } else if (mode === 'next') {
      onCarryOver();
    } else {
      onDiscard();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>リスケ</DialogTitle>
          <DialogDescription>「{title}」の予定を調整します。</DialogDescription>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(value) => setMode(value as RescheduleMode)} className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <RadioGroupItem value="move" id="reschedule-move" className="mt-1" />
            <div className="flex-1 space-y-3">
              <Label htmlFor="reschedule-move" className="text-sm font-medium">
                今週の別日に移動
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">曜日</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue placeholder="曜日を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, index) => (
                        <SelectItem key={day} value={String(index)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">開始</Label>
                  <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">所要時間</Label>
                  <Input
                    type="number"
                    min={30}
                    step={30}
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <RadioGroupItem value="next" id="reschedule-next" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="reschedule-next" className="text-sm font-medium">
                来週に持ち越し
              </Label>
              <p className="text-xs text-muted-foreground">同じ曜日・時間帯のまま来週へ移動します。</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <RadioGroupItem value="discard" id="reschedule-discard" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="reschedule-discard" className="text-sm font-medium">
                今週は破棄
              </Label>
              <p className="text-xs text-muted-foreground">この予定を削除します（取り消し可）。</p>
            </div>
          </div>
        </RadioGroup>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="bg-white" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
