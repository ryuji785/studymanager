import { format, isValid, parseISO } from 'date-fns';

export function formatIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'yyyy/MM/dd');
}

export function formatDisplayDateTime(date: Date): string {
  return format(date, 'yyyy/MM/dd HH:mm');
}

export function safeParseISO(value: string): Date | null {
  try {
    const parsed = parseISO(value);
    if (!isValid(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatDisplayFromISO(value: string | null | undefined): string {
  if (!value) return '-';
  const parsed = safeParseISO(value);
  if (!parsed) return '-';

  const isDateTime = value.includes('T');
  return isDateTime ? formatDisplayDateTime(parsed) : formatDisplayDate(parsed);
}

export function formatPeriod(start: string, end: string): string {
  const startDate = safeParseISO(start);
  const endDate = safeParseISO(end);
  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)}〜${formatDisplayDate(endDate)}`;
  }
  return `${start}〜${end}`;
}
