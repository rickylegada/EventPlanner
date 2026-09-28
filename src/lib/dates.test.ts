import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  combineDateTime,
  durationLabel,
  endFromSameDay,
  eventPhase,
  toDateAndTimes,
} from "./dates.ts";

test("a Manila date and time becomes the right UTC instant", () => {
  // Manila is UTC+8 all year — no daylight saving to worry about.
  assert.equal(combineDateTime("2026-09-25", "21:00"), "2026-09-25T13:00:00.000Z");
  assert.equal(combineDateTime("2026-09-25", "09:00"), "2026-09-25T01:00:00.000Z");
});

test("a night session that runs past midnight ends the next day", () => {
  const date = "2026-09-25";
  const start = combineDateTime(date, "21:00");
  const end = endFromSameDay(date, "21:00", "03:00");

  assert.equal(end, "2026-09-25T19:00:00.000Z"); // 3 AM on the 26th, Manila
  assert.ok(Date.parse(end) > Date.parse(start));
  assert.equal(durationLabel(start, end), "6 hours");
});

test("a normal daytime session stays on the same day", () => {
  const date = "2026-09-25";
  const end = endFromSameDay(date, "18:00", "20:00");

  assert.equal(end, "2026-09-25T12:00:00.000Z"); // 8 PM Manila
  assert.equal(durationLabel(combineDateTime(date, "18:00"), end), "2 hours");
});

test("duration reads naturally for part hours", () => {
  const d = "2026-09-25";
  assert.equal(durationLabel(combineDateTime(d, "18:00"), endFromSameDay(d, "18:00", "19:30")), "1 hr 30 min");
  assert.equal(durationLabel(combineDateTime(d, "18:00"), endFromSameDay(d, "18:00", "18:45")), "45 min");
  assert.equal(durationLabel(combineDateTime(d, "18:00"), endFromSameDay(d, "18:00", "19:00")), "1 hour");
});

test("the form can round-trip an event back into date and times", () => {
  const date = "2026-09-25";
  const start = combineDateTime(date, "21:00");
  const end = endFromSameDay(date, "21:00", "03:00");

  assert.deepEqual(toDateAndTimes(start, end), {
    date: "2026-09-25",
    startTime: "21:00",
    endTime: "03:00",
  });
});

test("the phase drives which panel the event screen shows", () => {
  const start = "2026-09-25T13:00:00.000Z"; // 9 PM Manila
  const end = "2026-09-25T19:00:00.000Z"; // 3 AM Manila, next day

  const at = (iso: string) => eventPhase(start, end, Date.parse(iso));

  assert.equal(at("2026-09-25T12:59:00.000Z"), "upcoming");
  assert.equal(at("2026-09-25T13:00:00.000Z"), "live", "flips the moment it starts");
  assert.equal(at("2026-09-25T18:59:00.000Z"), "live");
  assert.equal(at("2026-09-25T19:00:00.000Z"), "past");
});

test("an event with no end time is assumed to run three hours", () => {
  const start = "2026-09-25T13:00:00.000Z";
  const at = (iso: string) => eventPhase(start, null, Date.parse(iso));

  assert.equal(at("2026-09-25T12:59:00.000Z"), "upcoming");
  assert.equal(at("2026-09-25T14:00:00.000Z"), "live");
  assert.equal(at("2026-09-25T16:01:00.000Z"), "past");
});

test("civil date arithmetic rolls over months", () => {
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});
