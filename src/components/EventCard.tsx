import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatDayShort, formatTimeRange, relativeDay } from "@/lib/dates";
import { formatPeso } from "@/lib/money";
import { kindMeta, type EventRow } from "@/lib/types";

type Counts = { going: number; attended: number; unpaid: number } | undefined;

export function EventCard({
  event,
  counts,
  past = false,
}: {
  event: EventRow;
  counts: Counts;
  past?: boolean;
}) {
  const meta = kindMeta(event.kind);
  const going = counts?.going ?? 0;
  const attended = counts?.attended ?? 0;
  const unpaid = counts?.unpaid ?? 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className={`block rounded-2xl border bg-white p-4 transition hover:border-emerald-400 active:scale-[0.995] dark:bg-stone-900 ${
        past
          ? "border-stone-200 opacity-80 dark:border-stone-800"
          : "border-stone-200 dark:border-stone-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {meta.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{event.title}</p>

          <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">
            <span className={past ? "" : "font-medium text-emerald-700 dark:text-emerald-400"}>
              {relativeDay(event.starts_at)}
            </span>
            <span className="text-stone-400"> · </span>
            {formatDayShort(event.starts_at)}
            <span className="text-stone-400"> · </span>
            {formatTimeRange(event.starts_at, event.ends_at)}
          </p>

          {event.venue_name && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-stone-500 dark:text-stone-400">
              <MapPin size={13} className="shrink-0" />
              {event.venue_name}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            {past ? (
              <Badge tone="neutral">{attended} came</Badge>
            ) : (
              <Badge tone="green">{going} going</Badge>
            )}

            {event.total_cost != null && (
              <Badge tone="neutral">{formatPeso(event.total_cost)}</Badge>
            )}

            {unpaid > 0 && <Badge tone="amber">{unpaid} unpaid</Badge>}
            {past && attended > 0 && unpaid === 0 && event.total_cost != null && (
              <Badge tone="green">All paid</Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "amber" | "neutral";
}) {
  const tones = {
    green:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    neutral: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
