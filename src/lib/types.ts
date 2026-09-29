import type { PricingMode } from "@/lib/money";

export type EventKind = "pickleball" | "party" | "other";
export type Rsvp = "going" | "maybe" | "out" | "no_reply";

export type Player = {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
};

export type EventRow = {
  id: string;
  title: string;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  maps_url: string | null;
  notes: string | null;
  total_cost: number | null;
  pricing_mode: PricingMode;
  price_per_head: number | null;
  created_by: string | null;
  gcash_name: string | null;
  gcash_number: string | null;
  qr_one_path: string | null;
  qr_one_label: string | null;
  qr_two_path: string | null;
  qr_two_label: string | null;
  created_at: string;
};

export type EventPlayerRow = {
  id: string;
  event_id: string;
  player_id: string;
  rsvp: Rsvp;
  attended: boolean;
  share_override: number | null;
  paid: boolean;
  paid_note: string | null;
  created_at: string;
};

/** An event_players row joined with the player it points at. */
export type Participant = EventPlayerRow & { player: Player };

export const EVENT_KINDS: { value: EventKind; label: string; emoji: string }[] = [
  { value: "pickleball", label: "Pickleball", emoji: "🏓" },
  { value: "party", label: "Party", emoji: "🎉" },
  { value: "other", label: "Other", emoji: "📅" },
];

export const RSVP_LABELS: Record<Rsvp, string> = {
  going: "Going",
  maybe: "Maybe",
  out: "Can't go",
  no_reply: "No reply",
};

/** The one amount that applies, whichever way the event is priced. */
export function eventPricing(e: {
  pricing_mode: PricingMode;
  total_cost: number | null;
  price_per_head: number | null;
}) {
  return e.pricing_mode === "per_head"
    ? ({ mode: "per_head", pricePerHead: e.price_per_head } as const)
    : ({ mode: "split", totalCost: e.total_cost } as const);
}

/** Does this event involve money at all? */
export function hasCost(e: {
  pricing_mode: PricingMode;
  total_cost: number | null;
  price_per_head: number | null;
}) {
  const amount = e.pricing_mode === "per_head" ? e.price_per_head : e.total_cost;
  return amount != null && amount > 0;
}

export function kindMeta(kind: EventKind) {
  return EVENT_KINDS.find((k) => k.value === kind) ?? EVENT_KINDS[2];
}
