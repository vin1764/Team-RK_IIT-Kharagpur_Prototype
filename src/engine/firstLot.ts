// GL-6 "Plan a lot" for a product type from "What to make instead". Pure: every number the lot panel and the
// "Lot planned" card show comes from here, through src/engine/ui.ts. No list price, break-even or B here:
// his price check comes on the bot's Price step.
import { demandForType, likelyShare, productTypeName, suggestedLot } from './demand';
import type { Confidence, ProductTypeId, Range } from './types';

export interface FirstLotInput {
  type: ProductTypeId;
  /** units he plans (any number; null while the field is empty or not a number) */
  units: number | null;
  /** demo day production starts */
  startDay: number;
  /** his own lead time and minimum run (from his live listing) */
  leadTimeDays: number;
  minRun: number;
}

export interface FirstLotPlan {
  type: ProductTypeId;
  name: string;
  gapPerWeek: Range & { approx?: boolean };
  confidence: Confidence;
  /** what buyers pay today (null when the type has no band) */
  priceBand: Range | null;
  /** his likely share of the open gap */
  share: number;
  likelyPerWeek: Range;
  /** whole orders a day, as shown: 5–6 */
  likelyPerDay: Range;
  /** ≈ 14 days of his likely orders, rounded to the nearest 10 (suggestedLot's two weeks; not raised to his minimum run) */
  suggested: number;
  /** the units planned, or null */
  units: number | null;
  /** planned units below his own minimum run (a soft warning: any number is allowed) */
  belowMinRun: boolean;
  startDay: number;
  /** start + his lead time */
  readyDay: number;
}

export function firstLotPlan(x: FirstLotInput): FirstLotPlan {
  const d = demandForType(x.type);
  const s = likelyShare(x.type);
  const lot = suggestedLot(x.type, 0);
  const units = x.units !== null && Number.isInteger(x.units) && x.units > 0 ? x.units : null;
  return {
    type: x.type,
    name: productTypeName(x.type),
    gapPerWeek: d.gapPerWeek,
    confidence: d.confidence,
    priceBand: d.priceBand,
    share: s.share,
    likelyPerWeek: s.ordersPerWeek,
    likelyPerDay: s.ordersPerDay,
    suggested: lot.twoWeeks,
    units,
    belowMinRun: units !== null && x.minRun > 0 && units < x.minRun,
    startDay: x.startDay,
    readyDay: x.startDay + x.leadTimeDays,
  };
}
