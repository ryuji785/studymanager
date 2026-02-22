import {
  DEFAULT_PLAN_START_HOUR,
  WEEKDAY_LABELS,
  BOOK_COLOR_PALETTE,
  type BookColorPalette,
  type Task,
  type WeekDay,
} from '../constants';

// --- Color ---
export function getPaletteByKey(colorKey: string): BookColorPalette {
  return BOOK_COLOR_PALETTE.find((entry) => entry.key === colorKey) ?? BOOK_COLOR_PALETTE[0];
}

// --- Task helpers ---
export function getTaskStartMinutes(task: Partial<Task> | null | undefined): number {
  if (typeof task?.startMinutes === 'number') return task.startMinutes;
  if (typeof (task as any)?.startHour === 'number') return (task as any).startHour * 60;
  return DEFAULT_PLAN_START_HOUR * 60;
}

export function getTaskStartHour(task: Partial<Task> | null | undefined): number {
  if (typeof (task as any)?.startHour === 'number') return (task as any).startHour;
  return Math.floor(getTaskStartMinutes(task) / 60);
}

export function getTaskDayOfMonth(task: Partial<Task> | null | undefined): number | null {
  if (typeof (task as any)?.day === 'number') return (task as any).day;
  if (typeof task?.date === 'string') {
    const parsedDay = Number(task.date.split('-')[2]);
    if (!Number.isNaN(parsedDay)) return parsedDay;
  }
  return null;
}

// --- Time formatting ---
export function toTimeString(totalMinutes: number): string {
  const safe = ((Number(totalMinutes) || 0) % (24 * 60) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(safe / 60)).padStart(2, '0');
  const mm = String(safe % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// --- Date helpers ---
export function addDays(baseDate: Date, offsetDays: number): Date {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

export function getWeekStartMonday(baseDate: Date): Date {
  const date = new Date(baseDate);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function toDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekDays(weekStartDate: Date): WeekDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStartDate, index);
    return {
      key: toDateKey(date),
      day: WEEKDAY_LABELS[index],
      date: String(date.getDate()),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  });
}

// --- Layout calculation (for overlapping tasks) ---
export function calculateTaskLayout(
  dayTasks: Task[],
): Record<string, { left: string; width: string; zIndex: number }> {
  if (!dayTasks || dayTasks.length === 0) return {};

  const sorted = [...dayTasks].sort((a, b) => {
    const startA = getTaskStartMinutes(a);
    const startB = getTaskStartMinutes(b);
    if (startA !== startB) return startA - startB;
    return (Number(b.duration) || 0) - (Number(a.duration) || 0);
  });

  const clusters: Task[][] = [];
  let currentCluster: Task[] = [];
  let clusterEnd = -1;

  for (const task of sorted) {
    const start = getTaskStartMinutes(task);
    const end = start + (Number(task.duration) || 0);

    if (currentCluster.length === 0) {
      currentCluster.push(task);
      clusterEnd = end;
    } else {
      if (start < clusterEnd) {
        currentCluster.push(task);
        clusterEnd = Math.max(clusterEnd, end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [task];
        clusterEnd = end;
      }
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const layout: Record<string, { left: string; width: string; zIndex: number }> = {};

  for (const cluster of clusters) {
    const columns: number[][] = [];
    for (const task of cluster) {
      let placedColIdx = -1;
      for (let i = 0; i < columns.length; i++) {
        const lastTaskId = columns[i][columns[i].length - 1];
        const lastTask = cluster.find((t) => t.id === lastTaskId);
        if (!lastTask) continue;
        const lastEnd = getTaskStartMinutes(lastTask) + (Number(lastTask.duration) || 0);
        if (lastEnd <= getTaskStartMinutes(task)) {
          columns[i].push(task.id);
          placedColIdx = i;
          break;
        }
      }
      if (placedColIdx === -1) {
        columns.push([task.id]);
        placedColIdx = columns.length - 1;
      }
      (layout as any)[task.id] = { colIndex: placedColIdx };
    }

    const totalCols = columns.length;
    const widthPct = 100 / totalCols;
    for (const task of cluster) {
      const colIdx = (layout as any)[task.id].colIndex;
      layout[task.id] = {
        left: `${colIdx * widthPct}%`,
        width: `${widthPct}%`,
        zIndex: colIdx + 10,
      };
    }
  }
  return layout;
}
