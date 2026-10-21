import data from '../data/productTypes.json';
import { MissingPlanValue, type Confidence, type ProductTypeId, type Range } from './types';

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
  /** run-rate × 14, rounded to nearest 10. No cap and no floor (Q19): the maker's own minimum run only triggers a soft warning in the UI. */
  units: number;
  atCost: number;
}

export interface SwitchSuggestion {
  type: ProductTypeId;
  name: string;
  gapPerWeek: Range & { approx?: boolean };
  confidence: Confidence;
}

interface TypeRecord {
  name: string;
  line: string;
  demand: Demand & { _source?: string };
  likelyShare?: { share: number };
  typical?: { minRun: number; leadTimeDays: number };
}

const TYPES = data as unknown as Record<string, TypeRecord>;

function record(type: ProductTypeId): TypeRecord {
  const t = TYPES[type];
  if (!t) throw new MissingPlanValue(`product type ${type}`);
  return t;
}

export function productTypeName(type: ProductTypeId): string {
  return record(type).name;
}

/** Demand teaser, order book and bot Quantity screen (FO-4, LW-3, LB-5). */
export function demandForType(type: ProductTypeId): Demand {
  const { gapPerWeek, priceBand, confidence, committedUnits } = record(type).demand;
  return { gapPerWeek, priceBand, confidence, committedUnits };
}

/** Likely share of the open gap for one new listing of this type. */
export function likelyShare(type: ProductTypeId): LikelyShare {
  const t = record(type);
  if (!t.likelyShare) throw new MissingPlanValue(`likely share for ${type}`);
  const { share } = t.likelyShare;
  const g = t.demand.gapPerWeek;
  const ordersPerWeek = { low: g.low * share, high: g.high * share };
  return {
    share,
    ordersPerWeek,
    ordersPerDay: { low: Math.round(ordersPerWeek.low / 7), high: Math.round(ordersPerWeek.high / 7) },
  };
}

/** Launch slots = open gap ÷ expected orders per listing (low ÷ low; must equal high ÷ high). */
export function slots(type: ProductTypeId): number {
  const g = record(type).demand.gapPerWeek;
  const w = likelyShare(type).ordersPerWeek;
  const low = g.low / w.low;
  const high = g.high / w.high;
  if (Math.abs(low - high) > 1e-9) throw new Error(`slots: ${low} ≠ ${high} for ${type}`);
  return Math.floor(low);
}

/** First lot ≈ 14 days of expected sales, in units. */
export function suggestedLot(type: ProductTypeId, makingCost: number): SuggestedLot {
  const day = likelyShare(type).ordersPerDay;
  const dailyRunRate = (day.low + day.high) / 2;
  const units = Math.round((dailyRunRate * 14) / 10) * 10;
  return { dailyRunRate, days: 14, units, atCost: units * makingCost };
}

/** Typical minimum run and lead time for a type — placeholder hints only (the maker enters their own). */
export function typicalForType(type: ProductTypeId): { minRun: number; leadTimeDays: number } | null {
  return record(type).typical ?? null;
}

/** "What to make instead": open-gap types on the same line the maker doesn't already make, largest gap first. */
export function switchSuggestions(line: string, alreadyMaking: ProductTypeId | ProductTypeId[]): SwitchSuggestion[] {
  const skip = new Set<string>(Array.isArray(alreadyMaking) ? alreadyMaking : [alreadyMaking]);
  return (Object.keys(TYPES) as ProductTypeId[])
    .filter((k) => !k.startsWith('_') && TYPES[k]!.line === line && !skip.has(k))
    .map((k) => {
      const t = TYPES[k]!;
      return { type: k, name: t.name, gapPerWeek: t.demand.gapPerWeek, confidence: t.demand.confidence };
    })
    .sort((a, b) => b.gapPerWeek.low - a.gapPerWeek.low);
}
