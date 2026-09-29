/**
 * Builds the plain-text block you paste into the group chat. Kept pure (no
 * React, no database) so it can be unit tested and reused anywhere.
 */
import { formatPeso, type MoneySplit } from "./money.ts";
import { formatDayShort, formatTimeRange } from "./dates.ts";
import { hasCost, kindMeta, type EventRow, type Participant } from "./types.ts";

const names = (list: Participant[]) =>
  list.map((p) => p.player.name).join(", ");

export function buildSummary(
  event: EventRow,
  participants: Participant[],
  split: MoneySplit,
): string {
  const meta = kindMeta(event.kind);
  const lines: string[] = [];

  lines.push(`${meta.emoji} ${event.title}`);
  lines.push(
    `${formatDayShort(event.starts_at)} · ${formatTimeRange(event.starts_at, event.ends_at)}`,
  );
  if (event.venue_name) lines.push(`📍 ${event.venue_name}`);
  if (event.maps_url) lines.push(event.maps_url);

  const attended = participants.filter((p) => p.attended);

  if (attended.length === 0) {
    // Before the event: who's coming.
    const going = participants.filter((p) => p.rsvp === "going");
    const maybe = participants.filter((p) => p.rsvp === "maybe");
    const out = participants.filter((p) => p.rsvp === "out");
    const quiet = participants.filter((p) => p.rsvp === "no_reply");

    lines.push("");
    lines.push(`✅ Going (${going.length}): ${going.length ? names(going) : "—"}`);
    if (maybe.length) lines.push(`🤔 Maybe (${maybe.length}): ${names(maybe)}`);
    if (out.length) lines.push(`❌ Can't go (${out.length}): ${names(out)}`);
    if (quiet.length) lines.push(`⬜ No reply (${quiet.length}): ${names(quiet)}`);

    // A fixed price per person is already known before anyone turns up; a
    // split is not, so say so rather than implying a figure.
    if (hasCost(event)) {
      lines.push("");
      lines.push(
        event.pricing_mode === "per_head"
          ? `💰 ${formatPeso(event.price_per_head as number)} each`
          : `💰 Venue: ${formatPeso(event.total_cost as number)}, split by whoever shows up`,
      );
    }
    return lines.join("\n");
  }

  // After the event: who came and who owes.
  lines.push("");
  lines.push(`🙌 Came (${attended.length}): ${names(attended)}`);

  if (split.total > 0) {
    const shares = split.shares.map((s) => s.share);
    const uniform = shares.every((s) => s === shares[0]);

    lines.push("");
    // Lead with whichever figure was the fixed one, since that is the number
    // people recognise: a set price each, or a court fee being divided.
    lines.push(
      uniform
        ? event.pricing_mode === "per_head"
          ? `💰 ${formatPeso(shares[0])} each — ${formatPeso(split.total)} total`
          : `💰 Total ${formatPeso(split.total)} — ${formatPeso(shares[0])} each`
        : `💰 Total ${formatPeso(split.total)}`,
    );

    const unpaid = attended.filter((p) => !split.byPlayer[p.player_id]?.paid);
    const paid = attended.filter((p) => split.byPlayer[p.player_id]?.paid);

    if (paid.length) lines.push(`✅ Paid (${paid.length}): ${names(paid)}`);

    if (unpaid.length) {
      lines.push(`⏳ Not yet paid (${unpaid.length}):`);
      for (const p of unpaid) {
        lines.push(
          `   • ${p.player.name} — ${formatPeso(split.byPlayer[p.player_id]?.share ?? 0)}`,
        );
      }
      lines.push(`Still to collect: ${formatPeso(split.outstanding)}`);
    } else {
      lines.push("🎉 Everyone has paid!");
    }
  }

  return lines.join("\n");
}
