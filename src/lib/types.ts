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

export function kindMeta(kind: EventKind) {
  return EVENT_KINDS.find((k) => k.value === kind) ?? EVENT_KINDS[2];
}
