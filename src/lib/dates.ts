/**
 * Everything date-related is displayed in Manila time, no matter where the
 * browser or the server happens to be. Timestamps are stored in the database
 * as UTC (timestamptz) and converted at the edges only.
 */
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const MANILA = "Asia/Manila";

const asDate = (value: string | Date) =>
  value instanceof Date ? value : new Date(value);

/** "2026-10-04" — the civil date in Manila. Used as a calendar-cell key. */
export function manilaDateKey(value: string | Date): string {
  return formatInTimeZone(asDate(value), MANILA, "yyyy-MM-dd");
}

/** "Sat, Oct 4" */
export function formatDayShort(value: string | Date): string {
  return formatInTimeZone(asDate(value), MANILA, "EEE, MMM d");
}

/** "Saturday, October 4, 2026" */
export function formatDayLong(value: string | Date): string {
  return formatInTimeZone(asDate(value), MANILA, "EEEE, MMMM d, yyyy");
}

/** "6:00 PM" */
export function formatTime(value: string | Date): string {
  return formatInTimeZone(asDate(value), MANILA, "h:mm a");
}

/** "6:00 PM – 8:00 PM", or just "6:00 PM" when there's no end time. */
export function formatTimeRange(
  startsAt: string | Date,
  endsAt?: string | Date | null,
): string {
  const start = formatTime(startsAt);
  return endsAt ? `${start} – ${formatTime(endsAt)}` : start;
}

/** The value a <input type="datetime-local"> expects, in Manila time. */
export function toLocalInputValue(value: string | Date): string {
  return formatInTimeZone(asDate(value), MANILA, "yyyy-MM-dd'T'HH:mm");
}

/** Turns "2026-10-04T18:00" (understood as Manila time) into a UTC ISO string. */
export function fromLocalInputValue(value: string): string {
  return fromZonedTime(value, MANILA).toISOString();
}

/** An event is "over" once its end time (or start time) has passed. */
export function isPast(
  startsAt: string | Date,
  endsAt?: string | Date | null,
): boolean {
  return asDate(endsAt ?? startsAt).getTime() < Date.now();
}

/** "Today", "Tomorrow", "In 5 days", "Yesterday", "12 days ago"… */
export function relativeDay(value: string | Date): string {
  const target = manilaDateKey(value);
  const today = manilaDateKey(new Date());

  const days = Math.round(
    (Date.parse(`${target}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      86_400_000,
  );

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 7) return formatInTimeZone(asDate(value), MANILA, "EEEE");
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/** Today's civil date in Manila, as { year, month } with month 1-12. */
export function manilaToday(): { year: number; month: number; day: number } {
  const [year, month, day] = manilaDateKey(new Date()).split("-").map(Number);
  return { year, month, day };
}

export type CalendarCell = {
  /** "2026-10-04" */
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
};

/**
 * A 6-row x 7-column grid of civil dates for the given month, padded with the
 * tail of the previous month and the head of the next so the weeks line up.
 * Weeks start on Sunday, which is what everyone here expects on a calendar.
 */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const todayKey = manilaDateKey(new Date());
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const leadingBlanks = firstOfMonth.getUTCDay();

  return Array.from({ length: 42 }, (_, i) => {
    const cellDate = new Date(
      Date.UTC(year, month - 1, 1 - leadingBlanks + i),
    );
    const key = cellDate.toISOString().slice(0, 10);
    return {
      key,
      day: cellDate.getUTCDate(),
      inMonth: cellDate.getUTCMonth() === month - 1,
      isToday: key === todayKey,
    };
  });
}

/** "October 2026" */
export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Steps a { year, month } pair forwards or backwards, rolling the year over. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zeroBased = month - 1 + delta;
  return {
    year: year + Math.floor(zeroBased / 12),
    month: ((zeroBased % 12) + 12) % 12 + 1,
  };
}
