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

/**
 * Where a coach fix stands on a demo day (GL-3):
 *  - 'fix'      not applied yet, inside its week;
 *  - 'pending'  not applied and a week has passed since it was given ("Still pending");
 *  - 'applied'  applied, the check a week later hasn't come yet (no new fix until then);
 *  - 'result'   applied and checked: the next 7 days' numbers are in.
 */
export type CoachStage = 'fix' | 'pending' | 'applied' | 'result';

export function coachStage(day: number, givenDay: number, appliedDay: number | null, checkAfterDays: number): { stage: CoachStage; checkDay: number } {
  if (appliedDay === null) {
    const checkDay = givenDay + checkAfterDays;
    return { stage: day >= checkDay ? 'pending' : 'fix', checkDay };
  }
  const checkDay = appliedDay + checkAfterDays;
  return { stage: day >= checkDay ? 'result' : 'applied', checkDay };
}

export interface CoachResult {
  views: number;
  clicks: number;
  orders: number;
  /** click-through before and after, e.g. "1.6%" → "3.9%" */
  ctrBeforeDisplay: string;
  ctrAfterDisplay: string;
  /** after > before */
  ctrUp: boolean;
  /** orders ÷ clicks after, e.g. "8.5%" */
  conversionDisplay: string;
  /** the same weak-listing check on the new week: null = no fix needed */
  nextFix: CoachFix | null;
}

/** The check a week after a fix: the new week's funnel against the week the fix was given for. */
export function coachResult(before: Funnel, after: { views: number; clicks: number; orders: number }, bands: CoachBands): CoachResult {
  const ctrBefore = before.clicks / before.views;
  const ctrAfter = after.clicks / after.views;
  return {
    views: after.views,
    clicks: after.clicks,
    orders: after.orders,
    ctrBeforeDisplay: pctDisplay(ctrBefore),
    ctrAfterDisplay: pctDisplay(ctrAfter),
    ctrUp: ctrAfter > ctrBefore,
    conversionDisplay: pctDisplay(after.orders / after.clicks),
    nextFix: coachFix(after, bands),
  };
}
