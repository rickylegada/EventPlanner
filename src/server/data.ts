import "server-only";
import { db, unwrap } from "@/lib/supabase";
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

export async function getPlayers(): Promise<Player[]> {
  const rows = unwrap(await db().from("players").select("*").order("name"));
  return rows as Player[];
}

export async function getEvents(): Promise<EventRow[]> {
  const rows = unwrap(
    await db().from("events").select("*").order("starts_at", { ascending: true }),
  );
  return (rows as Record<string, unknown>[]).map(normalizeEvent);
}

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

/** Counts of players per event, keyed by event id — for the list and calendar. */
export async function getEventCounts(): Promise<
  Record<string, { going: number; attended: number; unpaid: number }>
> {
  const rows = unwrap(
    await db().from("event_players").select("event_id, rsvp, attended, paid"),
  ) as { event_id: string; rsvp: string; attended: boolean; paid: boolean }[];

  const counts: Record<string, { going: number; attended: number; unpaid: number }> = {};
  for (const r of rows) {
    const c = (counts[r.event_id] ??= { going: 0, attended: 0, unpaid: 0 });
    if (r.rsvp === "going") c.going += 1;
    if (r.attended) {
      c.attended += 1;
      if (!r.paid) c.unpaid += 1;
    }
  }
  return counts;
}
