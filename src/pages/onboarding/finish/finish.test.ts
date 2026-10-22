import { describe, expect, it } from 'vitest';
import { costStack, demandForType } from '../../../engine/ui';
import { finishMode, hasFeeCard } from './CostCheckInline';
import { pathForType, recognisedType, searchProducts, typeForPath } from './productPick';
import { FIN } from './copy';
import { rupeeRange } from '../signup/nav';

describe('finish screen: what do you make?', () => {
  it('the tree’s Water Bottles leaf is the 1 L steel bottle; other leaves have no product type', () => {
    expect(typeForPath(['Home & Kitchen', 'Kitchen & Dining', 'Kitchen Storage', 'Water Bottles'])).toBe('steel-bottle-1l');
    expect(typeForPath(['Home & Kitchen', 'Kitchen & Dining', 'Kitchen Storage', 'Lunch Boxes'])).toBeNull();
  });

  it('search finds tree leaves and product types outside the captured tree (Samar: “sneakers”)', () => {
    expect(searchProducts('water').map((h) => h.leaf)).toContain('Water Bottles');
    const hit = searchProducts('sneakers')[0]!;
    expect(hit.path).toEqual(pathForType('sneakers-slip-on-men'));
    expect(typeForPath(hit.path)).toBe('sneakers-slip-on-men');
  });

  it('one photo: the bot recognises only a type it has data for', () => {
    expect(recognisedType('steel-bottle-1l')).toBe('steel-bottle-1l');
    expect(recognisedType('sneakers-slip-on-men')).toBeNull();
  });
});

describe('finish screen: teaser and cost check numbers', () => {
  it('teaser: about 300 a week at ₹150–170 (bottle), 175 at ₹350–400 (sneakers)', () => {
    const b = demandForType('steel-bottle-1l');
    expect(FIN.gap(b.gapPerWeek.low, rupeeRange(b.priceBand!.low, b.priceBand!.high))).toBe('About 300 orders a week go unserved at ₹150–170');
    const s = demandForType('sneakers-slip-on-men');
    expect(FIN.gap(s.gapPerWeek.low, rupeeRange(s.priceBand!.low, s.priceBand!.high))).toBe('About 175 orders a week go unserved at ₹350–400');
  });

  it('cost check uses the Pickup Address choice: Jasmeet self-ship ₹133 / ₹147 / ₹14; Samar Pack Point ₹305 / ₹336', () => {
    expect(finishMode('selfShip', { fulfilment: 'selfShip' }, 'steel-bottle-1l')).toBe('selfShip');
    const j = costStack('steel-bottle-1l', 80, 17.5, 'selfShip');
    expect([j.breakEven, j.listPrice, j.takeHome]).toEqual([133, 147, 14]);
    expect(finishMode('packPoint', { fulfilment: 'packPoint' }, 'sneakers-slip-on-men')).toBe('packPoint');
    // no self-ship packaging value for sneakers: Pack Point stack whatever the choice
    expect(finishMode('selfShip', { fulfilment: 'packPoint' }, 'sneakers-slip-on-men')).toBe('packPoint');
    const s = costStack('sneakers-slip-on-men', 200, 15, 'packPoint');
    expect([s.breakEven, s.listPrice]).toEqual([305, 336]);
    expect(hasFeeCard('steel-casserole-1-5l')).toBe(false);
  });
});
