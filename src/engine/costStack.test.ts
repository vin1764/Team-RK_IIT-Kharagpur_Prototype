import { describe, expect, it } from 'vitest';
import { costStack, gstAt, takeHomeAt } from './costStack';

// plan §8 costStack · §8b Break-even, Take-home, List price
// GST (team answer Q18): 5% of the selling price, included in it → GST = price × 5/105.
describe('costStack — Jasmeet, 1 L steel bottle, self-ship', () => {
  const s = () => costStack('steel-bottle-1l', 80, 17.5, 'selfShip');

  it('cost before GST: 80 + packaging 6 + shipping & fixed 32 + returns 8 = ₹126', () => {
    expect(s().costBeforeGst).toBe(126);
  });

  it('break-even = 126 × 1.05 = 132.3 → rounded up to ₹133', () => {
    expect(s().breakEven).toBe(133);
  });

  it('take-home = 17.5% × ₹80 = ₹14', () => {
    expect(s().takeHome).toBe(14);
  });

  it('list price = (126 + 14) × 1.05 = ₹147', () => {
    expect(s().listPrice).toBe(147);
  });

  it('at ₹147 the fees are packaging ₹6, shipping + fixed ₹32, returns ₹8, GST ₹7.00', () => {
    expect(s().fees).toEqual({ packaging: 6, shippingAndFixed: 32, returnsBuffer: 8, gst: 7 });
    expect(s().feesTotal).toBe(53);
  });

  it('take-home at ₹147 = 147 − 7 − 126 = ₹14', () => {
    expect(takeHomeAt(147, s())).toBe(14);
    expect(gstAt(147, s())).toBe(7);
  });

  it('break-even covers cost: take-home at ₹133 is not negative, at ₹132 it is', () => {
    expect(takeHomeAt(133, s())).toBeGreaterThanOrEqual(0);
    expect(takeHomeAt(132, s())).toBeLessThan(0);
  });
});

// Team answers 21 Oct 2026: Pack Point drops packaging ₹6, adds the ₹30 fee (40 makers); GST as above
describe('costStack — 1 L steel bottle, Pack Point (why Jasmeet self-ships)', () => {
  const p = () => costStack('steel-bottle-1l', 80, 17.5, 'packPoint');

  it('fees: Pack Point ₹30, shipping + fixed ₹32, returns ₹8, no packaging', () => {
    const { gst, ...rest } = p().fees;
    expect(rest).toEqual({ packPointFee: 30, shippingAndFixed: 32, returnsBuffer: 8 });
    expect(p().costBeforeGst).toBe(150);
  });

  it('break-even = (80 + 30 + 32 + 8) × 1.05 = 157.5 → ₹158', () => {
    expect(p().breakEven).toBe(158);
  });

  // team rounding rule: list price rounds to the NEAREST rupee (break-even still rounds up)
  it('same ₹14 take-home → list (150 + 14) × 1.05 = 172.2 → ₹172', () => {
    expect(p().takeHome).toBe(14);
    expect(p().listPrice).toBe(172);
  });

  it('the fee follows the pool size: 60 makers → ₹26 → (80+26+32+8) × 1.05 = 153.3 → ₹154', () => {
    expect(costStack('steel-bottle-1l', 80, 17.5, 'packPoint', 60).breakEven).toBe(154);
  });
});

// team (What to make instead → Plan a lot): demo values, same rounding rule for every product
describe('costStack — 1.5 L steel casserole (₹220, 15%, self-ship)', () => {
  const c = costStack('steel-casserole-1-5l', 220, 15, 'selfShip');
  it('220 + 8 + 40 + 10 = 278 → × 1.05 = 291.9 → break-even ₹292', () => {
    expect(c.costBeforeGst).toBe(278);
    expect(c.breakEven).toBe(292);
  });
  it('take-home 15% × 220 = ₹33 → list (278 + 33) × 1.05 = 326.55 → ₹327', () => {
    expect(c.takeHome).toBe(33);
    expect(c.listPrice).toBe(327);
  });
});
describe('costStack — 500 ml steel flask (₹100, 15%, self-ship)', () => {
  const c = costStack('steel-flask-500ml', 100, 15, 'selfShip');
  it('100 + 6 + 32 + 8 = 146 → × 1.05 = 153.3 → break-even ₹154', () => {
    expect(c.costBeforeGst).toBe(146);
    expect(c.breakEven).toBe(154);
  });
  it('take-home ₹15 → list (146 + 15) × 1.05 = 169.05 → ₹169', () => {
    expect(c.takeHome).toBe(15);
    expect(c.listPrice).toBe(169);
  });
});
