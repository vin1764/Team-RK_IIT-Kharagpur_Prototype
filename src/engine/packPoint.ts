import M from '../data/packPointModel.json';
import { MissingPlanValue } from './types';

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

type Staff = { packers: number; handlers: number; supervisors: number };

/**
 * Pack Point fee per delivered order (PP-4), built bottom-up from the deck's cost model.
 * Supports the deck's tabulated pool sizes (20, 40, 60, 80); others throw MissingPlanValue.
 */
export function packPointFee(makersPooled: number): PackPointFee {
  const staff = (M.staffByPoolSize as unknown as Record<string, Staff | undefined>)[String(makersPooled)];
  if (!staff) throw new MissingPlanValue(`Pack Point staffing for ${makersPooled} makers (deck tabulates 20/40/60/80)`);

  const ordersPerMonth = makersPooled * M.ordersPerMakerPerMonth;
  const areaSqFt = M.fixedOpsAreaSqFt + (makersPooled * M.unitsOnHandPerMaker) / M.unitsPerSqFt;
  const monthlyCost =
    areaSqFt * M.rentPerSqFt +
    staff.packers * M.salaries.packer +
    staff.handlers * M.salaries.handler +
    staff.supervisors * M.salaries.supervisor +
    ordersPerMonth * M.consumablesPerOrder +
    M.equipment.cost / M.equipment.months +
    M.utilitiesPerMonth;

  const costPerOrderHandled = monthlyCost / ordersPerMonth;
  const feePerOrderHandled = costPerOrderHandled * M.partnerMarginMultiplier;
  const feePerDeliveredOrderExact = feePerOrderHandled / (1 - M.blendedRtoRate);

  return {
    makersPooled,
    ordersPerMonth,
    monthlyCost,
    costPerOrderHandled,
    feePerOrderHandled,
    feePerDeliveredOrderExact,
    feePerDeliveredOrder: Math.round(feePerDeliveredOrderExact),
    opens: makersPooled >= M.densityFloorMakers,
  };
}
