/**
 * Cost splitting for an event.
 *
 * Rules (decided with Ricky):
 *   1. Only people who ACTUALLY ATTENDED pay. RSVPs don't matter here.
 *   2. Anyone can be given a manual override (e.g. "he only played 2 games, ₱100").
 *   3. Overrides come off the top; everyone else splits what's left equally.
 *   4. The shares must add up to the total EXACTLY — no lost or invented centavos.
 *
 * All arithmetic is done in centavos (integers) so we never hit floating point
 * drift like 0.1 + 0.2 = 0.30000000000000004.
 */

export type MoneyWarning =
  | "none"
  /** The manual overrides add up to more than the event total. */
  | "overrides-exceed-total"
  /** There is money to split but nobody is marked as attended. */
  | "no-attendees"
  /** Everyone has an override and they don't add up to the total. */
  | "unallocated-remainder";

export type MoneyRow = {
  playerId: string;
  attended: boolean;
  /** Pesos. null means "use the equal split". */
  shareOverride: number | null;
  paid: boolean;
};

export type MoneyShare = {
  playerId: string;
  /** Pesos, exact to the centavo. */
  share: number;
  isOverride: boolean;
  paid: boolean;
};

export type MoneySplit = {
  /** One entry per attendee, in the same order they were passed in. */
  shares: MoneyShare[];
  byPlayer: Record<string, MoneyShare>;
  total: number;
  /** Sum of all shares. Equals total unless a warning is set. */
  assigned: number;
  /** Sum of shares whose player is marked paid. */
  collected: number;
  /** assigned - collected. */
  outstanding: number;
  attendeeCount: number;
  warning: MoneyWarning;
};

const toCentavos = (pesos: number) => Math.round(pesos * 100);
const toPesos = (centavos: number) => centavos / 100;

export type PricingMode = "split" | "per_head";

/**
 * Two ways an event costs money.
 *
 *   split     one booking fee, divided between whoever came. The total is
 *             fixed and the per-person share depends on the headcount.
 *   per_head  everyone pays the same fixed amount. The per-person figure is
 *             fixed and the total depends on the headcount.
 */
export type Pricing =
  | { mode: "split"; totalCost: number | null | undefined }
  | { mode: "per_head"; pricePerHead: number | null | undefined };

/** Works out what everyone owes, whichever way the event is priced. */
export function computeMoney(pricing: Pricing, rows: MoneyRow[]): MoneySplit {
  return pricing.mode === "per_head"
    ? perHeadCost(pricing.pricePerHead, rows)
    : splitCost(pricing.totalCost, rows);
}

/**
 * Fixed price each: nobody subsidises anybody, so there is no remainder to
 * distribute and no way for overrides to overshoot a total — the total is
 * simply whatever the people who turned up add up to.
 */
export function perHeadCost(
  pricePerHead: number | null | undefined,
  rows: MoneyRow[],
): MoneySplit {
  const attendees = rows.filter((r) => r.attended);
  const price = pricePerHead && pricePerHead > 0 ? pricePerHead : 0;

  const shares: MoneyShare[] = attendees.map((r) => {
    const override = r.shareOverride;
    const amount = override !== null ? Math.max(0, override) : price;
    return {
      playerId: r.playerId,
      share: toPesos(toCentavos(amount)),
      isOverride: override !== null,
      paid: r.paid,
    };
  });

  const assignedCentavos = shares.reduce((t, s) => t + toCentavos(s.share), 0);

  return finalize({
    shares,
    byPlayer: {},
    total: toPesos(assignedCentavos),
    assigned: 0,
    collected: 0,
    outstanding: 0,
    attendeeCount: attendees.length,
    warning: price > 0 && attendees.length === 0 ? "no-attendees" : "none",
  });
}

export function splitCost(
  totalCost: number | null | undefined,
  rows: MoneyRow[],
): MoneySplit {
  const attendees = rows.filter((r) => r.attended);
  const total = totalCost && totalCost > 0 ? totalCost : 0;
  const totalCentavos = toCentavos(total);

  const empty = (warning: MoneyWarning): MoneySplit => ({
    shares: attendees.map((r) => ({
      playerId: r.playerId,
      share: 0,
      isOverride: false,
      paid: r.paid,
    })),
    byPlayer: {},
    total,
    assigned: 0,
    collected: 0,
    outstanding: 0,
    attendeeCount: attendees.length,
    warning,
  });

  // Nothing to split, or nobody to split it between.
  if (totalCentavos === 0) return finalize(empty("none"));
  if (attendees.length === 0) return finalize(empty("no-attendees"));

  let warning: MoneyWarning = "none";

  // Step 1: take the overrides off the top.
  const overridden = attendees.filter((r) => r.shareOverride !== null);
  const splitters = attendees.filter((r) => r.shareOverride === null);
  const overrideCentavos = overridden.reduce(
    (sum, r) => sum + Math.max(0, toCentavos(r.shareOverride as number)),
    0,
  );

  let remaining = totalCentavos - overrideCentavos;
  if (remaining < 0) {
    // The overrides alone are more than the event cost. Don't invent negative
    // shares — show the overrides as-is and let the UI flag it.
    remaining = 0;
    warning = "overrides-exceed-total";
  } else if (splitters.length === 0 && remaining > 0) {
    // Everyone was overridden but the overrides don't cover the total.
    warning = "unallocated-remainder";
  }

  // Step 2: split the remainder equally, distributing the leftover centavos
  // one each to the first few people so the shares total exactly.
  const base = splitters.length > 0 ? Math.floor(remaining / splitters.length) : 0;
  const leftover = splitters.length > 0 ? remaining - base * splitters.length : 0;

  const shares: MoneyShare[] = [];
  let splitterIndex = 0;

  for (const row of attendees) {
    if (row.shareOverride !== null) {
      shares.push({
        playerId: row.playerId,
        share: toPesos(Math.max(0, toCentavos(row.shareOverride))),
        isOverride: true,
        paid: row.paid,
      });
    } else {
      const bonus = splitterIndex < leftover ? 1 : 0;
      splitterIndex += 1;
      shares.push({
        playerId: row.playerId,
        share: toPesos(base + bonus),
        isOverride: false,
        paid: row.paid,
      });
    }
  }

  return finalize({
    shares,
    byPlayer: {},
    total,
    assigned: 0,
    collected: 0,
    outstanding: 0,
    attendeeCount: attendees.length,
    warning,
  });
}

/** Fills in the derived totals and the lookup map. */
function finalize(split: MoneySplit): MoneySplit {
  let assignedCentavos = 0;
  let collectedCentavos = 0;
  const byPlayer: Record<string, MoneyShare> = {};

  for (const s of split.shares) {
    const c = toCentavos(s.share);
    assignedCentavos += c;
    if (s.paid) collectedCentavos += c;
    byPlayer[s.playerId] = s;
  }

  split.byPlayer = byPlayer;
  split.assigned = toPesos(assignedCentavos);
  split.collected = toPesos(collectedCentavos);
  split.outstanding = toPesos(assignedCentavos - collectedCentavos);
  return split;
}

/** "₱2,000.00" — or "₱200" when the amount is a whole number of pesos. */
export function formatPeso(amount: number): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
