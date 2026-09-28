import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Pencil } from "lucide-react";
import { getCurrentPlayerId } from "@/lib/auth";
import { formatDayLong, formatTimeRange, isPast, relativeDay } from "@/lib/dates";
import { formatPeso, splitCost, type MoneyRow } from "@/lib/money";
import { buildSummary } from "@/lib/summary";
import { kindMeta } from "@/lib/types";
import { getEvent, getParticipants, getPlayers } from "@/server/data";
import { EventTabs } from "@/components/EventTabs";
import { RsvpPanel } from "@/components/RsvpPanel";
import { MoneyPanel } from "@/components/MoneyPanel";
import {
  AutoRefresh,
  CopySummaryButton,
  RepeatWeeklyButton,
} from "@/components/EventActions";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [event, participants, players, meId] = await Promise.all([
    getEvent(id),
    getParticipants(id),
    getPlayers(),
    getCurrentPlayerId(),
  ]);

  if (!event) notFound();

  const moneyRows: MoneyRow[] = participants.map((p) => ({
    playerId: p.player_id,
    attended: p.attended,
    shareOverride: p.share_override,
    paid: p.paid,
  }));

  const split = splitCost(event.total_cost, moneyRows);
  const summary = buildSummary(event, participants, split);
  const meta = kindMeta(event.kind);
  const over = isPast(event.starts_at, event.ends_at);

  const missingFromRoster = players.filter(
    (p) => p.is_active && !participants.some((x) => x.player_id === p.id),
  ).length;

  return (
    <div className="space-y-4">
      <AutoRefresh />

      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="-ml-1 flex items-center gap-0.5 py-2 text-sm text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        >
          <ChevronLeft size={16} /> Events
        </Link>
        <Link
          href={`/events/${event.id}/edit`}
          className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-2.5 text-xs font-medium text-stone-600 transition hover:bg-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <Pencil size={13} /> Edit
        </Link>
      </div>

      <header className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <h1 className="flex items-start gap-2 text-xl font-bold tracking-tight">
          <span aria-hidden>{meta.emoji}</span>
          <span className="min-w-0">{event.title}</span>
        </h1>

        <p className="mt-1.5 text-sm">
          <span
            className={
              over
                ? "text-stone-500 dark:text-stone-400"
                : "font-semibold text-emerald-700 dark:text-emerald-400"
            }
          >
            {relativeDay(event.starts_at)}
          </span>
          <span className="text-stone-400"> · </span>
          <span className="text-stone-600 dark:text-stone-300">
            {formatDayLong(event.starts_at)}
          </span>
        </p>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {formatTimeRange(event.starts_at, event.ends_at)}
        </p>

        {event.venue_name && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300">
            <MapPin size={14} className="shrink-0 text-stone-400" />
            {event.venue_name}
          </p>
        )}

        {event.maps_url && (
          <a
            href={event.maps_url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            <MapPin size={15} /> Open in Google Maps
          </a>
        )}

        {event.notes && (
          <p className="mt-3 rounded-lg bg-stone-100 px-3 py-2 text-sm whitespace-pre-wrap text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            {event.notes}
          </p>
        )}

        {event.total_cost != null && (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            Venue cost{" "}
            <strong className="text-stone-800 dark:text-stone-100">
              {formatPeso(event.total_cost)}
            </strong>
            , split between whoever came.
          </p>
        )}
      </header>

      <EventTabs
        initial={over ? "money" : "rsvp"}
        moneyLabel={event.total_cost != null ? "Came & paid" : "Who came"}
        rsvpPanel={
          <RsvpPanel
            eventId={event.id}
            participants={participants}
            meId={meId}
            missingFromRoster={missingFromRoster}
          />
        }
        moneyPanel={
          <MoneyPanel
            eventId={event.id}
            participants={participants}
            split={split}
            totalCost={event.total_cost}
            meId={meId}
          />
        }
      />

      <div className="flex gap-2">
        <CopySummaryButton text={summary} />
        <RepeatWeeklyButton eventId={event.id} />
      </div>
    </div>
  );
}
