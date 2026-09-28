import { test } from "node:test";
import assert from "node:assert/strict";
import { splitCost, formatPeso, type MoneyRow } from "./money.ts";

const row = (
  playerId: string,
  attended: boolean,
  shareOverride: number | null = null,
  paid = false,
): MoneyRow => ({ playerId, attended, shareOverride, paid });

test("the everyday case: ₱2,000 split between 10 people who came", () => {
  const rows = Array.from({ length: 10 }, (_, i) => row(`p${i}`, true));
  const split = splitCost(2000, rows);

  assert.equal(split.attendeeCount, 10);
  assert.equal(split.warning, "none");
  for (const s of split.shares) assert.equal(s.share, 200);
  assert.equal(split.assigned, 2000);
});

test("uneven split still adds up to the total exactly", () => {
  const split = splitCost(2000, [row("a", true), row("b", true), row("c", true)]);

  assert.deepEqual(
    split.shares.map((s) => s.share),
    [666.67, 666.67, 666.66],
  );
  assert.equal(split.assigned, 2000);
});

test("people who RSVP'd but did not show up pay nothing", () => {
  const split = splitCost(900, [
    row("came-1", true),
    row("no-show", false),
    row("came-2", true),
    row("came-3", true),
  ]);

  assert.equal(split.attendeeCount, 3);
  assert.equal(split.shares.length, 3);
  assert.equal(split.byPlayer["no-show"], undefined);
  for (const s of split.shares) assert.equal(s.share, 300);
});

test("one manual override comes off the top and the rest re-split", () => {
  const split = splitCost(2000, [
    row("half-game", true, 100),
    row("b", true),
    row("c", true),
  ]);

  assert.equal(split.byPlayer["half-game"].share, 100);
  assert.equal(split.byPlayer["half-game"].isOverride, true);
  assert.equal(split.byPlayer["b"].share, 950);
  assert.equal(split.byPlayer["c"].share, 950);
  assert.equal(split.assigned, 2000);
  assert.equal(split.warning, "none");
});

test("overrides that exactly cover the total leave nothing to split", () => {
  const split = splitCost(500, [row("a", true, 200), row("b", true, 300)]);

  assert.equal(split.assigned, 500);
  assert.equal(split.warning, "none");
});

test("everyone overridden but short of the total is flagged", () => {
  const split = splitCost(1000, [row("a", true, 100), row("b", true, 100)]);

  assert.equal(split.assigned, 200);
  assert.equal(split.warning, "unallocated-remainder");
});

test("overrides above the total are flagged, never negative", () => {
  const split = splitCost(300, [row("a", true, 500), row("b", true)]);

  assert.equal(split.byPlayer["a"].share, 500);
  assert.equal(split.byPlayer["b"].share, 0);
  assert.equal(split.warning, "overrides-exceed-total");
  assert.ok(split.shares.every((s) => s.share >= 0));
});

test("a cost with nobody marked attended is flagged, not divided by zero", () => {
  const split = splitCost(2000, [row("a", false), row("b", false)]);

  assert.equal(split.warning, "no-attendees");
  assert.equal(split.assigned, 0);
  assert.ok(Number.isFinite(split.assigned));
});

test("a free event gives everyone a zero share", () => {
  for (const total of [null, undefined, 0]) {
    const split = splitCost(total, [row("a", true), row("b", true)]);
    assert.equal(split.warning, "none");
    assert.equal(split.assigned, 0);
    assert.ok(split.shares.every((s) => s.share === 0));
  }
});

test("collected and outstanding follow the paid toggles", () => {
  const split = splitCost(400, [
    row("a", true, null, true),
    row("b", true, null, true),
    row("c", true, null, false),
    row("d", true, null, false),
  ]);

  assert.equal(split.assigned, 400);
  assert.equal(split.collected, 200);
  assert.equal(split.outstanding, 200);
});

test("centavos never drift on a repeating decimal", () => {
  const rows = Array.from({ length: 7 }, (_, i) => row(`p${i}`, true));
  const split = splitCost(1000, rows);

  const sum = split.shares.reduce((t, s) => t + s.share, 0);
  assert.equal(Math.round(sum * 100) / 100, 1000);
  assert.equal(split.assigned, 1000);
});

test("peso formatting drops the .00 on whole amounts", () => {
  assert.equal(formatPeso(200), "₱200");
  assert.equal(formatPeso(666.67), "₱666.67");
  assert.equal(formatPeso(2000), "₱2,000");
});
