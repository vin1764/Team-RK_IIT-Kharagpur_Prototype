import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import personas from '../../../data/personas.json';
import { costStack, demandForType } from '../../../engine/ui';
import { priceCheckKey, usePriceChecks } from '../../../store/priceChecks';
import { launchCheckView, MAX_PRICE_CHECKS } from '../../panel/catalog/launchCheck';
import { finishMode, hasFeeCard } from './CostCheckInline';
import { cleanPct, costCheckResult, demoCostValues, switchUnit, type CostCheckInput } from './costCheck';
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
    const s = costStack('sneakers-slip-on-men', 200, 15, 'packPoint');
    expect([s.breakEven, s.listPrice]).toEqual([305, 336]);
    // shoe-box mailer ₹10 (team, 22 Oct 2026): if he picks self-ship, the self-ship stack: 270 → ₹284 / ₹315
    expect(finishMode('selfShip', { fulfilment: 'packPoint' }, 'sneakers-slip-on-men')).toBe('selfShip');
    const ss = costStack('sneakers-slip-on-men', 200, 15, 'selfShip');
    expect([ss.breakEven, ss.listPrice]).toEqual([284, 315]);
    expect(hasFeeCard('steel-casserole-1-5l')).toBe(true); // seeded for What to make instead (team)
  });
});

describe('FO-5 cost check: his making cost + what he wants to earn → his price', () => {
  const J = personas.jasmeet.product as { type: 'steel-bottle-1l'; makingCost: number; marginPct: number };
  const S = personas.samar.product as { type: 'sneakers-slip-on-men'; makingCost: number; marginPct: number };
  const bottle = (over: Partial<CostCheckInput>): CostCheckInput => ({ type: 'steel-bottle-1l', mode: 'selfShip', making: '', earning: '', unit: 'rupee', ...over });

  it('nothing until both inputs are filled (no pre-fill, no suggested value)', () => {
    expect(costCheckResult(bottle({}))).toBeNull();
    expect(costCheckResult(bottle({ making: '80' }))).toBeNull();
    expect(costCheckResult(bottle({ earning: '14' }))).toBeNull();
    expect(costCheckResult(bottle({ making: '0', earning: '14' }))).toBeNull();
  });

  it('Jasmeet: ₹80 + ₹14, self-ship → break-even ₹133, your price ₹147 · you earn ₹14', () => {
    const r = costCheckResult(bottle({ making: '80', earning: '14' }))!;
    expect([r.stack.breakEven, r.price, r.takeHome]).toEqual([133, 147, 14]);
    expect(r.stack.fees).toEqual({ packaging: 6, shippingAndFixed: 32, returnsBuffer: 8, gst: 7 });
  });

  it('Samar: ₹200 + ₹30, Pack Point → break-even ₹305, your price ₹336', () => {
    const r = costCheckResult({ type: 'sneakers-slip-on-men', mode: 'packPoint', making: '200', earning: '30', unit: 'rupee' })!;
    expect([r.stack.breakEven, r.price, r.takeHome, r.stack.fees.packPointFee]).toEqual([305, 336, 30, 30]);
  });

  it('“Fill demo values” = the seed’s making cost and the rupees its margin gives: ₹80 + ₹14, ₹200 + ₹30', () => {
    expect(demoCostValues(J)).toEqual({ making: '80', earning: '14', unit: 'rupee' });
    expect(demoCostValues(S)).toEqual({ making: '200', earning: '30', unit: 'rupee' });
  });

  it('₹/% switch: 17.5% of ₹80 is the same ₹14 and ₹147; switching keeps his earning', () => {
    const rupee = costCheckResult(bottle({ making: '80', earning: '14' }))!;
    const pct = costCheckResult(bottle({ making: '80', earning: '17.5', unit: 'pct' }))!;
    expect(pct).toEqual(rupee);
    expect(switchUnit('80', '14', 'pct')).toBe('17.5');
    expect(switchUnit('80', '17.5', 'rupee')).toBe('14');
    expect(switchUnit('200', '30', 'pct')).toBe('15');
    expect(switchUnit('', '14', 'pct')).toBe('14');
    expect(cleanPct('17.555%')).toBe('17.55');
  });

  it('the old “take-home at every price” slider and “a qualifying price exists” line are gone', () => {
    const src = readFileSync(fileURLToPath(new URL('./CostCheckInline.tsx', import.meta.url)), 'utf8');
    expect(src).not.toMatch(/type="range"|qualifyingPriceExists|takeHomeAt\(/);
    expect(JSON.stringify(FIN)).not.toMatch(/qualifying price/i);
  });
});

describe('FO-5 “Check price”: the bot’s rationed check, one counter per product shared with the bot', () => {
  beforeEach(() => usePriceChecks.getState().reset());
  const r = costCheckResult({ type: 'steel-bottle-1l', mode: 'selfShip', making: '80', earning: '14', unit: 'rupee' })!;
  const key = priceCheckKey('jasmeet', 'steel-bottle-1l');
  const view = (price: number, day = 1) =>
    launchCheckView({ type: 'steel-bottle-1l', price, stack: costCheckResult({ type: 'steel-bottle-1l', mode: 'selfShip', making: '80', earning: String(price === 147 ? 14 : 15), unit: 'rupee' })!.stack, entry: usePriceChecks.getState().entries[key], day, botOwned: false });

  it('his price shows no status until he checks it; then Qualifies (₹147), never a number to aim for', () => {
    expect(view(147)).toMatchObject({ state: 'stale', needsCheck: true, canCheck: true, checksLeft: MAX_PRICE_CHECKS });
    expect(usePriceChecks.getState().check(key, 1, r.price, r.stack.breakEven)).toBe(true);
    expect(view(147)).toMatchObject({ state: 'qualifies', checksLeft: MAX_PRICE_CHECKS - 1 });
  });

  it('3 checks a day per product, then refused; the bot’s Price screen uses the same record (same key)', () => {
    const c = usePriceChecks.getState().check;
    expect([c(key, 1, 147, 133), c(key, 1, 148, 133), c(key, 1, 147, 133)]).toEqual([true, true, true]);
    expect(c(key, 1, 148, 133)).toBe(false);
    // a price that changed after the last check: stale, and no check left today
    expect(view(148)).toMatchObject({ state: 'stale', canCheck: false, checksLeft: 0 });
    // the next demo day starts again
    expect(view(148, 2)).toMatchObject({ canCheck: true, checksLeft: MAX_PRICE_CHECKS });
  });
});
