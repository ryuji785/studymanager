import { addDays, format, startOfWeek } from 'date-fns';

export function getWeekRange(date: Date): { weekStart: string; weekEnd: string } {
  const weekStartDate = startOfWeek(date, { weekStartsOn: 1 });
  const weekEndDate = addDays(weekStartDate, 6);
  return {
    weekStart: format(weekStartDate, 'yyyy-MM-dd'),
    weekEnd: format(weekEndDate, 'yyyy-MM-dd'),
  };
}

export function toWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

