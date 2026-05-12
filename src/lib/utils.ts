import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'M月d日', { locale: zhTW });
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInDays(end, start) + 1;
  return `${format(start, 'M/d', { locale: zhTW })} – ${format(end, 'M/d', { locale: zhTW })} · ${days} 天`;
}

export function formatFullDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy年M月d日 EEEE', { locale: zhTW });
}

export function formatDayLabel(dateStr: string, index: number): string {
  return `第 ${index + 1} 天 · ${format(parseISO(dateStr), 'M月d日', { locale: zhTW })}`;
}

export function groupEventsByDate<T extends { date: string }>(events: T[]): Record<string, T[]> {
  return events.reduce(
    (acc, event) => {
      const date = event.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

export function sortedDates(dateMap: Record<string, unknown[]>): string[] {
  return Object.keys(dateMap).sort();
}
