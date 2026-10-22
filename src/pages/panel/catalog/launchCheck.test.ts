// The price never blocks listing; the price check only decides Factory Launch eligibility (team spec), and is rationed
// (MAX_PRICE_CHECKS a day per product) so the hidden price cap can't be probed. Jasmeet's 1 L bottle, self-ship:
// break-even ₹133, the bot's list price ₹147 (plan §8b).
import { describe, expect, it } from 'vitest';
import { costStack, takeHomeAt } from '../../../engine/ui';
import { translate } from '../../../i18n';
import { PRICE_CHECK_STORAGE_KEY, priceCheckKey, resetPriceChecks, usePriceChecks } from '../../../store/priceChecks';
import { launchListing } from '../../../store/timeline';
import { FL } from '../factory-launch/copy';
import { bannerModel } from '../factory-launch/entry';
import { priceHoldView } from '../manage-pricing/priceHold';
import { goLiveChecks } from './bot';
import { applyCheck, checksLeft, launchCheckView, lossPerOrder, MAX_PRICE_CHECKS, type PriceCheckEntry } from './launchCheck';

const BOTTLE = 'steel-bottle-1l' as const;
const stack = costStack(BOTTLE, 80, 17.5, 'selfShip');
const D = 3;
/** The view for a price, after the maker checked `checked` (or nothing) today. */
const view = (price: number | null, entry?: PriceCheckEntry, s = stack, botOwned = false) => launchCheckView({ type: BOTTLE, price, stack: s, entry, day: D, botOwned });
const checkedAt = (price: number, used = 1): PriceCheckEntry => ({ day: D, used, last: { price, breakEven: stack.breakEven } });

const goLive = (price: number | null) =>
  goLiveChecks({
    hasFrontImage: true,
    reviewed: true,
    missingFields: [],
    missingPrices: [],
    netQtyConfirmed: true,
    inputs: { makingCost: '80', marginPct: '17.5', minRun: '100', leadTimeDays: '5' },
    price,
    inventory: 150,
  });

describe('the numbers this rests on', () => {
  it('break-even ₹133, the bot’s list price ₹147', () => {
    expect([stack.breakEven, stack.listPrice]).toEqual([133, 147]);
  });
});

describe('the price never blocks Go live', () => {
  it('a listing at ₹165 goes live (Price set ✓), and so do ₹147 and ₹120', () => {
    for (const p of [165, 147, 120]) expect(goLive(p), `₹${p}`).toMatchObject({ price: true, all: true });
  });
  it('only a missing price holds it back', () => expect(goLive(null).all).toBe(false));
});

describe('Factory Launch status (rationed "Check price")', () => {
  it('₹147, the bot’s own price: Qualifies with no check used', () => {
    const v = view(147, undefined, stack, true);
    expect(v).toMatchObject({ state: 'qualifies', botPrice: true, needsCheck: false, line: 'qualifies', checksLeft: MAX_PRICE_CHECKS });
  });

  it('₹147 typed by the maker (same as the bot’s): he checks it like any typed price', () => {
    expect(view(147)).toMatchObject({ state: 'stale', botPrice: false, needsCheck: true });
  });

  it('₹165 typed: status out of date until checked ("Price changed · Check price…"), the checklist line says check', () => {
    expect(view(165)).toMatchObject({ state: 'stale', needsCheck: true, canCheck: true, line: 'unchecked' });
  });

  it('₹165 checked: not eligible (lists normally); 2 checks left', () => {
    expect(view(165, checkedAt(165))).toMatchObject({ state: 'aboveCap', checked: true, needsCheck: false, line: 'notEligible', checksLeft: 2 });
  });

  it('₹147 typed and checked: qualifies; 1 check left', () => {
    expect(view(147, checkedAt(147, 2))).toMatchObject({ state: 'qualifies', line: 'qualifies', checksLeft: 1 });
  });

  it('a price on screen different from the last checked one is out of date, not a stale answer', () => {
    expect(view(150, checkedAt(165))).toMatchObject({ state: 'stale', line: 'unchecked' });
  });

  it('a changed break-even (making cost or fulfilment) also needs a new check', () => {
    const pp = costStack(BOTTLE, 80, 17.5, 'packPoint');
    expect(view(165, checkedAt(165), pp).state).toBe('stale');
  });

  it('the bot’s price after the fulfilment switch is the bot’s price too: Pack Point ₹172 shows Not eligible, free', () => {
    const pp = costStack(BOTTLE, 80, 17.5, 'packPoint');
    expect(view(pp.listPrice, undefined, pp, true)).toMatchObject({ state: 'aboveCap', botPrice: true, needsCheck: false });
  });

  it('the 4th "Check price" in a demo day is refused; the next demo day has 3 again', () => {
    let e: PriceCheckEntry | undefined;
    for (const p of [165, 147, 150]) {
      const next = applyCheck(e, D, p, stack.breakEven);
      expect(next, `₹${p}`).not.toBeNull();
      e = next!;
    }
    expect(checksLeft(e, D)).toBe(0);
    expect(applyCheck(e, D, 155, stack.breakEven)).toBeNull();
    // no check left: button disabled, the status stays out of date
    expect(view(155, e)).toMatchObject({ state: 'stale', needsCheck: true, canCheck: false, checksLeft: 0 });
    // the last checked price still shows its answer
    expect(view(150, e).state).toBe('qualifies');
    expect(checksLeft(e, D + 1)).toBe(MAX_PRICE_CHECKS);
    expect(applyCheck(e, D + 1, 155, stack.breakEven)).toMatchObject({ day: D + 1, used: 1 });
  });
});

describe('below break-even: a warning, not a block', () => {
  it('₹120: "You’d lose ₹12 per order" (engine take-home −₹11.71, rounded up to the rupee); never eligible; still goes live', () => {
    expect(takeHomeAt(120, stack)).toBeCloseTo(-11.71, 2);
    const v = view(120);
    expect(v).toMatchObject({ state: 'belowCost', loss: 12, needsCheck: false, line: 'notEligible' });
    expect(translate('en', 'launch.loss', { loss: v.loss! })).toBe("You'd lose ₹12 per order at this price");
    expect(goLive(120).all).toBe(true);
  });
  it('the loss rounds up, so a few paise below break-even is still ₹1', () => {
    expect(takeHomeAt(132, stack)).toBeCloseTo(-0.29, 2);
    expect(lossPerOrder(132, stack)).toBe(1);
    expect(lossPerOrder(133, stack)).toBeNull();
  });
});

describe('after going live above the cap', () => {
  const listing = { id: '900000001', persona: 'jasmeet' as const, typeId: BOTTLE, name: 'Steel bottle', price: 165, breakEven: 133, takeHome: 31, inventory: 150, minRun: 100, leadTimeDays: 5, makingCost: 80, marginPct: 17.5, fulfilment: 'selfShip' as const, createdDay: 3, status: 'live' as const };

  it('the listing is the launch listing (it sells as normal); its status is computed from its own price', () => {
    const l = launchListing([listing], 'jasmeet', 3)!;
    expect([l.price, l.scripted]).toEqual([165, false]);
    const hold = priceHoldView(l, false, null);
    expect([hold.status, hold.slotRemoved]).toEqual(['aboveCap', false]);
  });

  it('Home banner: join, "Not eligible at this price · lower your price to join", the price item open → Price position', () => {
    const m = bannerModel({
      c2m: true,
      inLaunch: true,
      told: true,
      hasBook: true,
      phase: 'open',
      listed: true,
      priceStatus: 'aboveCap',
      committed: false,
      slotRemoved: false,
    })!;
    expect(m).toMatchObject({ state: 'join', priceNotEligible: true });
    expect(m.items.find((i) => i.key === 'price')).toMatchObject({ done: false, action: 'pricePosition' });
    expect(FL.banner.notEligiblePrice).toBe('Not eligible at this price · lower your price to join');
  });
});

describe('B (₹160) never reaches the maker', () => {
  const B = 160;
  const KEYS = ['launch.qualifies', 'launch.aboveCap', 'launch.loss', 'launch.lossSub', 'launch.stale', 'launch.check', 'launch.left', 'launch.leftOne', 'launch.none', 'launch.chipPending', 'check.priceSet', 'check.launch.qualifies', 'check.launch.notEligible', 'check.launch.unchecked', 'price.result', 'price.resultLoss', 'status.qualifies', 'status.aboveCap', 'status.belowCost'];

  it('no copy names the cap or a gap to it', () => {
    const copy = [...KEYS.filter((k) => k !== 'launch.leftOne').flatMap((k) => [translate('en', k), translate('hi', k)]), FL.banner.notEligiblePrice, FL.banner.item.priceFails, FL.notEligiblePrice, FL.notEligiblePriceBanner];
    for (const s of copy) expect(s, s).not.toMatch(/\d/); // numbers come only from {placeholders}
  });

  it('for every price ₹100–₹250 the model and its rendered status text carry no B and no gap to B', () => {
    for (let p = 100; p <= 250; p++) {
      for (const entry of [undefined, checkedAt(p)]) {
        const v = view(p, entry);
        const texts = [JSON.stringify(v)];
        if (v.state === 'belowCost') texts.push(translate('en', 'launch.loss', { loss: v.loss! }), translate('en', 'launch.lossSub', { be: stack.breakEven }));
        else if (v.state !== 'none') texts.push(translate('en', `launch.${v.state}`));
        if (v.line) texts.push(translate('en', `check.launch.${v.line}`));
        const gap = Math.abs(B - p);
        for (const t of texts) {
          expect(t, `₹${p}`).not.toContain(String(B));
          if (v.state !== 'belowCost') expect(t, `₹${p}`).not.toMatch(new RegExp(`₹\\s?${gap}(?!\\d)`));
        }
      }
    }
  });
});

describe('the check store (rk-price-checks-v1)', () => {
  it('per persona + product type; the 4th check of the day returns false; Reset demo clears it', () => {
    const key = priceCheckKey('jasmeet', BOTTLE);
    expect(key).toBe('jasmeet:steel-bottle-1l');
    expect(PRICE_CHECK_STORAGE_KEY).toBe('rk-price-checks-v1');
    resetPriceChecks();
    const s = usePriceChecks.getState();
    expect([165, 147, 150, 155].map((p) => s.check(key, D, p, 133))).toEqual([true, true, true, false]);
    expect(usePriceChecks.getState().entries[key]).toMatchObject({ day: D, used: 3, last: { price: 150 } });
    expect(usePriceChecks.getState().entries[priceCheckKey('samar', BOTTLE)]).toBeUndefined();
    resetPriceChecks();
    expect(usePriceChecks.getState().entries).toEqual({});
  });
});
