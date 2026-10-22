// The only engine entry point UI code may import.
// Nothing exported here returns or accepts Benchmark B.

import data from '../data/productTypes.json';
import { benchmarkB, priceCheck, pricePosition, type Comparable, type PricePosition, type PriceStatus } from './benchmark';
import { MissingPlanValue, type ProductTypeId } from './types';

export { costStack, gstAt, takeHomeAt, typeFees, type CostStack, type Fees } from './costStack';
export { demandForType, demoInputsForType, likelyOrdersPerDay, likelyShare, productTypeName, slots, suggestedLot, switchSuggestions, typicalForType } from './demand';
export { restock, type Restock } from './restock';
export { launchProgress, trailingRunRate, type LaunchProgress } from './launch';
export { verdict, type Verdict, type SkuHealth } from './verdict';
export { coachFix, type CoachFix } from './coach';
export { funnelStats, pctDisplay, type FunnelStats } from './funnel';
export { firstLotPlan, type FirstLotInput, type FirstLotPlan } from './firstLot';
export { planBatch, stockOn, landsDayOf, type BatchPlan, type PlanInput, type PlannedBatch, type StockBase } from './restockPlan';
export { growthAt, type GrowthView, type MakerInputs, type SkuVerdict, type CoachCard, type VerdictReason } from './growth';
export {
  eligibility,
  BUSINESS_TYPES,
  MANUFACTURER_TYPES,
  GST_FACTORY_NATURE,
  type BusinessType,
  type Eligibility,
  type EligibilityCheck,
  type MakerRecords,
} from './eligibility';
export { packPointFee } from './packPoint';
export { clusterForPincode, lotInbound, sizeSplit, sizeSplitFor, type LotInbound, type LotSeed } from './lot';
export { dayToDate, dateToDay, dayLabel, formatDate } from './calendar';
export type { PricePosition, PriceStatus, ProductTypeId };

interface BenchmarkSeed {
  minDeliveredOrders: number;
  comparables: Comparable[];
}

function seed(type: ProductTypeId): BenchmarkSeed {
  const b = (data as unknown as Record<string, { benchmark?: BenchmarkSeed }>)[type]?.benchmark;
  if (!b) throw new MissingPlanValue(`benchmark comparables for ${type}`);
  return b;
}

const B = (type: ProductTypeId) => {
  const s = seed(type);
  return benchmarkB(s.comparables, s.minDeliveredOrders);
};

/** Cost check (FO-5): "a qualifying price exists" ⇔ breakEven ≤ B. */
export function qualifyingPriceExists(type: ProductTypeId, breakEven: number): boolean {
  return breakEven <= B(type);
}

/** Bot Price screen, launch commit and price-hold (LB-6, LW-5, PI-3): status only, B computed inside. */
export function checkListingPrice(type: ProductTypeId, price: number, breakEven: number): PriceStatus {
  return priceCheck(price, breakEven, B(type));
}

/** Manage Pricing → Price position (PI-2): third only. */
export function listingPricePosition(type: ProductTypeId, price: number): PricePosition {
  const s = seed(type);
  return pricePosition(price, s.comparables, s.minDeliveredOrders);
}
