import { pctDisplay } from './funnel';

export interface Funnel {
  views: number;
  clicks: number;
  orders: number | null;
}

export interface CoachBands {
  /** median click rate of similar listings; shown to the maker as "vs 4.2% for similar listings" */
  ctrSimilar: number;
  /** trigger: click rate below this (bottom quarter of similar listings). Internal only, never shown (team Q10). */
  ctrTrigger: number;
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

/** SKU Health Coach: one fix a week (GL-3, GL-4). Weak-listing trigger only. Returns null when nothing fires. */
export function coachFix(funnel: Funnel, bands: CoachBands): CoachFix | null {
  if (funnel.views <= 0) return null;
  const ctr = funnel.clicks / funnel.views;
  if (ctr >= bands.ctrTrigger) return null;
  return { fix: 'changeMainPhoto', ctrDisplay: pctDisplay(ctr), similarDisplay: pctDisplay(bands.ctrSimilar) };
}
