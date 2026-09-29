import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Pencil, QrCode } from "lucide-react";
import { getCurrentPlayerId } from "@/lib/auth";
import {
  durationLabel,
  eventPhase,
  formatDayLong,
  formatTimeRange,
  relativeDay,
} from "@/lib/dates";
import { computeMoney, formatPeso } from "@/lib/money";
import { buildSummary } from "@/lib/summary";
import { eventPricing, hasCost, kindMeta } from "@/lib/types";
import { qrLabel } from "@/lib/payments";
import {
  getEvent,
  getParticipants,
  getPlayers,
  signQr,
  toMoneyRows,
} from "@/server/data";
import { RsvpPanel } from "@/components/RsvpPanel";
import { MoneyPanel } from "@/components/MoneyPanel";
import { PayWith, type PayOption } from "@/components/PayWith";
import { AutoRefresh } from "@/components/EventActions";
import { ShareButton } from "@/components/ShareButton";

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

  const split = computeMoney(eventPricing(event), toMoneyRows(participants));
  const summary = buildSummary(event, participants, split);
  const meta = kindMeta(event.kind);

  // The single most important line of this file: before it starts you are
  // collecting RSVPs, from the moment it starts you are ticking off who came.
  const phase = eventPhase(event.starts_at, event.ends_at);
  const collectingRsvps = phase === "upcoming";

  const missingFromRoster = players.filter(
    (p) => p.is_active && !participants.some((x) => x.player_id === p.id),
  ).length;

  const [qrOne, qrTwo] = await Promise.all([
    signQr(event.qr_one_path),
    signQr(event.qr_two_path),
  ]);
  const payOptions: PayOption[] = [
    qrOne ? { label: qrLabel("one"), url: qrOne } : null,
    qrTwo ? { label: qrLabel("two"), url: qrTwo } : null,
  ].filter(Boolean) as PayOption[];

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
        {/* Actions live up here beside Edit, not in a bar at the bottom. */}
        <div className="flex items-center gap-1">
          <ShareButton text={summary} title={event.title} />
          <Link
            href={`/events/${event.id}/edit`}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-2.5 text-xs font-medium text-stone-600 transition hover:bg-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <Pencil size={13} /> Edit
          </Link>
        </div>
      </div>

      <header className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
        <div className="flex items-start gap-2">
          <span className="text-xl leading-tight" aria-hidden>
            {meta.emoji}
          </span>
          <h1 className="min-w-0 flex-1 text-xl font-bold tracking-tight">
            {event.title}
          </h1>
          {phase === "live" && (
            <span className="shrink-0 animate-pulse rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
              HAPPENING NOW
            </span>
          )}
        </div>

        <p className="mt-1.5 text-sm">
          <span
            className={
              phase === "past"
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
          {event.ends_at && (
            <span className="text-stone-400">
              {" "}
              · {durationLabel(event.starts_at, event.ends_at)}
            </span>
          )}
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

        {hasCost(event) && collectingRsvps && (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            {event.pricing_mode === "per_head" ? (
              <>
                <strong className="text-stone-800 dark:text-stone-100">
                  {formatPeso(event.price_per_head as number)}
                </strong>{" "}
                per player.
              </>
            ) : (
              <>
                Venue cost{" "}
                <strong className="text-stone-800 dark:text-stone-100">
                  {formatPeso(event.total_cost as number)}
                </strong>
                , split between whoever turns up.
              </>
            )}
          </p>
        )}
      </header>

      {/*
        Payment details are added after the event is created — before or after
        the session — so nudge for them whenever money is involved and they
        are still missing.
      */}
      {hasCost(event) &&
        !event.gcash_number &&
        payOptions.length === 0 && (
          <Link
            href={`/events/${event.id}/edit`}
            className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 py-2.5 text-sm text-stone-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-stone-700 dark:text-stone-300 dark:hover:text-emerald-400"
          >
            <QrCode size={15} className="shrink-0 text-stone-400" />
            <span className="flex-1">Add a GCash number or QR so people can pay you</span>
            <span className="text-stone-400">›</span>
          </Link>
        )}

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
          {collectingRsvps ? "Who's coming" : "Who came"}
        </h2>

        {collectingRsvps ? (
          <RsvpPanel
            eventId={event.id}
            participants={participants}
            meId={meId}
            missingFromRoster={missingFromRoster}
          />
        ) : (
          <>
            <MoneyPanel
              eventId={event.id}
              participants={participants}
              split={split}
              hasMoney={hasCost(event)}
              perHeadPrice={
                event.pricing_mode === "per_head" ? event.price_per_head : null
              }
              meId={meId}
            />
            {split.outstanding > 0 && (
              <PayWith
                gcashName={event.gcash_name}
                gcashNumber={event.gcash_number}
                options={payOptions}
              />
            )}
          </>
        )}
      </section>

    </div>
  );
}
