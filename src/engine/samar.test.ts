import { describe, expect, it } from 'vitest';
import lot from '../data/packPointLot.json';
import types from '../data/productTypes.json';
import { benchmarkB, priceCheck, priceDrop } from './benchmark';
import { costStack, gstAt } from './costStack';
import { demandForType, likelyOrdersPerDay, likelyShare, slots, suggestedLot } from './demand';
import { lotInbound, sizeSplit } from './lot';
import { packPointFee } from './packPoint';

// Team Q4 (Phase 6 answers): Samar, men's casual slip-on sneakers, Agra Pack Point
const T = 'sneakers-slip-on-men' as const;

describe('Samar — cost stack at the Agra Pack Point (40 makers)', () => {
  const s = costStack(T, 200, 15, 'packPoint', 40);

  it('fee ₹30 at 40 makers', () => expect(packPointFee(40).feePerDeliveredOrder).toBe(30));
  it('take-home 15% × ₹200 = ₹30', () => expect(s.takeHome).toBe(30));
  it('cost before GST 200 + 30 + 40 + 20 = ₹290', () => expect(s.costBeforeGst).toBe(290));
  it('break-even 290 × 1.05 = 304.5 → ₹305', () => expect(s.breakEven).toBe(305));
  it('list (290 + 30) × 1.05 = ₹336', () => expect(s.listPrice).toBe(336));
  it('GST at ₹336 = ₹16', () => {
    expect(gstAt(336, s)).toBe(16);
    expect(s.fees).toEqual({ packPointFee: 30, shippingAndFixed: 40, returnsBuffer: 20, gst: 16 });
  });
  it('self-ship (shoe-box mailer ₹10, team): 200 + 10 + 40 + 20 = 270 → break-even 283.5 → ₹284 · list (270 + 30) × 1.05 = ₹315 · GST ₹15 · take-home ₹30', () => {
    const s = costStack(T, 200, 15, 'selfShip');
    expect([s.costBeforeGst, s.breakEven, s.listPrice, s.fees.gst, s.takeHome]).toEqual([270, 284, 315, 15, 30]);
  });
});

describe('Samar — hidden B ₹370', () => {
  const b = types[T].benchmark;
  const B = benchmarkB(b.comparables, b.minDeliveredOrders);
  it('B = ₹370', () => expect(B).toBe(370));
  it('₹336 qualifies', () => expect(priceCheck(336, 305, B)).toBe('qualifies'));
  it('price drop ₹34 = 9.2% of B, meets the 8% target', () => {
    const d = priceDrop(336, B);
    expect(d.rupees).toBe(34);
    expect((d.shareOfB * 100).toFixed(1)).toBe('9.2');
    expect(d.meetsTarget).toBe(true);
  });
});

describe('Samar — demand (team, Phase 6 review)', () => {
  it('175–280 a week unserved at ₹350–400, Medium, 0 committed', () => {
    expect(demandForType(T)).toEqual({ gapPerWeek: { low: 175, high: 280 }, priceBand: { low: 350, high: 400 }, confidence: 'Medium', committedUnits: 0 });
  });
  it('20% share → 35–56 a week = 5–8 a day', () => {
    const s = likelyShare(T);
    expect(s.ordersPerWeek).toEqual({ low: 35, high: 56 });
    expect(s.ordersPerDay).toEqual({ low: 5, high: 8 });
  });
  it('5 slots: 175 ÷ 35 = 280 ÷ 56 = 5', () => expect(slots(T)).toBe(5));
});

describe('Samar — first lot', () => {
  it('likely 5–8 orders a day', () => expect(likelyOrdersPerDay(T)).toEqual({ low: 5, high: 8 }));
  it('6.5 × 14 = 91 → 90 pairs, ≈ ₹18,000 at cost', () => {
    expect(suggestedLot(T, 200)).toMatchObject({ dailyRunRate: 6.5, units: 90, atCost: 18000 });
  });
  it('size split 6/7/8/9/10 = 10/20/25/20/15 adds to 90', () => {
    expect(sizeSplit(types[T].sizeSplit, 90).map((r) => [r.size, r.units])).toEqual([
      ['6', 10], ['7', 20], ['8', 25], ['9', 20], ['10', 15],
    ]);
  });
  it('a split that doesn’t add up throws', () => expect(() => sizeSplit({ '6': 10 }, 90)).toThrow());
});

describe('Samar — D50 lot inbound at Agra', () => {
  const r = lotInbound(lot);
  it('expected 90, received 90', () => expect([r.expected, r.received, r.shortBy]).toEqual([90, 90, 0]));
  it('~650 g packed, ±5% → 617.5–682.5 g', () => expect(r.weightRangeG).toEqual({ low: 617.5, high: 682.5 }));
  it('storage free to D80 (D50 + 30), then 90 × ₹0.29 = ₹26.10 a day', () => {
    expect(r.storageFreeUntilDay).toBe(80);
    expect(r.storagePerDayAfterFree).toBe(26.1);
  });
});

import nodes from '../data/packPointNodes.json';
import personas from '../data/personas.json';
import { clusterForPincode } from './lot';

describe('Pack Point cluster by pickup pincode (team, Phase 6 review)', () => {
  it('Samar (Agra) → Agra, live', () => expect(clusterForPincode(nodes.nodes, personas.samar.address.pincode)).toMatchObject({ city: 'Agra', status: 'live' }));
  it('Jasmeet (Rajkot) → Rajkot, live', () => expect(clusterForPincode(nodes.nodes, personas.jasmeet.address.pincode)).toMatchObject({ city: 'Rajkot' }));
  it('a Moradabad pincode → opening cluster', () => expect(clusterForPincode(nodes.nodes, '244001')).toMatchObject({ status: 'opening' }));
  it('outside every cluster → null', () => expect(clusterForPincode(nodes.nodes, '110001')).toBeNull());
});

// Hidden B for the switch products (team): never shown; ₹327 and ₹169 qualify
import { benchmarkB as bB, priceCheck as pC } from './benchmark';
describe('What to make instead — price checks (hidden B)', () => {
  for (const [t, list, be] of [['steel-casserole-1-5l', 327, 292], ['steel-flask-500ml', 169, 154]] as const) {
    it(`${t}: ₹${list} qualifies`, () => {
      const b = types[t].benchmark;
      expect(pC(list, be, bB(b.comparables, b.minDeliveredOrders))).toBe('qualifies');
    });
  }
});
