import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  manilaDateKey,
  manilaToday,
  monthGrid,
  monthLabel,
  shiftMonth,
} from "@/lib/dates";
import { kindMeta } from "@/lib/types";
import { getEventSummaries, getEvents } from "@/server/data";
import { EventCard } from "@/components/EventCard";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function parseMonth(raw: string | undefined) {
  const match = /^(\d{4})-(\d{2})$/.exec(raw ?? "");
  if (!match) {
    const today = manilaToday();
    return { year: today.year, month: today.month };
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

const toParam = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const { year, month } = parseMonth(m);

  const [events, summaries] = await Promise.all([getEvents(), getEventSummaries()]);

  // Group every event by its Manila calendar day.
  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = manilaDateKey(e.starts_at);
    const list = byDay.get(key);
    if (list) list.push(e);
    else byDay.set(key, [e]);
  }

  const cells = monthGrid(year, month);
  const monthPrefix = toParam(year, month);
  const inMonth = events.filter((e) => manilaDateKey(e.starts_at).startsWith(monthPrefix));

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/calendar?m=${toParam(prev.year, prev.month)}`}
          aria-label="Previous month"
          className="rounded-lg p-3 text-stone-500 transition hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">{monthLabel(year, month)}</h1>
        <Link
          href={`/calendar?m=${toParam(next.year, next.month)}`}
          aria-label="Next month"
          className="rounded-lg p-3 text-stone-500 transition hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-2 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
        <div className="grid grid-cols-7 pb-1">
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              className="text-center text-[11px] font-semibold text-stone-400 dark:text-stone-500"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell) => {
            const dayEvents = byDay.get(cell.key) ?? [];
            const content = (
              <>
                <span
                  className={`text-sm ${
                    cell.isToday
                      ? "flex size-6 items-center justify-center rounded-full bg-emerald-600 font-bold text-white"
                      : cell.inMonth
                        ? ""
                        : "text-stone-300 dark:text-stone-600"
                  }`}
                >
                  {cell.day}
                </span>
                <span className="flex h-2 items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="size-1.5 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                  ))}
                </span>
              </>
            );

            const className = `flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg ${
              dayEvents.length > 0
                ? "bg-emerald-50 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40"
                : ""
            }`;

            return dayEvents.length > 0 ? (
              <Link
                key={cell.key}
                href={`#e-${dayEvents[0].id}`}
                title={dayEvents.map((e) => `${kindMeta(e.kind).emoji} ${e.title}`).join(", ")}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <div key={cell.key} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
          {monthLabel(year, month)}
        </h2>

        {inMonth.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            Nothing scheduled this month.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {inMonth.map((e) => (
              <li key={e.id} id={`e-${e.id}`} className="scroll-mt-20">
                <EventCard event={e} summary={summaries[e.id]} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
