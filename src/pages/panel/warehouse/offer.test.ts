import { describe, expect, it } from 'vitest';
import { PERSONAS } from '../../../store/onboarding';
import { costStack } from '../../../engine/ui';
import { packPointOffer } from './offer';

const bottle = { typeId: 'steel-bottle-1l' as const, makingCost: 80, marginPct: 17.5 };

describe('Cluster Pack Point card: who sees it (Phase 6 review)', () => {
  it('Samar (Pack Point, 282000) → Agra live, as a member', () => {
    const o = packPointOffer(PERSONAS.samar, null)!;
    expect(o.node.city).toBe('Agra');
    expect(o.node.status).toBe('live');
    expect(o.usesPackPoint).toBe(true);
  });
  it('Jasmeet (self-ship, 360000) with a listing → Rajkot live, as an offer', () => {
    const o = packPointOffer(PERSONAS.jasmeet, bottle)!;
    expect(o.node.city).toBe('Rajkot');
    expect(o.usesPackPoint).toBe(false);
  });
  it('Jasmeet before she lists → no card (Warehouse compare stays the replica)', () => {
    expect(packPointOffer(PERSONAS.jasmeet, null)).toBeNull();
  });
  it('reseller (not Factory-verified) → no card, even in Rajkot', () => {
    expect(PERSONAS.reseller.address.pincode).toBe('360000');
    expect(packPointOffer(PERSONAS.reseller, bottle)).toBeNull();
  });
  it('a pincode outside every cluster → no card', () => {
    const away = { ...PERSONAS.jasmeet, address: { ...PERSONAS.jasmeet.address, pincode: '100000' } };
    expect(packPointOffer(away, bottle)).toBeNull();
  });
  it('a pincode in an opening cluster → Moradabad, opening at 40 makers, no live fee', () => {
    const m = { ...PERSONAS.jasmeet, address: { ...PERSONAS.jasmeet.address, pincode: '244000' } };
    const o = packPointOffer(m, bottle)!;
    expect(o.node).toMatchObject({ city: 'Moradabad', status: 'opening', opensAtMakers: 40 });
    expect(o.node.makersPooled).toBeUndefined();
  });
  it("Jasmeet's Pack Point stack ₹158 / ₹172 vs self-ship ₹133 / ₹147", () => {
    const pp = costStack('steel-bottle-1l', 80, 17.5, 'packPoint', 40);
    const ss = costStack('steel-bottle-1l', 80, 17.5, 'selfShip');
    expect([pp.breakEven, pp.listPrice, ss.breakEven, ss.listPrice]).toEqual([158, 172, 133, 147]);
  });
});
