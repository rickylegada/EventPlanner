import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSummary } from "./summary.ts";
import { splitCost, type MoneyRow } from "./money.ts";
import type { EventRow, Participant, Rsvp } from "./types.ts";

const event: EventRow = {
  id: "e1",
  title: "Saturday Pickleball",
  kind: "pickleball",
  // 2026-10-03 18:00 Manila == 10:00 UTC
  starts_at: "2026-10-03T10:00:00.000Z",
  ends_at: "2026-10-03T12:00:00.000Z",
  venue_name: "Ace Pickleball Court",
  maps_url: "https://maps.app.goo.gl/example",
  notes: null,
  total_cost: 2000,
  created_by: null,
  gcash_name: null,
  gcash_number: null,
  qr_one_path: null,
  qr_one_label: null,
  qr_two_path: null,
  qr_two_label: null,
  created_at: "2026-09-01T00:00:00.000Z",
};

function participant(
  name: string,
  opts: { rsvp?: Rsvp; attended?: boolean; paid?: boolean; override?: number | null } = {},
): Participant {
  const id = name.toLowerCase();
  return {
    id: `ep-${id}`,
    event_id: "e1",
    player_id: id,
    rsvp: opts.rsvp ?? "no_reply",
    attended: opts.attended ?? false,
    share_override: opts.override ?? null,
    paid: opts.paid ?? false,
    paid_note: null,
    created_at: "2026-09-01T00:00:00.000Z",
    player: {
      id,
      name,
      color: "emerald",
      is_active: true,
      is_admin: false,
      created_at: "2026-09-01T00:00:00.000Z",
    },
  };
}

const toMoneyRows = (list: Participant[]): MoneyRow[] =>
  list.map((p) => ({
    playerId: p.player_id,
    attended: p.attended,
    shareOverride: p.share_override,
    paid: p.paid,
  }));

test("before the event, the summary lists RSVPs and the venue", () => {
  const people = [
    participant("Ricky", { rsvp: "going" }),
    participant("Jun", { rsvp: "going" }),
    participant("Mika", { rsvp: "maybe" }),
    participant("Paolo", { rsvp: "out" }),
    participant("Anna"),
  ];
  const text = buildSummary(event, people, splitCost(2000, toMoneyRows(people)));

  assert.match(text, /🏓 Saturday Pickleball/);
  assert.match(text, /Sat, Oct 3 · 6:00 PM – 8:00 PM/);
  assert.match(text, /📍 Ace Pickleball Court/);
  assert.match(text, /https:\/\/maps\.app\.goo\.gl\/example/);
  assert.match(text, /✅ Going \(2\): Ricky, Jun/);
  assert.match(text, /🤔 Maybe \(1\): Mika/);
  assert.match(text, /❌ Can't go \(1\): Paolo/);
  assert.match(text, /⬜ No reply \(1\): Anna/);
  assert.match(text, /split by whoever shows up/);
});

test("after the event, the summary shows shares and who still owes", () => {
  const people = [
    participant("Ricky", { attended: true, paid: true }),
    participant("Jun", { attended: true, paid: true }),
    participant("Mika", { attended: true }),
    participant("Paolo", { attended: true }),
    participant("Anna", { rsvp: "out" }),
  ];
  const text = buildSummary(event, people, splitCost(2000, toMoneyRows(people)));

  assert.match(text, /🙌 Came \(4\): Ricky, Jun, Mika, Paolo/);
  assert.match(text, /💰 Total ₱2,000 — ₱500 each/);
  assert.match(text, /✅ Paid \(2\): Ricky, Jun/);
  assert.match(text, /• Mika — ₱500/);
  assert.match(text, /Still to collect: ₱1,000/);
  assert.doesNotMatch(text, /Anna/);
});

test("an overridden share drops the 'each' line and itemises instead", () => {
  const people = [
    participant("Ricky", { attended: true, override: 100 }),
    participant("Jun", { attended: true }),
    participant("Mika", { attended: true }),
  ];
  const text = buildSummary(event, people, splitCost(2000, toMoneyRows(people)));

  assert.match(text, /💰 Total ₱2,000\n/);
  assert.doesNotMatch(text, /each/);
  assert.match(text, /• Ricky — ₱100/);
  assert.match(text, /• Jun — ₱950/);
});

test("when everyone has settled up it says so", () => {
  const people = [
    participant("Ricky", { attended: true, paid: true }),
    participant("Jun", { attended: true, paid: true }),
  ];
  const text = buildSummary(event, people, splitCost(2000, toMoneyRows(people)));

  assert.match(text, /🎉 Everyone has paid!/);
  assert.doesNotMatch(text, /Still to collect/);
});

test("a free event skips the money section entirely", () => {
  const free = { ...event, total_cost: null, kind: "party" as const, title: "Christmas Party" };
  const people = [participant("Ricky", { attended: true })];
  const text = buildSummary(free, people, splitCost(null, toMoneyRows(people)));

  assert.match(text, /🎉 Christmas Party/);
  assert.doesNotMatch(text, /💰/);
});
