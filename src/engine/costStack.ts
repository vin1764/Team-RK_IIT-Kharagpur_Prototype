import data from '../data/productTypes.json';
import { packPointFee } from './packPoint';
import { MissingPlanValue, type FulfilmentMode, type ProductTypeId } from './types';

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

type TypeFees = { packaging: number; shippingAndFixed: number; returnsBuffer: number; gst: number };

/** Seed fees for a product type, or MissingPlanValue if the plan has none. */
export function typeFees(type: ProductTypeId): TypeFees {
  const t = (data as unknown as Record<string, { fees?: TypeFees }>)[type];
  if (!t?.fees) throw new MissingPlanValue(`fee stack for product type ${type}`);
  return t.fees;
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
  const t = typeFees(type);
  const fees: Fees =
    mode === 'selfShip'
      ? { packaging: t.packaging, shippingAndFixed: t.shippingAndFixed, returnsBuffer: t.returnsBuffer, gst: t.gst }
      : {
          packPointFee: packPointFee(makersPooled).feePerDeliveredOrder,
          shippingAndFixed: t.shippingAndFixed,
          returnsBuffer: t.returnsBuffer,
          gst: t.gst,
        };
  const feesTotal = Object.values(fees).reduce((sum: number, v) => sum + (v ?? 0), 0);
  const breakEven = makingCost + feesTotal;
  const takeHome = Math.round((makingCost * marginPct) / 100);
  return { makingCost, fees, feesTotal, breakEven, takeHome, listPrice: breakEven + takeHome };
}

/** Take-home at any price, for the cost check's "take-home at every price" (FO-5). */
export function takeHomeAt(price: number, stack: CostStack): number {
  return price - stack.breakEven;
}
