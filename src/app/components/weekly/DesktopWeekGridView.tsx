import React from 'react';
import { Calendar, Clock } from 'lucide-react';

import type { Category, Material, PlanItem, WeeklyGoal } from '../../types';
import { formatMinutes, minutesToTimeString } from '../../utils/time';
import { cn } from '../ui/utils';
import { EmptyState } from '../ui/empty-state';
import { PlanTimeTable } from '../PlanTimeTable';
import { GoalsSection } from '../GoalsSection';

function normalizeLabel(value?: string | null) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[?？]+$/.test(trimmed)) return '';
  return trimmed;
}

export function DesktopWeekGridView({
  displayItems,
  studyItems,
  categories,
  materials,
  weekStartDate,
  lifestyleReady,
  todayPanelOpen,
  weekGoals,
  onGoalChange,
  onGoalToggle,
  onGoalAdd,
  onGoalDelete,
  onItemClick,
  onLifestyleEdit,
  onItemChange,
  onItemDelete,
  onEmptySlotClick,
  onRangeSelect,
  onOpenNewItem,
  onNavigateMaterials,
}: {
  displayItems: PlanItem[];
  studyItems: PlanItem[];
  categories: Category[];
  materials: Material[];
  weekStartDate: string;
  lifestyleReady: boolean;
  todayPanelOpen: boolean;
  weekGoals: WeeklyGoal[];
  onGoalChange: (goalId: string, text: string) => void;
  onGoalToggle: (goalId: string) => void;
  onGoalAdd: () => void;
  onGoalDelete: (goalId: string) => void;
  onItemClick: (item: PlanItem) => void;
  onLifestyleEdit: (item: PlanItem) => void;
  onItemChange: (item: PlanItem) => void;
  onItemDelete: (item: PlanItem) => void;
  onEmptySlotClick: (dayOfWeek: number, startTime: number) => void;
  onRangeSelect: (dayOfWeek: number, startTime: number, duration: number) => void;
  onOpenNewItem: () => void;
  onNavigateMaterials: () => void;
}) {
  const todayIndex = React.useMemo(() => {
    const jsDay = new Date().getDay();
    return (jsDay + 6) % 7;
  }, []);
  const todayStudyItems = studyItems.filter((item) => item.dayOfWeek === todayIndex);
  const todaySchedule = [...todayStudyItems].sort((a, b) => a.startTime - b.startTime);
  const todayPlannedMinutes = todayStudyItems.reduce((sum, item) => sum + item.duration, 0);
  const todaySlotCount = todayStudyItems.length;
  const nowMinutes = React.useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">今週の計画</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>空き枠クリックで30分、ドラッグで範囲追加。予定はドラッグで移動・伸縮できます</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div id="weekly-timetable" className="min-w-0 flex-1 space-y-3">
          <PlanTimeTable
            items={displayItems}
            categories={categories}
            materials={materials}
            weekStartDate={weekStartDate}
            editable={lifestyleReady}
            allowLifestyleEdit
            className="h-[calc(100vh-260px)] overflow-auto"
            onLifestyleEdit={onLifestyleEdit}
            onItemChange={onItemChange}
            onItemDelete={onItemDelete}
            onItemClick={onItemClick}
            onEmptySlotClick={onEmptySlotClick}
            onRangeSelect={onRangeSelect}
          />
          {studyItems.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-5 h-5" />}
              title="今週の予定がまだありません"
              description="まずは学習ブロックを追加して、今週の流れを作りましょう。"
              actions={[
                { label: '学習ブロックを追加', onClick: onOpenNewItem },
                { label: '教材から割り当て', onClick: onNavigateMaterials, variant: 'outline' },
              ]}
            />
          ) : null}
        </div>

        <aside
          className={cn(
            'flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out',
            todayPanelOpen
              ? 'w-full lg:w-[340px] opacity-100'
              : 'w-0 opacity-0 pointer-events-none max-lg:hidden',
          )}
          aria-hidden={!todayPanelOpen}
        >
          <div className="h-[calc(100vh-260px)] space-y-4">
            <div id="weekly-goals">
              <GoalsSection
                goals={weekGoals}
                editable
                onGoalChange={onGoalChange}
                onGoalToggle={onGoalToggle}
                onGoalAdd={onGoalAdd}
                onGoalDelete={onGoalDelete}
              />
            </div>
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-foreground text-background">
              <div className="sticky top-0 z-10 border-b border-border/30 bg-foreground px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-background/60">今日の予定</p>
                    <p className="text-sm font-semibold text-background">計画を縦並びで確認できます</p>
                  </div>
                  <div className="text-xs text-background/60">
                    {todaySlotCount}コマ / {formatMinutes(todayPlannedMinutes)}
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {todaySchedule.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/40 bg-background/5 px-3 py-2 text-xs text-background/70">
                    今日はまだ予定がありません。タイムテーブルから追加できます。
                  </div>
                ) : (
                  todaySchedule.map((item) => {
                    const startLabel = minutesToTimeString(item.startTime);
                    const endLabel = minutesToTimeString(item.startTime + item.duration);
                    const category = normalizeLabel(categories.find((c) => c.id === item.categoryId)?.name) || '学習';
                    const material = normalizeLabel(materials.find((m) => m.id === item.materialId)?.name);
                    const title = normalizeLabel(item.label) || material || category;
                    const isCurrent =
                      item.status !== 'done' &&
                      nowMinutes >= item.startTime &&
                      nowMinutes < item.startTime + item.duration;
                    const isDone = item.status === 'done';
                    const cardStyle = isCurrent
                      ? 'border-primary/60 bg-primary/20 text-background shadow-sm'
                      : isDone
                        ? 'border-border/30 bg-background/5 text-background/60'
                        : 'border-border/30 bg-background/10 text-background/80';

                    return (
                      <div key={item.id} className={cn('rounded-lg border px-3 py-2 transition', cardStyle)}>
                        <div className="flex items-center justify-between text-[11px] text-background/60">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-mono">
                              {startLabel}-{endLabel}
                            </span>
                          </div>
                          <span>{formatMinutes(item.duration)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{title}</div>
                            <div className="text-[10px] text-background/50">{category}</div>
                          </div>
                          {isDone ? (
                            <span className="text-[10px] text-emerald-300">完了</span>
                          ) : (
                            <button
                              type="button"
                              className="rounded-full border border-border/30 px-2.5 py-0.5 text-[10px] text-background/70 hover:bg-background/10"
                              onClick={() => onItemChange({ ...item, status: 'done' })}
                            >
                              完了にする
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
