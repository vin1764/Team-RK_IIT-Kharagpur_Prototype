// Cluster Pack Point lot inbound (PP-5) and storage terms (PP-3). Pure; values from src/data/packPointLot.json.

export interface LotSeed {
  day: number;
  expected: number;
  received: number;
  packedWeightG: number;
  weightTolerancePct: number;
  storage: { freeDays: number; perUnitPerDay: number };
}

export interface LotInbound {
  expected: number;
  received: number;
  /** received − expected (0 = complete) */
  shortBy: number;
  /** acceptable packed weight per unit, grams: ±tolerance around the declared weight */
  weightRangeG: { low: number; high: number };
  /** demo day until which storage is free (inbound day + free days) */
  storageFreeUntilDay: number;
  /** what storage costs per day after the free period for the units received, ₹, 2 decimals */
  storagePerDayAfterFree: number;
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function lotInbound(seed: LotSeed): LotInbound {
  const t = seed.weightTolerancePct / 100;
  return {
    expected: seed.expected,
    received: seed.received,
    shortBy: seed.expected - seed.received,
    weightRangeG: { low: seed.packedWeightG * (1 - t), high: seed.packedWeightG * (1 + t) },
    storageFreeUntilDay: seed.day + seed.storage.freeDays,
    storagePerDayAfterFree: round2(seed.received * seed.storage.perUnitPerDay),
  };
}

/** Units per size; throws if the split doesn't add up to the lot. */
export function sizeSplit(split: Record<string, number | string>, lot: number): { size: string; units: number }[] {
  const rows = Object.entries(split)
    .filter(([k]) => !k.startsWith('_'))
    .map(([size, units]) => ({ size, units: Number(units) }));
  const total = rows.reduce((s, r) => s + r.units, 0);
  if (total !== lot) throw new Error(`size split adds to ${total}, lot is ${lot}`);
  return rows;
}
