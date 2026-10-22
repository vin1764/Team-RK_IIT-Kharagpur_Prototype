import { describe, expect, it } from 'vitest';
import calendar from '../../../data/calendar.json';
import { slots } from '../../../engine/ui';
import { bannerModel, drawerModel, type BannerInput } from './entry';
import { LAUNCH, liveDatesShort, phaseForDay, shortDay, slotStatus } from './launch';
import { inLaunchCategory } from './useLaunchEntry';

/** Jasmeet's scripted story on `day` (no interactive state): told from D2, listed from D3, committed after D7. */
const jasmeet = (day: number, over: Partial<BannerInput> = {}): BannerInput => ({
  c2m: true,
  inLaunch: true,
  told: day > calendar.jumps.onboarding,
  hasBook: true,
  phase: phaseForDay(day),
  listed: day >= calendar.jumps.listing,
  priceStatus: day >= calendar.jumps.listing ? 'qualifies' : null,
  committed: day > calendar.launch.commitmentsCloseDay,
  slotRemoved: false,
  ...over,
});

/**
 * The reseller (team, 22 Oct 2026): sells the same 1 L bottle (seeded, told from D2), never gets scripted data
 * (no listing, no commit); his "Check price" at ₹195 says not eligible.
 */
const reseller = (day: number, over: Partial<BannerInput> = {}): BannerInput =>
  jasmeet(day, { listed: false, priceStatus: day > calendar.jumps.onboarding ? 'aboveCap' : null, committed: false, ...over });

describe('LW-6 Home banner states (scripted story)', () => {
  // Three steps for every seller: price qualifies, product listed, stock committed. No seller-type / GST / Udyam row.
  it('D1 before she tells us her product: category-level, 0 of 3, next “Tell us what you sell”, not dismissible', () => {
    const m = bannerModel(jasmeet(1))!;
    expect(m.state).toBe('choose');
    expect(m.items.map((x) => x.key)).toEqual(['price', 'listed', 'stock']);
    expect([m.done, m.total, m.next?.key, m.next?.action, m.dismissible]).toEqual([0, 3, 'listed', 'tellUs', false]);
  });

  it('D1 after the finish screen / D2: 0 of 3, next List this product (Create from photos)', () => {
    for (const m of [bannerModel(jasmeet(1, { told: true }))!, bannerModel(jasmeet(2))!]) {
      expect(m.state).toBe('join');
      expect([m.done, m.total, m.next?.key, m.next?.action, m.dismissible]).toEqual([0, 3, 'listed', 'createFromPhotos', false]);
    }
  });

  it('D1 after a qualifying “Check price” in the cost check: the price row is done before listing, 1 of 3', () => {
    const m = bannerModel(jasmeet(1, { told: true, priceStatus: 'qualifies' }))!;
    expect([m.done, m.total, m.next?.action, m.priceNotEligible]).toEqual([1, 3, 'createFromPhotos', false]);
    // a check that doesn't qualify: the row stays open, with no button of its own (he lists, or checks a lower price)
    const n = bannerModel(jasmeet(1, { told: true, priceStatus: 'aboveCap' }))!;
    expect([n.done, n.items.find((x) => x.key === 'price')!.action, n.priceNotEligible]).toEqual([0, null, false]);
  });

  it('D3–D7 listed, not committed, window open: 2 of 3, next the order book', () => {
    for (const d of [3, 5, 7]) {
      const m = bannerModel(jasmeet(d))!;
      expect([m.state, m.done, m.total, m.next?.action, m.dismissible], `D${d}`).toEqual(['join', 2, 3, 'orderBook', false]);
    }
  });

  it('listed above the cap: price row → Price position, not eligible at this price', () => {
    const m = bannerModel(jasmeet(5, { priceStatus: 'aboveCap' }))!;
    expect([m.done, m.next?.key, m.next?.action, m.priceNotEligible]).toEqual([1, 'price', 'pricePosition', true]);
  });

  it('committed (interactive at D5, or scripted after D7): in, 3 of 3, dismissible', () => {
    expect(bannerModel(jasmeet(5, { committed: true }))).toMatchObject({ state: 'in', done: 3, total: 3, dismissible: true });
    expect(bannerModel(jasmeet(8))).toMatchObject({ state: 'in', done: 3, dismissible: true });
  });

  it('live D21–D25, ended after, slot removed on a breach', () => {
    expect(bannerModel(jasmeet(23))!.state).toBe('live');
    expect(bannerModel(jasmeet(30))!.state).toBe('ended');
    expect(bannerModel(jasmeet(40, { slotRemoved: true, priceStatus: 'aboveCap' }))!.state).toBe('slotRemoved');
  });

  it('window closed and never committed: slim closed note, dismissible', () => {
    expect(bannerModel(jasmeet(8, { committed: false }))).toMatchObject({ state: 'closed', dismissible: true, hasChecklist: false });
  });

  it('a told product in the category with no order book: slim note while open, nothing after', () => {
    expect(bannerModel(jasmeet(2, { hasBook: false, listed: false, priceStatus: null }))).toMatchObject({ state: 'noBook', dismissible: true });
    expect(bannerModel(jasmeet(23, { hasBook: false, listed: false, priceStatus: null, committed: false }))).toBeNull();
  });

  it('the reseller sees the banner (no seller-type gate): D1 choose, D3 join 0 of 3 after his ₹195 check', () => {
    expect(bannerModel(reseller(1))).toMatchObject({ state: 'choose', done: 0, total: 3 });
    expect(bannerModel(reseller(3))).toMatchObject({ state: 'join', done: 0, total: 3, priceNotEligible: false });
  });

  it('outside the launch category, or plain mode: no banner', () => {
    expect(bannerModel(jasmeet(3, { inLaunch: false }))).toBeNull();
    expect(bannerModel(jasmeet(3, { c2m: false }))).toBeNull();
  });
});

describe('who sees Factory Launch: every seller whose product is in the launch’s category', () => {
  const none = { told: false, type: null, choice: null };
  it('before telling us: the category we know him by (Jasmeet and the reseller: bottle; Samar: sneakers → no)', () => {
    expect(inLaunchCategory(false, none, 'steel-bottle-1l')).toBe(true);
    expect(inLaunchCategory(false, none, 'sneakers-slip-on-men')).toBe(false);
    expect(inLaunchCategory(false, none, null)).toBe(false);
  });
  it('after telling us: his product type, or the category he picked; a live launch listing always counts', () => {
    expect(inLaunchCategory(false, { told: true, type: 'steel-bottle-1l', choice: null }, null)).toBe(true);
    expect(inLaunchCategory(false, { told: true, type: 'sneakers-slip-on-men', choice: null }, 'steel-bottle-1l')).toBe(false);
    const lunchBoxes = { categoryPath: ['Home & Kitchen', 'Kitchen & Dining', 'Kitchen Storage', 'Lunch Boxes'], type: null, via: 'category' as const };
    expect(inLaunchCategory(false, { told: true, type: null, choice: lunchBoxes }, null)).toBe(true);
    expect(inLaunchCategory(true, none, null)).toBe(true);
  });
});

describe('LW-4 eligibility drawer: the same three steps as the banner, for every seller', () => {
  const drawer = (i: BannerInput) => drawerModel(i);

  it('Jasmeet D1: 0 of 3 (1 of 3 once her cost check’s price qualifies); D3: 2 of 3; D5: 2 of 3, 3 of 3 once committed', () => {
    expect([drawer(jasmeet(1)).done, drawer(jasmeet(1)).total, drawer(jasmeet(1)).next?.action]).toEqual([0, 3, 'tellUs']);
    expect([drawer(jasmeet(1, { told: true, priceStatus: 'qualifies' })).done, drawer(jasmeet(1, { told: true })).next?.action]).toEqual([1, 'createFromPhotos']);
    expect([drawer(jasmeet(3)).done, drawer(jasmeet(3)).total, drawer(jasmeet(3)).next?.action]).toEqual([2, 3, 'orderBook']);
    expect([drawer(jasmeet(5)).done, drawer(jasmeet(5, { committed: true })).done, drawer(jasmeet(5, { committed: true })).next]).toEqual([2, 3, null]);
  });

  it('agrees with the Home banner’s count on every day of the window', () => {
    for (const d of [1, 2, 3, 5, 7]) expect(drawer(jasmeet(d)).done, `D${d}`).toBe(bannerModel(jasmeet(d))!.done);
  });

  it('reseller: the same three rows; his ₹195 check doesn’t qualify, so 0 of 3 with List this product next', () => {
    const r = drawer(reseller(3));
    expect(r.items.map((x) => x.key)).toEqual(['price', 'listed', 'stock']);
    expect([r.done, r.total, r.items[0]!.done, r.next?.action]).toEqual([0, 3, false, 'createFromPhotos']);
  });

  it('Samar (sneakers, no order book): nothing to commit to, so the stock row has no button', () => {
    const s = drawer(jasmeet(1, { told: true, hasBook: false, priceStatus: 'qualifies' }));
    expect([s.done, s.total]).toEqual([1, 3]);
    expect(s.items.find((x) => x.key === 'stock')!.action).toBeNull();
  });
});

describe('LW-6 banner numbers', () => {
  it('1 slot left before Jasmeet commits (5 − 4), dates 14–18 Nov, close 31 Oct, stock 11 Nov', () => {
    expect(slotStatus(LAUNCH.slotsTakenBefore, slots('steel-bottle-1l')).left).toBe(1);
    expect(liveDatesShort()).toBe('14–18 Nov');
    expect([shortDay(LAUNCH.commitmentsCloseDay), shortDay(LAUNCH.stockAtNodeDay), shortDay(LAUNCH.liveFromDay)]).toEqual(['31 Oct', '11 Nov', '14 Nov']);
  });
});
