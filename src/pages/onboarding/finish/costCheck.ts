// FO-5 cost check on the onboarding finish screen: the maker decides his own take-home. Two inputs, both empty until
// he types (no pre-fill, no suggested value): making cost per unit, and what he wants to earn per unit in ₹ or as a %
// of making cost. Once both are in: the fee stack and break-even, and "Your price ₹X · you earn ₹Y per unit" with
// X = (making + fees + Y) × 1.05 rounded to the nearest rupee (the engine's costStackAtTakeHome). The Factory Launch
// status of that price comes only from "Check price" (the bot's rationed check, launchCheck.ts); B is never shown.
// Pure functions only.
import { costStackAtTakeHome, takeHomeFromPct, type CostStack, type ProductTypeId } from '../../../engine/ui';

/** How the maker states his earning: rupees per unit, or a % of his making cost. */
export type EarnUnit = 'rupee' | 'pct';

export interface CostCheckInput {
  type: ProductTypeId;
  mode: 'selfShip' | 'packPoint';
  /** the inputs as typed ('' = empty) */
  making: string;
  earning: string;
  unit: EarnUnit;
}

export interface CostCheckResult {
  stack: CostStack;
  /** what he earns per unit, in whole rupees */
  takeHome: number;
  /** his price: the stack's list price */
  price: number;
}

/** Making cost and ₹ earning: whole rupees, at most 6 digits. */
export const cleanRupees = (v: string) => v.replace(/\D/g, '').slice(0, 6);

/** % earning: digits with at most one decimal point and 2 decimals, at most 3 whole digits ("17.5"). */
export function cleanPct(v: string): string {
  const [whole = '', ...rest] = v.replace(/[^\d.]/g, '').split('.');
  const w = whole.slice(0, 3);
  return rest.length ? `${w}.${rest.join('').slice(0, 2)}` : w;
}

/** The earning in rupees per unit: as typed (₹), or pct % of making cost rounded like the engine's marginPct. */
export function earningRupees(makingCost: number, earning: number, unit: EarnUnit): number {
  return unit === 'rupee' ? earning : takeHomeFromPct(makingCost, earning);
}

/** The cost check's numbers, or null until both inputs are filled (making cost above zero). */
export function costCheckResult(i: CostCheckInput): CostCheckResult | null {
  const making = Number(i.making);
  const earning = Number(i.earning);
  if (i.making === '' || i.earning === '' || !(making > 0) || !Number.isFinite(earning) || earning < 0) return null;
  const takeHome = earningRupees(making, earning, i.unit);
  const stack = costStackAtTakeHome(i.type, making, takeHome, i.mode);
  return { stack, takeHome, price: stack.listPrice };
}

/**
 * The ₹/% switch keeps the same earning: ₹14 on ₹80 ⇄ 17.5%. Without a making cost (or an earning) there is
 * nothing to convert, so the typed text stays as it is.
 */
export function switchUnit(making: string, earning: string, to: EarnUnit): string {
  const m = Number(making);
  if (earning === '' || !(m > 0)) return earning;
  const e = Number(earning);
  if (to === 'rupee') return String(takeHomeFromPct(m, e));
  return cleanPct(String(Math.round((e / m) * 10000) / 100));
}

/** "Fill demo values": the persona's making cost and the take-home his margin gives, in rupees (₹80 + ₹14; ₹200 + ₹30). */
export function demoCostValues(product: { makingCost: number; marginPct: number }): { making: string; earning: string; unit: EarnUnit } {
  return { making: String(product.makingCost), earning: String(takeHomeFromPct(product.makingCost, product.marginPct)), unit: 'rupee' };
}
