import Link from "next/link";
import { Check, MapPin, Users } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
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
    // The link is stretched across the whole card rather than wrapping it, so
    // the share button can live inside without nesting a button in an anchor.
    <div
      className={`relative rounded-2xl border bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:bg-stone-900 dark:shadow-none ${
        phase === "live"
          ? "border-emerald-400 ring-2 ring-emerald-500/20 dark:border-emerald-600"
          : "border-stone-200 dark:border-stone-800"
      }`}
    >
      <Link
        href={`/events/${event.id}`}
        aria-label={`Open ${event.title}`}
        className="absolute inset-0 rounded-2xl"
      />

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

        <ShareButton
          text={summary?.shareText ?? event.title}
          title={event.title}
          className="-mt-1 -mr-1"
        />
      </div>

      {/*
        The two numbers people actually open the app for: how many are in, and
        what it costs each of them. Given their own row so they read at a glance.
      */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Stat
          icon={<Users size={13} />}
          value={headcount}
          label={past ? "came" : "going"}
          tone={past ? "plain" : "green"}
        />

        {hasCost && (
          // Before the event the split is guesswork, so show the venue cost
          // itself. Only once people are ticked off does per-head mean anything.
          <Stat
            value={
              past && perHead !== null && perHead > 0
                ? formatPeso(perHead)
                : formatPeso(event.total_cost!)
            }
            label={past && perHead !== null && perHead > 0 ? "each" : "venue"}
            tone="plain"
          />
        )}

        {hasCost && past && unpaid > 0 && (
          <Stat value={formatPeso(outstanding)} label="unpaid" tone="amber" />
        )}

        {hasCost && past && unpaid === 0 && headcount > 0 && (
          <Stat icon={<Check size={13} />} label="all paid" tone="green" />
        )}
      </div>
    </div>
  );
}

/**
 * One soft chip per number. Chips instead of a divided grid: no rules to draw,
 * they wrap on a narrow phone, and an empty one simply is not rendered — so a
 * free event or an unpaid-free event does not leave a hole in the layout.
 */
function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon?: React.ReactNode;
  value?: React.ReactNode;
  label: string;
  tone: "green" | "amber" | "plain";
}) {
  const tones = {
    green:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    plain: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm ${tones[tone]}`}
    >
      {icon && <span className="opacity-60">{icon}</span>}
      {value !== undefined && (
        <span className="font-semibold tabular-nums">{value}</span>
      )}
      <span className="text-xs opacity-70">{label}</span>
    </span>
  );
}
