import { describe, expect, it } from 'vitest';
import growthSeed from '../../../data/growth.json';
import launch from '../../../data/launch.json';
import { costStack, growthAt, packPointFee } from '../../../engine/ui';
import { niceAxis, weekSeries } from '../business-dashboard/series';
import { costCheckMode, demandOrNull, likelyShareOrNull } from '../../onboarding/signup/guards';
import { effectivePriceEdit, positionOrNull, priceHoldView, SCRIPTED_PRICE_EDIT } from './priceHold';

const BOTTLE = 'steel-bottle-1l' as const;
const listing = { id: '', typeId: BOTTLE, name: '1 L steel water bottle', price: 147, breakEven: 133 };

describe('Price position and price-hold (PI-2, PI-3)', () => {
  it('₹147 qualifies, lowest third; no edit keeps the slot', () => {
    const v = priceHoldView(listing, true, null);
    expect([v.price, v.status, v.position, v.slotRemoved]).toEqual([147, 'qualifies', 'low', false]);
  });
  it('scripted D40 edit to ₹165: doesn’t qualify, middle third, slot removed', () => {
    const e = effectivePriceEdit(undefined, SCRIPTED_PRICE_EDIT.day, 'jasmeet');
    expect(e).toEqual({ price: 165, day: 40, scripted: true });
    const v = priceHoldView(listing, true, e);
    expect([v.price, v.status, v.position, v.slotRemoved]).toEqual([165, 'aboveCap', 'mid', true]);
  });
  it('no scripted edit before D40 or for other personas', () => {
    expect(effectivePriceEdit(undefined, 39, 'jasmeet')).toBeNull();
    expect(effectivePriceEdit(undefined, 50, 'samar')).toBeNull();
  });
  it('an interactive edit wins once its day is reached', () => {
    expect(effectivePriceEdit({ price: 147, day: 40 }, 40, 'jasmeet')).toEqual({ price: 147, day: 40, scripted: false });
    expect(effectivePriceEdit({ price: 150, day: 45 }, 40, 'jasmeet')?.scripted).toBe(true);
  });
  it('back to ₹147 qualifies again; below break-even is belowCost and removes the slot', () => {
    expect(priceHoldView(listing, true, { price: 147, day: 41, scripted: false }).slotRemoved).toBe(false);
    const low = priceHoldView(listing, true, { price: 120, day: 41, scripted: false });
    expect([low.status, low.slotRemoved]).toEqual(['belowCost', true]);
  });
  it('without a commit there is no slot to remove', () => {
    expect(priceHoldView(listing, false, { price: 165, day: 40, scripted: true }).slotRemoved).toBe(false);
  });
  it('a price inside a comparable group’s range has no third (never guessed); above all → high', () => {
    expect(positionOrNull(BOTTLE, 170)).toBeNull();
    expect(positionOrNull(BOTTLE, 200)).toBe('high');
  });
});

describe('Business Dashboard week (D28)', () => {
  const g = growthAt(28, { lot: 150, leadTimeDays: 5, minRun: 100, makingCost: 80, listPrice: 147 })!;
  it('orders per day are the launch series D21–D27', () => {
    expect(weekSeries(g.weekDaily, 147, 'orders').map((p) => p.value)).toEqual([12, 10, 11, 11, 12, 11, 10]);
    expect(g.weekDaily.map((d) => d.orders)).toEqual([21, 22, 23, 24, 25, 26, 27].map((d) => (launch.dailyOrders as Record<string, number>)[d]));
  });
  it('sales per day = orders × ₹147, summing to the Total Sales tile ₹11,319', () => {
    const sales = weekSeries(g.weekDaily, 147, 'sales');
    expect(sales.reduce((s, p) => s + p.value, 0)).toBe(11319);
    expect(g.dashboard.sales).toBe(11319);
  });
  it('Home card count: 77 of 150 sold to the end of D27, 73 left', () => {
    expect([g.soldBefore, g.onHand]).toEqual([77, 73]);
  });
  it('product row metrics', () => {
    expect([g.dashboard.views, g.dashboard.clicks, g.dashboard.orders, g.dashboard.returns]).toEqual([
      growthSeed.dashboard.views,
      growthSeed.dashboard.clicks,
      77,
      1,
    ]);
  });
  it('axis tops', () => {
    expect(niceAxis(12)).toEqual({ top: 15, step: 5 });
    expect(niceAxis(1764)).toEqual({ top: 2000, step: 1000 });
  });
});

describe('Samar guards (no demand gap, no self-ship packaging)', () => {
  it('demand and share are null, never invented', () => {
    expect(demandOrNull('sneakers-slip-on-men')).toBeNull();
    expect(likelyShareOrNull('sneakers-slip-on-men')).toBeNull();
    expect(demandOrNull(BOTTLE)?.gapPerWeek).toEqual({ low: 300, high: 450 });
  });
  it('cost check runs in Pack Point mode for Samar: break-even ₹305, list ₹336', () => {
    const mode = costCheckMode({ fulfilment: 'packPoint' }, 'sneakers-slip-on-men');
    expect(mode).toBe('packPoint');
    const s = costStack('sneakers-slip-on-men', 200, 15, mode);
    expect([s.breakEven, s.listPrice, s.fees.packPointFee]).toEqual([305, 336, 30]);
    expect(costCheckMode({ fulfilment: 'selfShip' }, BOTTLE)).toBe('selfShip');
  });
  it('fee ladder ₹44 / ₹30 / ₹26 / ₹23', () => {
    expect([20, 40, 60, 80].map((n) => packPointFee(n).feePerDeliveredOrder)).toEqual([44, 30, 26, 23]);
  });
});
