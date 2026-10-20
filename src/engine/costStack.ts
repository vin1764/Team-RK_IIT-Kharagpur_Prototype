import { NotImplemented, type FulfilmentMode, type ProductTypeId } from './types';

/**
 * Per-delivered-order fees. Self-ship has `packaging`; Pack Point drops it and adds
 * `packPointFee` (the node packs; GST is inside the fee). The other three are the same in both modes.
 */
export interface Fees {
  packaging?: number;
  packPointFee?: number;
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
 * Fees come from the product type's seed data; in `packPoint` mode the fee is
 * packPointFee(makersPooled).feePerDeliveredOrder (₹30 at the 40-maker base).
 * Storage is not part of the per-order stack; it's shown on the Warehouse page.
 */
export function costStack(
  type: ProductTypeId,
  makingCost: number,
  marginPct: number,
  mode: FulfilmentMode,
  makersPooled = 40,
): CostStack {
  throw new NotImplemented('costStack');
}

/** Take-home at any price, for the cost check's "take-home at every price" (FO-5). */
export function takeHomeAt(price: number, stack: CostStack): number {
  throw new NotImplemented('takeHomeAt');
}
