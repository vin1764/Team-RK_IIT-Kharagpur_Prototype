import { NotImplemented } from './types';

export interface PackPointFee {
  makersPooled: number;
  ordersPerMonth: number;
  monthlyCost: number;
  /** monthly cost ÷ orders, exact */
  costPerOrderHandled: number;
  /** × 1.18 partner margin, exact */
  feePerOrderHandled: number;
  /** ÷ (1 − 17.8% RTO), exact */
  feePerDeliveredOrderExact: number;
  /** rounded to the rupee, as shown on the fee card */
  feePerDeliveredOrder: number;
  /** a node opens only at the 40-maker density floor */
  opens: boolean;
}

/**
 * Pack Point fee per delivered order (PP-4), built bottom-up from the deck's cost model.
 * Supports the deck's tabulated pool sizes (20, 40, 60, 80); others throw MissingPlanValue.
 */
export function packPointFee(makersPooled: number): PackPointFee {
  throw new NotImplemented('packPointFee');
}
