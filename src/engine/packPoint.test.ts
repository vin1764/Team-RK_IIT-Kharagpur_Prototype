import { describe, expect, it } from 'vitest';
import { packPointFee } from './packPoint';

// plan §8 packPointFee · §8b Pack Point fee · deck appendix cost table
describe('packPointFee', () => {
  it('40 makers: ₹1,26,444 ÷ 6,000 = ₹21.07 → × 1.18 = ₹24.87 → ÷ 0.822 = ₹30.3 → ₹30', () => {
    const f = packPointFee(40);
    expect(f.ordersPerMonth).toBe(6000);
    expect(Math.round(f.monthlyCost)).toBe(126444);
    expect(f.costPerOrderHandled).toBeCloseTo(21.07, 2);
    expect(f.feePerOrderHandled).toBeCloseTo(24.87, 2);
    expect(f.feePerDeliveredOrderExact).toBeCloseTo(30.25, 1);
    expect(f.feePerDeliveredOrder).toBe(30);
    expect(f.opens).toBe(true);
  });

  it.each([
    [20, 92444, 44, false],
    [40, 126444, 30, true],
    [60, 160444, 26, true],
    [80, 194444, 23, true],
  ])('%i makers → monthly ₹%i → ₹%i per delivered order (opens: %s)', (makers, monthly, fee, opens) => {
    const f = packPointFee(makers);
    expect(Math.round(f.monthlyCost)).toBe(monthly);
    expect(f.feePerDeliveredOrder).toBe(fee);
    expect(f.opens).toBe(opens);
  });
});
