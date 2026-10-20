import { NotImplemented } from './types';

export interface RestockInput {
  runRate: number;
  onHand: number;
  leadTimeDays: number;
  safetyDays: number;
  makingCost: number;
  minRun: number;
  /** ISO date of the demo day (D31 = 24 Nov 2026 is assumed, Q1) */
  today: string;
}

export interface Restock {
  /** onHand ÷ runRate, one decimal */
  coverDays: number;
  /** runRate × (lead + safety) */
  reorderPoint: number;
  /** runRate × 21, rounded to nearest 10, never below minRun */
  nextBatch: number;
  batchAtCost: number;
  /** today + whole days until on-hand reaches the reorder point (proposed rule, Q6) */
  startBy: string;
  /** startBy + lead time */
  landsOn: string;
}

/** Restock card on Inventory → Low Stock (GL-2). */
export function restock(input: RestockInput): Restock {
  throw new NotImplemented('restock');
}
