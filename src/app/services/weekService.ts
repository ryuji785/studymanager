import { addWeeks, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import { WeeklyPlan } from '../types';

export function getWeekRange(date: Date = new Date()): { weekStart: string; weekEnd: string } {
  const weekStartDate = startOfWeek(date, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(date, { weekStartsOn: 1 });
  return {
    weekStart: format(weekStartDate, 'yyyy-MM-dd'),
    weekEnd: format(weekEndDate, 'yyyy-MM-dd'),
  };
}

export function getPreviousWeekRange(date: Date = new Date()): { weekStart: string; weekEnd: string } {
  return getWeekRange(addWeeks(date, -1));
}

export function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const start = parseISO(weekStart);
  const end = parseISO(weekEnd);
  return `${format(start, 'M/d')}\u301c${format(end, 'M/d')}`;
}

export function sortPlansDesc(plans: WeeklyPlan[]): WeeklyPlan[] {
  return plans.slice().sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

