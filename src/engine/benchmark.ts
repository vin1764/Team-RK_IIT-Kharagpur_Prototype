// Benchmark B lives here and nowhere else.
// UI code must import from ./ui.ts, never from this file (enforced by benchmark.guard.test.ts).

import { NotImplemented } from './types';

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

/**
 * B = 25th-percentile price buyers paid (nearest rank, ascending) over qualifying orders:
 * above the quality floor, more than `minDeliveredOrders`, maker's own orders excluded.
 * Throws if the 25th-percentile order falls inside a price range.
 */
export function benchmarkB(comparables: Comparable[], minDeliveredOrders: number): number {
  throw new NotImplemented('benchmarkB');
}

/** breakEven ≤ price ≤ B → qualifies; price > B → aboveCap; price < breakEven → belowCost. */
export function priceCheck(price: number, breakEven: number, B: number): PriceStatus {
  throw new NotImplemented('priceCheck');
}

/**
 * Third of like-for-like listings the price sits in, by the share of qualifying
 * orders priced strictly below it: < 1/3 low, < 2/3 mid, else high. (Proposed rule, Q8.)
 */
export function pricePosition(price: number, comparables: Comparable[], minDeliveredOrders: number): PricePosition {
  throw new NotImplemented('pricePosition');
}

/** Ops-only: price drop vs B, and whether it meets the deck's ≥ 8% of B target. */
export function priceDrop(price: number, B: number): { rupees: number; shareOfB: number; meetsTarget: boolean } {
  throw new NotImplemented('priceDrop');
}
