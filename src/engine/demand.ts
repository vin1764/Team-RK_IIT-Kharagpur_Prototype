import { NotImplemented, type Confidence, type ProductTypeId, type Range } from './types';

export interface Demand {
  gapPerWeek: Range & { approx?: boolean };
  priceBand: Range | null;
  confidence: Confidence;
  committedUnits: number;
}

export interface LikelyShare {
  share: number;
  ordersPerWeek: Range;
  /** rounded to whole orders, as shown: 9–13 */
  ordersPerDay: Range;
}

export interface SuggestedLot {
  /** run-rate = midpoint of the rounded daily range */
  dailyRunRate: number;
  days: 14;
  /** run-rate × 14, rounded to nearest 10, never below the type's minimum run */
  units: number;
  atCost: number;
}

export interface SwitchSuggestion {
  type: ProductTypeId;
  name: string;
  gapPerWeek: Range & { approx?: boolean };
  confidence: Confidence;
}

/** Demand teaser, order book and bot Quantity screen (FO-4, LW-3, LB-5). */
export function demandForType(type: ProductTypeId): Demand {
  throw new NotImplemented('demandForType');
}

/** Likely share of the open gap for one new listing of this type. */
export function likelyShare(type: ProductTypeId): LikelyShare {
  throw new NotImplemented('likelyShare');
}

/** Launch slots = open gap ÷ expected orders per listing (low ÷ low; must equal high ÷ high). */
export function slots(type: ProductTypeId): number {
  throw new NotImplemented('slots');
}

/** First lot ≈ 14 days of expected sales, in units. */
export function suggestedLot(type: ProductTypeId, makingCost: number): SuggestedLot {
  throw new NotImplemented('suggestedLot');
}

/** "What to make instead": open-gap types on the same line, excluding `current`, largest gap first. */
export function switchSuggestions(line: string, current: ProductTypeId): SwitchSuggestion[] {
  throw new NotImplemented('switchSuggestions');
}
