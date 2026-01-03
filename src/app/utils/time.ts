export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function clampToStep(minutes: number, step: number): number {
  return Math.round(minutes / step) * step;
}

export function timeStringToMinutes(value: string): number {
  const [h, m] = value.split(':').map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number): string {
  const display = minutes % 1440;
  const h = Math.floor(display / 60) % 24;
  const m = display % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function normalizeDisplayRange(
  startTime: number,
  duration: number,
  axisStart = 6 * 60,
  dayMinutes = 1440,
): { start: number; end: number } {
  let start = startTime;
  let end = startTime + duration;
  if (start >= dayMinutes) {
    return { start, end };
  }
  if (start < axisStart && end <= axisStart) {
    start += dayMinutes;
    end += dayMinutes;
  }
  return { start, end };
}
