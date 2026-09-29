"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import {
  getCurrentPlayerId,
  isSignedIn,
  setCurrentPlayerId,
  signIn,
  signOut,
} from "@/lib/auth";
import { combineDateTime, endFromSameDay } from "@/lib/dates";
import { canManageEvent, getViewer } from "@/server/permissions";
import type { EventKind, Rsvp } from "@/lib/types";

/**
 * Every Server Action is a public HTTP endpoint, so each one re-checks the
 * session. Past that check there are no permissions: anyone in the group can
 * edit anything, which is the whole point.
 */
async function guard() {
  if (!(await isSignedIn())) throw new Error("Not signed in.");
}

function refreshEvent(eventId: string) {
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
  revalidatePath("/calendar");
}

const trimmed = (form: FormData, key: string): string =>
  String(form.get(key) ?? "").trim();

const nullable = (form: FormData, key: string): string | null =>
  trimmed(form, key) || null;

/** "2,000" or "P2000" or "" becomes 2000 / null. */
function parseAmount(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const ok = await signIn(trimmed(form, "passcode"));
  if (!ok) return { error: "That passcode does not match. Try again." };
  redirect("/");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function chooseMeAction(form: FormData) {
  await guard();
  const playerId = trimmed(form, "playerId");
  const newName = trimmed(form, "newName");

  if (newName) {
    const created = await upsertPlayerByName(newName);
    await setCurrentPlayerId(created.id);
  } else if (playerId) {
    await setCurrentPlayerId(playerId);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

const COLORS = ["emerald", "sky", "amber", "rose", "violet", "teal", "orange"];

/** Finds a player by name (case-insensitively) or creates them. */
async function upsertPlayerByName(name: string) {
  const existing = await db()
    .from("players")
    .select("*")
    .ilike("name", name)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data as { id: string; name: string };

  const created = await db()
    .from("players")
    .insert({ name, color: COLORS[Math.floor(Math.random() * COLORS.length)] })
    .select("*")
    .single();

  if (created.error) throw new Error(created.error.message);
  return created.data as { id: string; name: string };
}

export async function addPlayerAction(form: FormData) {
  await guard();
  const name = trimmed(form, "name");
  if (!name) return;
  await upsertPlayerByName(name);
  revalidatePath("/players");
}

export async function renamePlayerAction(playerId: string, name: string) {
  await guard();
  const clean = name.trim();
  if (!clean) return;
  const { error } = await db().from("players").update({ name: clean }).eq("id", playerId);
  if (error) throw new Error(error.message);
  revalidatePath("/players");
  revalidatePath("/", "layout");
}

export async function setPlayerActiveAction(playerId: string, isActive: boolean) {
  await guard();
  const { error } = await db()
    .from("players")
    .update({ is_active: isActive })
    .eq("id", playerId);
  if (error) throw new Error(error.message);
  revalidatePath("/players");
}

/**
 * Admins can delete anyone's event. See permissions.ts — with one shared
 * passcode this is about intent and avoiding mis-taps, not security.
 */
export async function setPlayerAdminAction(playerId: string, isAdmin: boolean) {
  await guard();
  const { error } = await db()
    .from("players")
    .update({ is_admin: isAdmin })
    .eq("id", playerId);
  if (error) throw new Error(error.message);
  revalidatePath("/players");
  revalidatePath("/", "layout");
}

export async function deletePlayerAction(playerId: string) {
  await guard();
  const { error } = await db().from("players").delete().eq("id", playerId);
  if (error) throw new Error(error.message);
  revalidatePath("/players");
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type EventFormState = { error?: string };

const MAX_EVENT_HOURS = 18;

/**
 * An event happens on one day: one date, a start time and an optional end
 * time. A finish time earlier than the start means it runs past midnight
 * (9 PM to 3 AM), which `endFromSameDay` rolls onto the next day.
 */
function readEventForm(form: FormData) {
  const title = trimmed(form, "title");
  const date = trimmed(form, "event_date");
  const startTime = trimmed(form, "start_time");
  const endTime = trimmed(form, "end_time");

  if (!title) return { error: "Give the event a name." as const };
  if (!date) return { error: "Pick the date." as const };
  if (!startTime) return { error: "Pick a start time." as const };

  const starts_at = combineDateTime(date, startTime);
  const ends_at = endTime ? endFromSameDay(date, startTime, endTime) : null;

  if (ends_at) {
    const hours = (Date.parse(ends_at) - Date.parse(starts_at)) / 3_600_000;
    if (hours > MAX_EVENT_HOURS) {
      return {
        error:
          `That works out to ${Math.round(hours)} hours. Check the times — ` +
          "an end time before the start time is treated as the next morning.",
      } as const;
    }
  }

  const perHead = trimmed(form, "pricing_mode") === "per_head";
  const amount = parseAmount(nullable(form, "amount"));

  return {
    values: {
      title,
      kind: (trimmed(form, "kind") || "pickleball") as EventKind,
      starts_at,
      ends_at,
      venue_name: nullable(form, "venue_name"),
      maps_url: nullable(form, "maps_url"),
      notes: nullable(form, "notes"),
      // Only one of these is ever set; the other is cleared so a stale figure
      // cannot resurface when the mode changes.
      pricing_mode: perHead ? "per_head" : "split",
      total_cost: perHead ? null : amount,
      price_per_head: perHead ? amount : null,
    },
  };
}

export async function createEventAction(
  _prev: EventFormState,
  form: FormData,
): Promise<EventFormState> {
  await guard();
  const parsed = readEventForm(form);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await db()
    .from("events")
    .insert({ ...parsed.values, created_by: await getCurrentPlayerId() })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Start the event off with the whole active roster so people can RSVP.
  if (trimmed(form, "invite_all") === "on") {
    await inviteActiveRoster(data.id as string);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(`/events/${data.id}`);
}

export async function updateEventAction(
  _prev: EventFormState,
  form: FormData,
): Promise<EventFormState> {
  await guard();
  const id = trimmed(form, "id");
  const parsed = readEventForm(form);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await db().from("events").update(parsed.values).eq("id", id);
  if (error) return { error: error.message };

  refreshEvent(id);
  redirect(`/events/${id}`);
}

/**
 * Only the organiser or an admin deletes an event. Checked here as well as in
 * the UI, because a Server Action is a public endpoint — though see
 * `permissions.ts`: with a shared passcode this is a guard rail, not a lock.
 */
export async function deleteEventAction(eventId: string) {
  await guard();

  const event = await db()
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .maybeSingle();
  if (event.error) throw new Error(event.error.message);
  if (!event.data) return;

  if (!canManageEvent(await getViewer(), event.data)) {
    throw new Error("Only the organiser of this event, or an admin, can delete it.");
  }

  // Clean up any payment QR images so the storage bucket does not collect
  // orphans once the event row is gone.
  await db().storage.from(QR_BUCKET).remove(await qrPathsFor(eventId));

  const { error } = await db().from("events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/calendar");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Payment QR images
// ---------------------------------------------------------------------------

const QR_BUCKET = "event-qr";
const MAX_QR_BYTES = 5 * 1024 * 1024;
const QR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type QrSlot = "one" | "two";
const slotColumn = (slot: QrSlot) => (slot === "one" ? "qr_one_path" : "qr_two_path");

async function qrPathsFor(eventId: string): Promise<string[]> {
  const { data } = await db()
    .from("events")
    .select("qr_one_path, qr_two_path")
    .eq("id", eventId)
    .maybeSingle();
  return [data?.qr_one_path, data?.qr_two_path].filter(Boolean) as string[];
}

export type PaymentState = { error?: string; saved?: boolean };

/**
 * Payment details live on their own, apart from the event form, because
 * organisers fill them in separately — often only once people start asking
 * where to send the money.
 */
export async function savePaymentDetailsAction(
  eventId: string,
  _prev: PaymentState,
  form: FormData,
): Promise<PaymentState> {
  await guard();
  const { error } = await db()
    .from("events")
    .update({
      gcash_name: nullable(form, "gcash_name"),
      gcash_number: nullable(form, "gcash_number"),
    })
    .eq("id", eventId);
  if (error) return { error: error.message };

  refreshEvent(eventId);
  return { saved: true };
}

export type QrState = { error?: string; ok?: boolean };

export async function uploadQrAction(
  eventId: string,
  slot: QrSlot,
  _prev: QrState,
  form: FormData,
): Promise<QrState> {
  await guard();

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first." };
  }
  const ext = QR_TYPES[file.type];
  if (!ext) return { error: "That needs to be a PNG, JPG or WebP image." };
  if (file.size > MAX_QR_BYTES) {
    return { error: "That image is over 5 MB. Try a screenshot instead of a photo." };
  }

  const column = slotColumn(slot);
  const previous = (
    await db().from("events").select(column).eq("id", eventId).maybeSingle()
  ).data as Record<string, string | null> | null;

  const path = `${eventId}/${slot}-${Date.now()}.${ext}`;
  const upload = await db()
    .storage.from(QR_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upload.error) return { error: upload.error.message };

  const { error } = await db()
    .from("events")
    .update({ [column]: path })
    .eq("id", eventId);
  if (error) return { error: error.message };

  const old = previous?.[column];
  if (old && old !== path) await db().storage.from(QR_BUCKET).remove([old]);

  refreshEvent(eventId);
  return { ok: true };
}

export async function removeQrAction(eventId: string, slot: QrSlot) {
  await guard();
  const column = slotColumn(slot);

  const row = (await db().from("events").select(column).eq("id", eventId).maybeSingle())
    .data as Record<string, string | null> | null;
  const path = row?.[column];

  if (path) await db().storage.from(QR_BUCKET).remove([path]);

  const { error } = await db()
    .from("events")
    .update({ [column]: null })
    .eq("id", eventId);
  if (error) throw new Error(error.message);

  refreshEvent(eventId);
}

/**
 * "Repeat next week": same title, venue, cost and time, moved forward 7 days,
 * carrying over the people who were on the original with RSVPs reset.
 */
export async function repeatWeeklyAction(eventId: string) {
  await guard();
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  const source = await db().from("events").select("*").eq("id", eventId).single();
  if (source.error) throw new Error(source.error.message);
  const e = source.data;

  const created = await db()
    .from("events")
    .insert({
      title: e.title,
      kind: e.kind,
      starts_at: new Date(Date.parse(e.starts_at) + WEEK).toISOString(),
      ends_at: e.ends_at ? new Date(Date.parse(e.ends_at) + WEEK).toISOString() : null,
      venue_name: e.venue_name,
      maps_url: e.maps_url,
      notes: e.notes,
      total_cost: e.total_cost,
      pricing_mode: e.pricing_mode,
      price_per_head: e.price_per_head,
      gcash_name: e.gcash_name,
      gcash_number: e.gcash_number,
      qr_one_label: e.qr_one_label,
      qr_two_label: e.qr_two_label,
      created_by: await getCurrentPlayerId(),
    })
    .select("id")
    .single();
  if (created.error) throw new Error(created.error.message);

  // Give the copy its own QR files. Sharing the originals would break this
  // event the day somebody deletes the one it was copied from.
  for (const slot of ["one", "two"] as QrSlot[]) {
    const from = slot === "one" ? e.qr_one_path : e.qr_two_path;
    if (!from) continue;
    const to = `${created.data.id}/${slot}-${Date.now()}.${from.split(".").pop()}`;
    const copied = await db().storage.from(QR_BUCKET).copy(from, to);
    if (!copied.error) {
      await db()
        .from("events")
        .update({ [slotColumn(slot)]: to })
        .eq("id", created.data.id);
    }
  }

  const roster = await db()
    .from("event_players")
    .select("player_id")
    .eq("event_id", eventId);
  if (roster.error) throw new Error(roster.error.message);

  if (roster.data.length > 0) {
    const { error } = await db()
      .from("event_players")
      .insert(
        roster.data.map((r) => ({
          event_id: created.data.id as string,
          player_id: r.player_id,
        })),
      );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(`/events/${created.data.id}`);
}

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------

async function inviteActiveRoster(eventId: string) {
  const players = await db().from("players").select("id").eq("is_active", true);
  if (players.error) throw new Error(players.error.message);
  if (players.data.length === 0) return;

  const { error } = await db()
    .from("event_players")
    .upsert(
      players.data.map((p) => ({ event_id: eventId, player_id: p.id })),
      { onConflict: "event_id,player_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

export async function inviteRosterAction(eventId: string) {
  await guard();
  await inviteActiveRoster(eventId);
  refreshEvent(eventId);
}

/**
 * Adds someone to an event by name. If the name is not in the roster yet the
 * player is created on the spot - this is the "walked in out of the blue" path.
 * `attended` is set when they are added from the attendance panel.
 */
export async function addParticipantAction(
  eventId: string,
  name: string,
  attended = false,
) {
  await guard();
  const clean = name.trim();
  if (!clean) return;

  const player = await upsertPlayerByName(clean);

  const existing = await db()
    .from("event_players")
    .select("id")
    .eq("event_id", eventId)
    .eq("player_id", player.id)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    // Already on this event. Typing a name that is already in the list must
    // never wipe the RSVP they set — only a walk-in add marks them as here.
    if (attended) {
      const { error } = await db()
        .from("event_players")
        .update({ attended: true })
        .eq("id", existing.data.id);
      if (error) throw new Error(error.message);
    }
  } else {
    const { error } = await db()
      .from("event_players")
      .insert({
        event_id: eventId,
        player_id: player.id,
        attended,
        rsvp: attended ? "going" : "no_reply",
      });
    if (error) throw new Error(error.message);
  }

  refreshEvent(eventId);
  revalidatePath("/players");
}

export async function removeParticipantAction(eventId: string, rowId: string) {
  await guard();
  const { error } = await db().from("event_players").delete().eq("id", rowId);
  if (error) throw new Error(error.message);
  refreshEvent(eventId);
}

async function patchParticipant(
  eventId: string,
  rowId: string,
  patch: Record<string, unknown>,
) {
  await guard();
  const { error } = await db().from("event_players").update(patch).eq("id", rowId);
  if (error) throw new Error(error.message);
  refreshEvent(eventId);
}

export async function setRsvpAction(eventId: string, rowId: string, rsvp: Rsvp) {
  await patchParticipant(eventId, rowId, { rsvp });
}

export async function setAttendedAction(
  eventId: string,
  rowId: string,
  attended: boolean,
) {
  // Unmarking attendance clears the money state so a mis-tap does not leave a
  // stale "paid" flag on someone who was not even there.
  await patchParticipant(
    eventId,
    rowId,
    attended
      ? { attended }
      : { attended, paid: false, share_override: null, paid_note: null },
  );
}

export async function setPaidAction(eventId: string, rowId: string, paid: boolean) {
  await patchParticipant(eventId, rowId, paid ? { paid } : { paid, paid_note: null });
}

export async function setPaidNoteAction(eventId: string, rowId: string, note: string) {
  await patchParticipant(eventId, rowId, { paid_note: note.trim() || null });
}

export async function setShareOverrideAction(
  eventId: string,
  rowId: string,
  raw: string,
) {
  await patchParticipant(eventId, rowId, {
    share_override: parseAmount(raw.trim() || null),
  });
}

/** Marks everyone who RSVPd "going" as having attended - the usual one-tap start. */
export async function markGoingAsAttendedAction(eventId: string) {
  await guard();
  const { error } = await db()
    .from("event_players")
    .update({ attended: true })
    .eq("event_id", eventId)
    .eq("rsvp", "going");
  if (error) throw new Error(error.message);
  refreshEvent(eventId);
}
