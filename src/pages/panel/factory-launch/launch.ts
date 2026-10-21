// Factory Launch Week (LW-2 … LW-8): pure helpers over the launch seed. No store, no React.
// Seed: src/data/launch.json (team answers, Phase 4) and the launch block of src/data/calendar.json.
// Every number on the Factory Launch screens comes from here or from src/engine/ui.ts.
import calendar from '../../../data/calendar.json';
import seed from '../../../data/launch.json';
import { dayLabel, type ProductTypeId } from '../../../engine/ui';

export const LAUNCH = {
  id: seed.id,
  name: seed.name,
  category: seed.category,
  productTypes: seed.productTypes as ProductTypeId[],
  slotsTakenBefore: seed.slotsTakenBeforeJasmeet,
  dailyOrders: seed.dailyOrders as Record<string, number>,
  scriptedCommit: seed.commit.jasmeet,
  listingScoreLabel: seed.listingScoreLabel,
  ...calendar.launch,
  listingDay: calendar.jumps.listing,
};

export type LaunchPhase = 'open' | 'closed' | 'stockReady' | 'live' | 'ended';

/** open until commitments close (D7 inclusive) · closed · stock at the node (D18–D20) · live D21–D25 · ended. */
export function phaseForDay(day: number): LaunchPhase {
  if (day <= LAUNCH.commitmentsCloseDay) return 'open';
  if (day < LAUNCH.stockAtNodeDay) return 'closed';
  if (day < LAUNCH.liveFromDay) return 'stockReady';
  if (day <= LAUNCH.liveToDay) return 'live';
  return 'ended';
}

/** Promotions status sub-tab the event sits under: Upcoming before live, Live, then Expired. */
export function statusForPhase(p: LaunchPhase): 'UPCOMING' | 'LIVE' | 'COMPLETED' {
  return p === 'live' ? 'LIVE' : p === 'ended' ? 'COMPLETED' : 'UPCOMING';
}

/** Day n of the live week (1-based), or null outside it. "Day 3 of 5 is day 23" (doc p.22). */
export function liveDayIndex(day: number): { n: number; of: number } | null {
  const of = LAUNCH.liveToDay - LAUNCH.liveFromDay + 1;
  if (day < LAUNCH.liveFromDay || day > LAUNCH.liveToDay) return null;
  return { n: day - LAUNCH.liveFromDay + 1, of };
}

export interface SlotStatus {
  taken: number;
  total: number;
  left: number;
  /** the gap is closed: no slot left */
  crowded: boolean;
}

export function slotStatus(taken: number, total: number): SlotStatus {
  const left = Math.max(0, total - taken);
  return { taken, total, left, crowded: left === 0 };
}

/** "14 Nov 2026" + "18 Nov 2026" → "14–18 Nov 2026"; different months keep both. */
export function dateRange(fromDay: number, toDay: number): string {
  const a = dayLabel(fromDay).split(' ');
  const b = dayLabel(toDay).split(' ');
  if (a[1] === b[1] && a[2] === b[2]) return `${a[0]}–${b.join(' ')}`;
  if (a[2] === b[2]) return `${a[0]} ${a[1]} – ${b.join(' ')}`;
  return `${a.join(' ')} – ${b.join(' ')}`;
}

/** The live week as a date range: "14–18 Nov 2026". */
export const liveDates = () => dateRange(LAUNCH.liveFromDay, LAUNCH.liveToDay);

export interface Commit {
  typeId: ProductTypeId;
  units: number;
  /** demo day of the commit */
  day: number;
  /** the listing price checked at commit */
  price: number;
}

/**
 * The commit that counts on `day`: an interactive one made on or before `day`; else, for the
 * scripted persona once commitments have closed, the scripted commit (launch.json, 150 at D5).
 */
export function effectiveCommit(
  real: Commit | undefined,
  day: number,
  scripted: { typeId: ProductTypeId; price: number } | null,
): (Commit & { scripted: boolean }) | null {
  if (real && real.day <= day) return { ...real, scripted: false };
  if (scripted && day > LAUNCH.commitmentsCloseDay) {
    const { units, day: on } = LAUNCH.scriptedCommit;
    return { typeId: scripted.typeId, units, day: on, price: scripted.price, scripted: true };
  }
  return null;
}
