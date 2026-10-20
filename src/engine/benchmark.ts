// Benchmark B lives here and nowhere else.
// UI code must import from ./ui.ts, never from this file (enforced by benchmark.guard.test.ts).

export interface Comparable {
  id: string;
  /** a single listing has from === to; a group of listings is a price range */
  price: { from: number; to: number };
  deliveredOrders: number;
  aboveQualityFloor: boolean;
  ownedByMaker: boolean;
}

export type PriceStatus = 'qualifies' | 'aboveCap' | 'belowCost';
export type PricePosition = 'low' | 'mid' | 'high';

/** Qualifying comparables, cheapest first. */
function qualifying(comparables: Comparable[], minDeliveredOrders: number) {
  return comparables
    .filter((c) => c.aboveQualityFloor && !c.ownedByMaker && c.deliveredOrders >= minDeliveredOrders)
    .sort((a, b) => a.price.from - b.price.from);
}

/**
 * B = 25th-percentile price buyers paid (nearest rank, ascending) over qualifying orders:
 * above the quality floor, at least `minDeliveredOrders` delivered (30), maker's own orders excluded.
 * Throws if the 25th-percentile order falls inside a price range.
 */
export function benchmarkB(comparables: Comparable[], minDeliveredOrders: number): number {
  const rows = qualifying(comparables, minDeliveredOrders);
  const total = rows.reduce((s, r) => s + r.deliveredOrders, 0);
  if (total === 0) throw new Error('benchmarkB: no qualifying orders');
  const rank = Math.ceil(0.25 * total);
  let seen = 0;
  for (const r of rows) {
    seen += r.deliveredOrders;
    if (seen >= rank) {
      if (r.price.from !== r.price.to) throw new Error(`benchmarkB: 25th-percentile order falls inside ${r.id}'s price range`);
      return r.price.from;
    }
  }
  throw new Error('benchmarkB: unreachable');
}

/** breakEven ≤ price ≤ B → qualifies; price > B → aboveCap; price < breakEven → belowCost. */
export function priceCheck(price: number, breakEven: number, B: number): PriceStatus {
  if (price < breakEven) return 'belowCost';
  if (price > B) return 'aboveCap';
  return 'qualifies';
}

/**
 * Third of like-for-like listings the price sits in, by the share of qualifying
 * orders priced strictly below it: < 1/3 low, < 2/3 mid, else high. (Proposed rule, Q8.)
 */
export function pricePosition(price: number, comparables: Comparable[], minDeliveredOrders: number): PricePosition {
  const rows = qualifying(comparables, minDeliveredOrders);
  const total = rows.reduce((s, r) => s + r.deliveredOrders, 0);
  let below = 0;
  for (const r of rows) {
    if (r.price.to < price) below += r.deliveredOrders;
    else if (r.price.from < price) throw new Error(`pricePosition: ₹${price} falls inside ${r.id}'s price range`);
  }
  const share = below / total;
  return share < 1 / 3 ? 'low' : share < 2 / 3 ? 'mid' : 'high';
}

/** Ops-only: price drop vs B, and whether it meets the deck's ≥ 8% of B target. */
export function priceDrop(price: number, B: number): { rupees: number; shareOfB: number; meetsTarget: boolean } {
  const rupees = B - price;
  const shareOfB = rupees / B;
  return { rupees, shareOfB, meetsTarget: shareOfB >= 0.08 };
}
