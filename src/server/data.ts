import "server-only";
import { cache } from "react";
import { db, unwrap } from "@/lib/supabase";
import { splitCost, type MoneyRow } from "@/lib/money";
import { buildSummary } from "@/lib/summary";
import type { EventRow, Participant, Player } from "@/lib/types";

/** Postgres `numeric` can arrive as a string; make it a number or null. */
const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

const normalizeEvent = (row: Record<string, unknown>): EventRow => ({
  ...(row as unknown as EventRow),
  total_cost: num(row.total_cost),
});

const byName = (a: { player: Player }, b: { player: Player }) =>
  a.player.name.localeCompare(b.player.name, "en");

export const getPlayers = cache(async (): Promise<Player[]> => {
  const rows = unwrap(await db().from("players").select("*").order("name"));
  return rows as Player[];
});

export const getEvents = cache(async (): Promise<EventRow[]> => {
  const rows = unwrap(
    await db().from("events").select("*").order("starts_at", { ascending: true }),
  );
  return (rows as Record<string, unknown>[]).map(normalizeEvent);
});

export async function getEvent(id: string): Promise<EventRow | null> {
  const { data, error } = await db().from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeEvent(data) : null;
}

export async function getParticipants(eventId: string): Promise<Participant[]> {
  const rows = unwrap(
    await db()
      .from("event_players")
      .select("*, player:players(*)")
      .eq("event_id", eventId),
  ) as unknown as Participant[];

  return rows
    .map((r) => ({ ...r, share_override: num(r.share_override) }))
    .sort(byName);
}

export const toMoneyRows = (list: Participant[]): MoneyRow[] =>
  list.map((p) => ({
    playerId: p.player_id,
    attended: p.attended,
    shareOverride: p.share_override,
    paid: p.paid,
  }));

/**
 * Everything the event list and calendar cards need, worked out in one pass:
 * headcounts plus the money position, so a card can say "4 going · ₱500 each"
 * without each card hitting the database.
 */
export type EventSummary = {
  going: number;
  maybe: number;
  attended: number;
  unpaid: number;
  /** Total still owed across everyone who has not paid. */
  outstanding: number;
  collected: number;
  /** The per-head amount, or null when shares differ because of overrides. */
  perHead: number | null;
  /** Headcount the cost would be split between right now. */
  splitAmong: number;
  /** The pasteable group-chat text for this event, built server side. */
  shareText: string;
};

const EMPTY_SUMMARY: EventSummary = {
  going: 0,
  maybe: 0,
  attended: 0,
  unpaid: 0,
  outstanding: 0,
  collected: 0,
  perHead: null,
  splitAmong: 0,
  shareText: "",
};

export const getEventSummaries = cache(async (): Promise<Record<string, EventSummary>> => {
  const [events, rows] = await Promise.all([
    getEvents(),
    db()
      .from("event_players")
      .select("*, player:players(*)")
      .then(unwrap) as Promise<
      Participant[]
    >,
  ]);

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = grouped.get(r.event_id);
    if (list) list.push(r);
    else grouped.set(r.event_id, [r]);
  }

  const out: Record<string, EventSummary> = {};

  for (const event of events) {
    const list = grouped.get(event.id) ?? [];
    const summary: EventSummary = { ...EMPTY_SUMMARY };

    for (const r of list) {
      if (r.rsvp === "going") summary.going += 1;
      if (r.rsvp === "maybe") summary.maybe += 1;
      if (r.attended) summary.attended += 1;
    }

    const participants = list
      .map((r) => ({ ...r, share_override: num(r.share_override) }))
      .sort(byName);

    // Before the event there is no attendance yet, so preview the split across
    // the people who said they are coming. After it, use who actually came.
    const useRsvp = summary.attended === 0 && summary.going > 0;
    const moneyRows: MoneyRow[] = list.map((r) => ({
      playerId: r.player_id,
      attended: useRsvp ? r.rsvp === "going" : r.attended,
      shareOverride: num(r.share_override),
      paid: r.paid,
    }));

    const split = splitCost(event.total_cost, moneyRows);
    const shares = split.shares.map((s) => s.share);

    // The same text the event page would produce, so sharing from a card and
    // sharing from the event itself never disagree.
    summary.shareText = buildSummary(
      event,
      participants,
      splitCost(event.total_cost, toMoneyRows(participants)),
    );

    summary.splitAmong = split.attendeeCount;
    summary.perHead =
      shares.length > 0 && shares.every((s) => s === shares[0]) ? shares[0] : null;
    summary.collected = split.collected;
    summary.outstanding = useRsvp ? 0 : split.outstanding;
    summary.unpaid = useRsvp
      ? 0
      : list.filter((r) => r.attended && !r.paid).length;

    out[event.id] = summary;
  }

  return out;
});

/**
 * QR images live in a private bucket, so the browser gets a link that expires
 * rather than a permanent public URL. Anything that fails to sign is simply
 * not shown — a broken payment image should never take the page down.
 */
export async function signQr(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await db()
    .storage.from("event-qr")
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
