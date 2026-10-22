import { describe, expect, it } from 'vitest';
import { canSelfShip, switchRows, warehouseShip, type SwitchListing } from './switch';

const bottle = (price: number, mode: SwitchListing['mode'] = 'selfShip'): SwitchListing => ({
  key: 'scripted-steel-bottle-1l',
  id: '900000001',
  name: '1 L steel water bottle',
  typeId: 'steel-bottle-1l',
  price,
  makingCost: 80,
  marginPct: 17.5,
  mode,
});

describe('Warehouse Pack Point switch: confirm panel rows (engine numbers)', () => {
  it('Jasmeet’s bottle at ₹147: take-home ₹14 today → −₹10 on Pack Point (₹147 < ₹158 break-even) → not eligible', () => {
    const [r] = switchRows([bottle(147)], 'packPoint', 40);
    expect(r).toMatchObject({ takeHomeNow: 14, takeHomeAfter: -10, statusAfter: 'notEligible' });
  });

  it('at ₹172 (her Pack Point list price) the bottle earns her margin back: ₹14 on Pack Point', () => {
    const [r] = switchRows([bottle(172)], 'packPoint', 40);
    expect(r!.takeHomeAfter).toBe(14);
  });

  it('switching back to self-ship from ₹172 on Pack Point: ₹14 → ₹38', () => {
    const [r] = switchRows([bottle(172, 'packPoint')], 'selfShip', 40);
    expect(r).toMatchObject({ takeHomeNow: 14, takeHomeAfter: 38 });
  });

  it('Samar switching back to self-ship (₹10 mailer): at his ₹336 the take-home goes ₹30 → ₹50 and it still qualifies', () => {
    expect(canSelfShip('sneakers-slip-on-men')).toBe(true);
    expect(canSelfShip('steel-bottle-1l')).toBe(true);
    const [r] = switchRows([{ ...bottle(336, 'packPoint'), typeId: 'sneakers-slip-on-men', makingCost: 200, marginPct: 15 }], 'selfShip', 40);
    expect(r!.takeHomeNow).toBe(30);
    expect(r!.takeHomeAfter).toBeCloseTo(336 / 1.05 - 270, 6); // = ₹50
    expect(r!.statusAfter).toBe('qualifies');
  });
});

describe('Warehouse ship mode', () => {
  it('no switch: the onboarding choice (Samar on Agra, Jasmeet self-ship)', () => {
    expect(warehouseShip('packPoint', 'Agra', undefined)).toEqual({ mode: 'packPoint', node: 'Agra', switched: false });
    expect(warehouseShip('selfShip', 'Rajkot', undefined)).toEqual({ mode: 'selfShip', node: null, switched: false });
  });
  it('a Warehouse switch wins', () => {
    expect(warehouseShip('selfShip', 'Rajkot', { mode: 'packPoint', node: 'Rajkot', listings: [], day: 28 })).toEqual({ mode: 'packPoint', node: 'Rajkot', switched: true });
  });
});
