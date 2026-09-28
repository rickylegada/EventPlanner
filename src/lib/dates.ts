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

/**
 * Events with no end time are treated as running for three hours, so a session
 * does not flip to "past" the moment it starts.
 */
const ASSUMED_LENGTH_MS = 3 * 60 * 60 * 1000;

export function effectiveEnd(
  startsAt: string | Date,
  endsAt?: string | Date | null,
): Date {
  return endsAt
    ? asDate(endsAt)
    : new Date(asDate(startsAt).getTime() + ASSUMED_LENGTH_MS);
}

export type EventPhase = "upcoming" | "live" | "past";

/**
 * Drives the whole event screen: before it starts you are collecting RSVPs,
 * from the moment it starts you are ticking off who actually turned up.
 */
export function eventPhase(
  startsAt: string | Date,
  endsAt?: string | Date | null,
  now: number = Date.now(),
): EventPhase {
  if (now < asDate(startsAt).getTime()) return "upcoming";
  if (now < effectiveEnd(startsAt, endsAt).getTime()) return "live";
  return "past";
}

/** An event is "over" once its end time (or assumed end) has passed. */
export function isPast(
  startsAt: string | Date,
  endsAt?: string | Date | null,
): boolean {
  return eventPhase(startsAt, endsAt) === "past";
}

/** "2026-09-25" plus 1 -> "2026-09-26". Plain civil-date arithmetic. */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Turns a date ("2026-09-25") and a time ("21:00"), both understood as Manila
 * time, into a UTC ISO string.
 */
export function combineDateTime(dateKey: string, time: string): string {
  return fromZonedTime(`${dateKey}T${time}`, MANILA).toISOString();
}

/**
 * The end time for a one-day event. A night session can run past midnight —
 * 9:00 PM to 3:00 AM means 3 AM the *next* day, not a negative six hours.
 */
export function endFromSameDay(
  dateKey: string,
  startTime: string,
  endTime: string,
): string {
  const sameDay = combineDateTime(dateKey, endTime);
  if (Date.parse(sameDay) > Date.parse(combineDateTime(dateKey, startTime))) {
    return sameDay;
  }
  return combineDateTime(addDays(dateKey, 1), endTime);
}

/** The pieces a simple one-day form needs: "2026-09-25", "21:00", "03:00". */
export function toDateAndTimes(startsAt: string | Date, endsAt?: string | Date | null) {
  return {
    date: manilaDateKey(startsAt),
    startTime: formatInTimeZone(asDate(startsAt), MANILA, "HH:mm"),
    endTime: endsAt ? formatInTimeZone(asDate(endsAt), MANILA, "HH:mm") : "",
  };
}

/** "6 hours", "1 hr 30 min", "45 min". */
export function durationLabel(
  startsAt: string | Date,
  endsAt: string | Date,
): string {
  return formatMinutes(
    Math.round((asDate(endsAt).getTime() - asDate(startsAt).getTime()) / 60000),
  );
}

/**
 * Minutes between two "HH:mm" clock times, rolling past midnight so
 * 21:00 -> 03:00 reads as six hours rather than minus eighteen. Null until
 * both times are filled in. Used by the event form to show the length live.
 */
export function minutesBetweenClockTimes(
  start: string,
  end: string,
): number | null {
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return minutes <= 0 ? minutes + 24 * 60 : minutes;
}

/** "6 hours", "1 hr 30 min", "45 min". */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours} hr ${mins} min`;
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
