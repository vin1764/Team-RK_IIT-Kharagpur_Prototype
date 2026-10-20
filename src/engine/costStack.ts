import { NotImplemented, type FulfilmentMode, type ProductTypeId } from './types';

export interface Fees {
  packaging: number;
  shippingAndFixed: number;
  returnsBuffer: number;
  gst: number;
}

export interface CostStack {
  makingCost: number;
  fees: Fees;
  feesTotal: number;
  /** making cost + all fees */
  breakEven: number;
  /** marginPct % of making cost, rounded to the rupee */
  takeHome: number;
  /** breakEven + takeHome; becomes the Meesho Price */
  listPrice: number;
}

/**
 * Bot Price screen (LB-6) and cost check (FO-5).
 * Fees come from the product type's seed data.
 * `packPoint` mode throws MissingPlanValue until the Pack Point cost stack is given (Q3).
 */
export function costStack(
  type: ProductTypeId,
  makingCost: number,
  marginPct: number,
  mode: FulfilmentMode,
): CostStack {
  throw new NotImplemented('costStack');
}

/** Take-home at any price, for the cost check's "take-home at every price" (FO-5). */
export function takeHomeAt(price: number, stack: CostStack): number {
  throw new NotImplemented('takeHomeAt');
}
