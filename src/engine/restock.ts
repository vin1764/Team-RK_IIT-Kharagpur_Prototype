export interface RestockInput {
  runRate: number;
  onHand: number;
  leadTimeDays: number;
  safetyDays: number;
  makingCost: number;
  /** the maker's own minimum run (Q19) */
  minRun: number;
  /** ISO date of the demo day (D28 = 21 Nov 2026) */
  today: string;
}

export interface Restock {
  /** onHand ÷ runRate, one decimal */
  coverDays: number;
  /** runRate × (lead + safety) */
  reorderPoint: number;
  /** runRate × 21, rounded to nearest 10, never below the maker's minimum run */
  nextBatch: number;
  batchAtCost: number;
  /** today + whole days until on-hand reaches the reorder point (today once at or below it) */
  startBy: string;
  /** startBy + lead time */
  landsOn: string;
  /** units still on hand when the batch lands */
  leftOnLanding: number;
}

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Restock card on Inventory → Low Stock (GL-2). */
export function restock(input: RestockInput): Restock {
  const { runRate, onHand, leadTimeDays, safetyDays, makingCost, minRun, today } = input;
  const reorderPoint = runRate * (leadTimeDays + safetyDays);
  const nextBatch = Math.max(minRun, Math.round((runRate * 21) / 10) * 10);
  const daysToReorder = Math.max(0, Math.floor((onHand - reorderPoint) / runRate));
  const startBy = addDays(today, daysToReorder);
  return {
    coverDays: Math.round((onHand / runRate) * 10) / 10,
    reorderPoint,
    nextBatch,
    batchAtCost: nextBatch * makingCost,
    startBy,
    landsOn: addDays(startBy, leadTimeDays),
    leftOnLanding: Math.max(0, onHand - runRate * (daysToReorder + leadTimeDays)),
  };
}
