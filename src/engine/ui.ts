// The only engine entry point UI code may import.
// Nothing exported here returns or accepts Benchmark B.

import { NotImplemented, type ProductTypeId } from './types';
import type { PricePosition, PriceStatus } from './benchmark';

export { costStack, takeHomeAt } from './costStack';
export { demandForType, likelyShare, slots, suggestedLot, switchSuggestions } from './demand';
export { restock } from './restock';
export { verdict } from './verdict';
export { coachFix } from './coach';
export { eligibility, BUSINESS_TYPES } from './eligibility';
export { packPointFee } from './packPoint';
export { dayToDate, dayLabel, formatDate } from './calendar';
export type { PricePosition, PriceStatus };

/** Cost check (FO-5): "a qualifying price exists" ⇔ breakEven ≤ B. */
export function qualifyingPriceExists(type: ProductTypeId, breakEven: number): boolean {
  throw new NotImplemented('qualifyingPriceExists');
}

/** Bot Price screen, launch commit and price-hold (LB-6, LW-5, PI-3): status only, B computed inside. */
export function checkListingPrice(type: ProductTypeId, price: number, breakEven: number): PriceStatus {
  throw new NotImplemented('checkListingPrice');
}

/** Manage Pricing → Price position (PI-2): third only. */
export function listingPricePosition(type: ProductTypeId, price: number): PricePosition {
  throw new NotImplemented('listingPricePosition');
}
