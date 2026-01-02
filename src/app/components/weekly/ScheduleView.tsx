import React from 'react';

import type { Category, Material, PlanItem, WeeklyGoal } from '../../types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { DesktopWeekGridView } from './DesktopWeekGridView';
import { MobileAgendaView } from './MobileAgendaView';
import { TabletHybridView } from './TabletHybridView';

export function ScheduleView({
  displayItems,
  studyItems,
  categories,
  materials,
  weekStartDate,
  lifestyleReady,
  selectedDay,
  onSelectDay,
  onSelectSlot,
  onEditItem,
  onToggleDone,
  onItemChange,
  onItemDelete,
  onOpenNewItem,
  onNavigateMaterials,
  onLifestyleEdit,
  weekGoals,
  onGoalChange,
  onGoalToggle,
  onGoalAdd,
  onGoalDelete,
  todayPanelOpen,
}: {
  displayItems: PlanItem[];
  studyItems: PlanItem[];
  categories: Category[];
  materials: Material[];
  weekStartDate: string;
  lifestyleReady: boolean;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSelectSlot: (dayOfWeek: number, startTime: number, duration?: number) => void;
  onEditItem: (item: PlanItem) => void;
  onToggleDone: (item: PlanItem) => void;
  onItemChange: (item: PlanItem) => void;
  onItemDelete: (item: PlanItem) => void;
  onOpenNewItem: () => void;
  onNavigateMaterials: () => void;
  onLifestyleEdit: (item: PlanItem) => void;
  weekGoals: WeeklyGoal[];
  onGoalChange: (goalId: string, text: string) => void;
  onGoalToggle: (goalId: string) => void;
  onGoalAdd: () => void;
  onGoalDelete: (goalId: string) => void;
  todayPanelOpen: boolean;
}) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  if (isMobile) {
    return (
      <MobileAgendaView
        items={studyItems}
        categories={categories}
        materials={materials}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        onEditItem={onEditItem}
        onToggleDone={onToggleDone}
        onAddItem={onOpenNewItem}
      />
    );
  }

  if (isTablet) {
    return (
      <TabletHybridView
        items={studyItems}
        categories={categories}
        materials={materials}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        onSelectSlot={(startTime) => onSelectSlot(selectedDay, startTime, 30)}
        onEditItem={onEditItem}
        onToggleDone={onToggleDone}
      />
    );
  }

  return (
    <DesktopWeekGridView
      displayItems={displayItems}
      studyItems={studyItems}
      categories={categories}
      materials={materials}
      weekStartDate={weekStartDate}
      lifestyleReady={lifestyleReady}
      todayPanelOpen={todayPanelOpen}
      weekGoals={weekGoals}
      onGoalChange={onGoalChange}
      onGoalToggle={onGoalToggle}
      onGoalAdd={onGoalAdd}
      onGoalDelete={onGoalDelete}
      onItemClick={onEditItem}
      onLifestyleEdit={onLifestyleEdit}
      onItemChange={onItemChange}
      onItemDelete={onItemDelete}
      onEmptySlotClick={(dayOfWeek, startTime) => onSelectSlot(dayOfWeek, startTime, 30)}
      onRangeSelect={(dayOfWeek, startTime, duration) => {
        onSelectSlot(dayOfWeek, startTime, duration);
      }}
      onOpenNewItem={onOpenNewItem}
      onNavigateMaterials={onNavigateMaterials}
    />
  );
}
