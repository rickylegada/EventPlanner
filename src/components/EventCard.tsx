import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import {
  durationLabel,
  eventPhase,
  formatDayShort,
  formatTimeRange,
  relativeDay,
} from "@/lib/dates";
import { formatPeso } from "@/lib/money";
import { kindMeta, type EventRow } from "@/lib/types";
import type { EventSummary } from "@/server/data";

export function EventCard({
  event,
  summary,
}: {
  event: EventRow;
  summary: EventSummary | undefined;
}) {
  const meta = kindMeta(event.kind);
  const phase = eventPhase(event.starts_at, event.ends_at);
  const past = phase === "past";

  const s = summary;
  const headcount = past ? (s?.attended ?? 0) : (s?.going ?? 0);
  const perHead = s?.perHead ?? null;
  const unpaid = s?.unpaid ?? 0;
  const outstanding = s?.outstanding ?? 0;
  const hasCost = event.total_cost != null && event.total_cost > 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className={`block rounded-2xl border bg-white p-4 transition hover:border-emerald-400 active:scale-[0.995] dark:bg-stone-900 ${
        phase === "live"
          ? "border-emerald-400 ring-2 ring-emerald-500/20 dark:border-emerald-600"
          : "border-stone-200 dark:border-stone-800"
      } ${past ? "opacity-90" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {meta.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 truncate font-semibold">{event.title}</p>
            {phase === "live" && (
              <span className="shrink-0 animate-pulse rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                NOW
              </span>
            )}
          </div>

          <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">
            <span
              className={past ? "" : "font-medium text-emerald-700 dark:text-emerald-400"}
            >
              {relativeDay(event.starts_at)}
            </span>
            <span className="text-stone-400"> · </span>
            {formatDayShort(event.starts_at)}
            <span className="text-stone-400"> · </span>
            {formatTimeRange(event.starts_at, event.ends_at)}
            {event.ends_at && (
              <span className="text-stone-400">
                {" "}
                ({durationLabel(event.starts_at, event.ends_at)})
              </span>
            )}
          </p>

          {event.venue_name && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-stone-500 dark:text-stone-400">
              <MapPin size={13} className="shrink-0" />
              {event.venue_name}
            </p>
          )}
        </div>
      </div>

      {/*
        The two numbers people actually open the app for: how many are in, and
        what it costs each of them. Given their own row so they read at a glance.
      */}
      <div className="mt-3 flex items-stretch gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Users size={16} className="shrink-0 text-stone-400" />
          <div className="min-w-0">
            <p className="text-lg leading-none font-bold tabular-nums">
              {headcount}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-stone-500 dark:text-stone-400">
              {past ? "came" : headcount === 1 ? "person in" : "people in"}
            </p>
          </div>
        </div>

        {hasCost && (
          <div className="min-w-0 flex-1 border-l border-stone-100 pl-3 dark:border-stone-800">
            {/*
              Before the event the split is guesswork, so show the venue cost
              itself. Only once people are ticked off does a per-head figure
              mean anything.
            */}
            <p className="truncate text-lg leading-none font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {past && perHead !== null && perHead > 0
                ? formatPeso(perHead)
                : formatPeso(event.total_cost!)}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-stone-500 dark:text-stone-400">
              {past && perHead !== null && perHead > 0 ? "each" : "venue"}
            </p>
          </div>
        )}

        {hasCost && past && (
          <div className="min-w-0 flex-1 border-l border-stone-100 pl-3 dark:border-stone-800">
            <p
              className={`truncate text-lg leading-none font-bold tabular-nums ${
                unpaid > 0
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-stone-400 dark:text-stone-500"
              }`}
            >
              {unpaid > 0 ? formatPeso(outstanding) : "✓"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-stone-500 dark:text-stone-400">
              {unpaid > 0 ? `${unpaid} unpaid` : "all paid"}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
