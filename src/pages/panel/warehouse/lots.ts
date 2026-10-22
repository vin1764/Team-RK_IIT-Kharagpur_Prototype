// Cluster Pack Point → Lots (PP-5) and Stock at Pack Point (PP-6): pure helpers over the seed and his saved plans.
//  - Samar's first lot is the seeded one (src/data/packPointLot.json): planned until its inbound day (D50), then received.
//  - Lots he plans here (src/store/fulfilmentSwitch.ts lots) are Planned until their send day, then In transit. The
//    seed has no transit time or receipt for them, so they never show Received (we don't invent an arrival day).
//  - Stock at the node comes only from a received lot: units per size (the seed's split), days held since the
//    inbound day, free storage to inbound + 30 days, then ₹0.29 per unit per day. No sales after D50 are seeded, so
//    the units on hand stay the units received.
import lotSeed from '../../../data/packPointLot.json';
import { lotInbound, sizeSplitFor, type ProductTypeId } from '../../../engine/ui';
import type { PlannedLot } from '../../../store/fulfilmentSwitch';

export type LotStatus = 'planned' | 'inTransit' | 'received';

export interface LotRow {
  /** 'seed' for the seeded lot, else the plan's id ("lot-1"…) */
  id: string;
  seeded: boolean;
  node: string;
  /** the send day (planned lots) or the inbound day (seeded lot) */
  day: number;
  units: number;
  lines: { type: ProductTypeId; units: number; listing?: string }[];
  status: LotStatus;
}

export const SEEDED_LOT_ID = 'seed';
export const SEEDED_LOT_TYPE = lotSeed.productType as ProductTypeId;

/** The seeded lot row (Samar, Agra) on this demo day. */
export function seededLotRow(day: number): LotRow {
  const received = day >= lotSeed.day;
  return {
    id: SEEDED_LOT_ID,
    seeded: true,
    node: lotSeed.node,
    day: lotSeed.day,
    units: received ? lotSeed.received : lotSeed.expected,
    lines: [{ type: SEEDED_LOT_TYPE, units: received ? lotSeed.received : lotSeed.expected }],
    status: received ? 'received' : 'planned',
  };
}

/** A lot he planned: Planned before its send day, In transit from it. */
export function plannedLotRow(lot: PlannedLot, day: number): LotRow {
  return {
    id: lot.id,
    seeded: false,
    node: lot.node,
    day: lot.sendDay,
    units: lot.lines.reduce((s, l) => s + l.units, 0),
    lines: lot.lines.map((l) => ({ type: l.type, units: l.units, listing: l.listing })),
    status: day < lot.sendDay ? 'planned' : 'inTransit',
  };
}

/** Every lot, newest first (send / inbound day, then the later plan first). */
export function lotRows({ seeded, planned, day }: { seeded: boolean; planned: PlannedLot[]; day: number }): LotRow[] {
  const rows = [...(seeded ? [seededLotRow(day)] : []), ...planned.map((l) => plannedLotRow(l, day))];
  const order = (r: LotRow) => (r.seeded ? 0 : Number(r.id.replace(/\D/g, '')) || 0);
  return rows.sort((a, b) => b.day - a.day || order(b) - order(a));
}

export interface StockRow {
  type: ProductTypeId;
  size: string | null;
  units: number;
  daysHeld: number;
}

export interface StockAtNode {
  node: string;
  rows: StockRow[];
  units: number;
  /** last free day boundary: storage is charged from this day on (inbound day + free days) */
  freeUntilDay: number;
  perUnitPerDay: number;
  /** units × rate, e.g. 90 × ₹0.29 = ₹26.10 */
  perDayAfterFree: number;
  /** days charged so far (0 while storage is free) and what they cost */
  chargedDays: number;
  chargedSoFar: number;
}

/** Stock held at the Pack Point on this day: only the seeded lot, once received (D50); null before or without it. */
export function stockAtNode(day: number, seeded: boolean): StockAtNode | null {
  if (!seeded || day < lotSeed.day) return null;
  const r = lotInbound(lotSeed);
  const daysHeld = day - lotSeed.day;
  const split = sizeSplitFor(SEEDED_LOT_TYPE, r.received);
  const rows: StockRow[] = split?.length
    ? split.map((s) => ({ type: SEEDED_LOT_TYPE, size: s.size, units: s.units, daysHeld }))
    : [{ type: SEEDED_LOT_TYPE, size: null, units: r.received, daysHeld }];
  const chargedDays = Math.max(0, day - r.storageFreeUntilDay);
  return {
    node: lotSeed.node,
    rows,
    units: r.received,
    freeUntilDay: r.storageFreeUntilDay,
    perUnitPerDay: lotSeed.storage.perUnitPerDay,
    perDayAfterFree: r.storagePerDayAfterFree,
    chargedDays,
    chargedSoFar: Math.round(chargedDays * r.storagePerDayAfterFree * 100) / 100,
  };
}

/**
 * Inventory's location tag: the Pack Point city when this listing ships through a Pack Point (his switch) and a lot
 * carrying it has been sent; else null.
 */
export function packPointLocation(listingKey: string, overlay: { fulfilment: string; node: string | null } | undefined, planned: PlannedLot[], day: number): string | null {
  if (!overlay || overlay.fulfilment !== 'packPoint' || !overlay.node) return null;
  const sent = planned.some((l) => l.sendDay <= day && l.lines.some((x) => x.listing === listingKey && x.units > 0));
  return sent ? overlay.node : null;
}
