import data from '../data/productTypes.json';
import { packPointFee } from './packPoint';
import { MissingPlanValue, type FulfilmentMode, type ProductTypeId } from './types';

/**
 * Per-delivered-order fees at the list price. Self-ship has `packaging`; Pack Point drops it and
 * adds `packPointFee` (the node packs; the partner's margin is inside the fee; GST on the service isn't modelled (open question)). `gst` is the OUTPUT
 * GST inside the list price (Q18: 5% of the selling price, included in it → price × 5/105).
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
  /** making cost + every fee except GST */
  costBeforeGst: number;
  gstRate: number;
  /** fees at the list price, GST included */
  fees: Fees;
  feesTotal: number;
  /** lowest whole-rupee price whose ex-GST value covers costBeforeGst: ⌈costBeforeGst × (1 + rate)⌉ */
  breakEven: number;
  /** what the maker earns per unit: marginPct % of making cost rounded to the rupee, or the rupees he typed */
  takeHome: number;
  /** ⌈(costBeforeGst + takeHome) × (1 + rate)⌉; becomes the Meesho Price */
  listPrice: number;
}

export type TypeFees = { packaging: number | null; shippingAndFixed: number; returnsBuffer: number; gstRate: number };

const round2 = (x: number) => Math.round(x * 100) / 100;
/** ceil that ignores floating-point dust (140 × 1.05 = 147.00000000000003 → 147). */
const ceilRupee = (x: number) => Math.ceil(x - 1e-6);
/** nearest rupee, ignoring floating-point dust (team rule: list price rounds to the nearest rupee). */
const roundRupee = (x: number) => Math.round(x + 1e-9);

/** Seed fees for a product type, or MissingPlanValue if the plan has none. */
export function typeFees(type: ProductTypeId): TypeFees {
  const t = (data as unknown as Record<string, { fees?: TypeFees }>)[type];
  if (!t?.fees) throw new MissingPlanValue(`fee stack for product type ${type}`);
  return t.fees;
}

/** Output GST contained in a GST-inclusive price. */
export function gstInPrice(price: number, gstRate: number): number {
  return round2((price * gstRate) / (1 + gstRate));
}

/** The take-home a margin gives: marginPct % of making cost, rounded to the rupee (₹80 × 17.5% = ₹14). */
export function takeHomeFromPct(makingCost: number, marginPct: number): number {
  return Math.round((makingCost * marginPct) / 100);
}

/**
 * Bot Price screen (LB-6) and cost check (FO-5), with the maker's margin as a % of making cost.
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
  return costStackAtTakeHome(type, makingCost, takeHomeFromPct(makingCost, marginPct), mode, makersPooled);
}

/**
 * The same stack when the maker says what he wants to earn per unit in rupees (FO-5 cost check: "What you want to
 * earn per unit"). `takeHome` is used as given; the list price is (making + fees + takeHome) × (1 + GST), rounded
 * to the nearest rupee, exactly as costStack's.
 */
export function costStackAtTakeHome(
  type: ProductTypeId,
  makingCost: number,
  takeHome: number,
  mode: FulfilmentMode,
  makersPooled = 40,
): CostStack {
  const t = typeFees(type);
  if (mode === 'selfShip' && t.packaging === null) throw new MissingPlanValue(`self-ship packaging for ${type}`);
  const handling =
    mode === 'selfShip' ? { packaging: t.packaging as number } : { packPointFee: packPointFee(makersPooled).feePerDeliveredOrder };
  const costBeforeGst =
    makingCost + (handling.packaging ?? 0) + (handling.packPointFee ?? 0) + t.shippingAndFixed + t.returnsBuffer;
  const breakEven = ceilRupee(costBeforeGst * (1 + t.gstRate));
  // Rounding rule (team, same for every product): break-even rounds UP (never below cost); the list price rounds
  // to the NEAREST rupee (₹172.2 → ₹172, ₹326.55 → ₹327, ₹169.05 → ₹169).
  const listPrice = roundRupee((costBeforeGst + takeHome) * (1 + t.gstRate));
  const fees: Fees = {
    ...handling,
    shippingAndFixed: t.shippingAndFixed,
    returnsBuffer: t.returnsBuffer,
    gst: gstInPrice(listPrice, t.gstRate),
  };
  const feesTotal = round2(Object.values(fees).reduce((sum: number, v) => sum + (v ?? 0), 0));
  return { makingCost, costBeforeGst, gstRate: t.gstRate, fees, feesTotal, breakEven, takeHome, listPrice };
}

/** Take-home at any GST-inclusive price, for the cost check's "take-home at every price" (FO-5). */
export function takeHomeAt(price: number, stack: CostStack): number {
  return round2(price / (1 + stack.gstRate) - stack.costBeforeGst);
}

/** GST inside a given price, for showing the GST row at any price. */
export function gstAt(price: number, stack: CostStack): number {
  return gstInPrice(price, stack.gstRate);
}
