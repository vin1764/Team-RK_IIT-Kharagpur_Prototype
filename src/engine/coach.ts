import { NotImplemented } from './types';

export interface Funnel {
  views: number;
  clicks: number;
  orders: number | null;
}

export interface CategoryBands {
  /** shown to the maker as "vs X% for similar listings" */
  ctrSimilar: number;
  /** trigger cut-off, internal only (value missing, Q10) */
  ctrP25: number;
  /** below this, impressions aren't "normal" and the weak-listing trigger can't fire (Q10) */
  viewsP25: number;
}

export type CoachFixId = 'changeMainPhoto';

export interface CoachFix {
  /** the fix only; the trigger that fired stays inside the engine */
  fix: CoachFixId;
  /** e.g. "1.6%" */
  ctrDisplay: string;
  /** e.g. "4.2%" */
  similarDisplay: string;
}

/** SKU Health Coach: one fix a week (GL-3, GL-4). Returns null when nothing fires. */
export function coachFix(funnel: Funnel, bands: CategoryBands): CoachFix | null {
  throw new NotImplemented('coachFix');
}
