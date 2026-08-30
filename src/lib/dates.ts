/**
 * Date helpers.
 *
 * Everything the dashboard stores is a calendar date (`YYYY-MM-DD`), not an
 * instant, because "did I do this habit today" is a question about the local
 * day. Vercel runs in UTC, so the app timezone comes from APP_TIMEZONE.
 */
export const TIMEZONE = process.env.APP_TIMEZONE || 'UTC';

/** Today's calendar date in the configured timezone, as YYYY-MM-DD. */
export function todayISO(): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the shape we store.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Shift a YYYY-MM-DD date by whole days. Anchored at noon UTC so that
 *  daylight-saving transitions can never move the result onto another day. */
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The `count` calendar dates ending at (and including) `endISO`. */
export function dateRange(endISO: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(endISO, i - count + 1));
}

/** "Mar 4" */
export function formatShort(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** "Mon" */
export function formatWeekday(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

/** Day of week for a YYYY-MM-DD date, 0 = Sunday. */
export function weekdayIndex(iso: string): number {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

/** A human phrase for a due date relative to today: "Today", "2d overdue", "Fri". */
export function describeDueDate(due: string, today: string): { label: string; tone: 'overdue' | 'today' | 'upcoming' } {
  if (due === today) return { label: 'Today', tone: 'today' };

  const diff = Math.round(
    (Date.parse(`${due}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000,
  );

  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, tone: 'overdue' };
  if (diff === 1) return { label: 'Tomorrow', tone: 'upcoming' };
  if (diff < 7) return { label: formatWeekday(due), tone: 'upcoming' };
  return { label: formatShort(due), tone: 'upcoming' };
}
