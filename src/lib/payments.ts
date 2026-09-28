/**
 * The two QR slots have fixed meanings, so there is nothing for an organiser
 * to label: the first is the GCash code, the second covers everything else.
 */
export const QR_SLOTS = [
  { slot: "one", label: "GCash QR" },
  { slot: "two", label: "Other Banks" },
] as const;

export type QrSlotName = (typeof QR_SLOTS)[number]["slot"];

export const qrLabel = (slot: QrSlotName) =>
  QR_SLOTS.find((s) => s.slot === slot)!.label;
