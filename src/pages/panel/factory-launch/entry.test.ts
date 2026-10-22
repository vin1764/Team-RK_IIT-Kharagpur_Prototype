import { describe, expect, it } from 'vitest';
import personas from '../../../data/personas.json';
import calendar from '../../../data/calendar.json';
import { eligibility, slots, type MakerRecords } from '../../../engine/ui';
import { bannerModel, drawerModel, type BannerInput } from './entry';
import { LAUNCH, liveDatesShort, phaseForDay, shortDay, slotStatus } from './launch';

const rec = (p: keyof typeof personas): MakerRecords => {
  const r = personas[p] as unknown as { taxId: MakerRecords['taxId']; businessType: MakerRecords['businessType']; gstNatureOfBusiness: string[]; udyam: { majorActivity: 'Manufacturing' | 'Services' } | null };
  return { taxId: r.taxId, businessType: r.businessType, gstNatureOfBusiness: r.gstNatureOfBusiness, udyamMajorActivity: r.udyam?.majorActivity ?? null };
};
const J = eligibility(rec('jasmeet'));

/** Jasmeet's scripted story on `day` (no interactive state): told from D2, listed from D3, committed after D7. */
const jasmeet = (day: number, over: Partial<BannerInput> = {}): BannerInput => ({
  c2m: true,
  eligibility: J,
  told: day > calendar.jumps.onboarding,
  hasBook: true,
  phase: phaseForDay(day),
  listed: day >= calendar.jumps.listing,
  priceStatus: day >= calendar.jumps.listing ? 'qualifies' : null,
  committed: day > calendar.launch.commitmentsCloseDay,
  slotRemoved: false,
  ...over,
});

describe('LW-6 Home banner states (scripted story)', () => {
  // Five steps: manufacturer, records agree, price qualifies, product listed, stock committed.
  it('D1 before she tells us her product: category-level, 2 of 5, next “Tell us what you make”, not dismissible', () => {
    const m = bannerModel(jasmeet(1))!;
    expect(m.state).toBe('choose');
    expect(m.items.map((x) => x.key)).toEqual(['manufacturer', 'records', 'price', 'listed', 'stock']);
    expect([m.done, m.total, m.next?.key, m.next?.action, m.dismissible]).toEqual([2, 5, 'listed', 'tellUs', false]);
  });

  it('D1 after the finish screen / D2: 2 of 5, next List this product (Create from photos)', () => {
    for (const m of [bannerModel(jasmeet(1, { told: true }))!, bannerModel(jasmeet(2))!]) {
      expect(m.state).toBe('join');
      expect([m.done, m.total, m.next?.key, m.next?.action, m.dismissible]).toEqual([2, 5, 'listed', 'createFromPhotos', false]);
    }
  });

  it('D1 after a qualifying “Check price” in the cost check: the price row is done before listing, 3 of 5', () => {
    const m = bannerModel(jasmeet(1, { told: true, priceStatus: 'qualifies' }))!;
    expect([m.done, m.total, m.next?.action, m.priceNotEligible]).toEqual([3, 5, 'createFromPhotos', false]);
    // a check that doesn't qualify: the row stays open, with no button of its own (he lists, or checks a lower price)
    const n = bannerModel(jasmeet(1, { told: true, priceStatus: 'aboveCap' }))!;
    expect([n.done, n.items.find((x) => x.key === 'price')!.action, n.priceNotEligible]).toEqual([2, null, false]);
  });

  it('D3–D7 listed, not committed, window open: 4 of 5, next the order book', () => {
    for (const d of [3, 5, 7]) {
      const m = bannerModel(jasmeet(d))!;
      expect([m.state, m.done, m.total, m.next?.action, m.dismissible], `D${d}`).toEqual(['join', 4, 5, 'orderBook', false]);
    }
  });

  it('listed above the cap: price row → Price position, not eligible at this price', () => {
    const m = bannerModel(jasmeet(5, { priceStatus: 'aboveCap' }))!;
    expect([m.done, m.next?.key, m.next?.action, m.priceNotEligible]).toEqual([3, 'price', 'pricePosition', true]);
  });

  it('committed (interactive at D5, or scripted after D7): in, 5 of 5, dismissible', () => {
    expect(bannerModel(jasmeet(5, { committed: true }))).toMatchObject({ state: 'in', done: 5, total: 5, dismissible: true });
    expect(bannerModel(jasmeet(8))).toMatchObject({ state: 'in', done: 5, dismissible: true });
  });

  it('live D21–D25, ended after, slot removed on a breach', () => {
    expect(bannerModel(jasmeet(23))!.state).toBe('live');
    expect(bannerModel(jasmeet(30))!.state).toBe('ended');
    expect(bannerModel(jasmeet(40, { slotRemoved: true, priceStatus: 'aboveCap' }))!.state).toBe('slotRemoved');
  });

  it('window closed and never committed: slim closed note, dismissible', () => {
    expect(bannerModel(jasmeet(8, { committed: false }))).toMatchObject({ state: 'closed', dismissible: true, hasChecklist: false });
  });

  it('Samar (eligible, sneakers have no order book): slim note while open, nothing after', () => {
    const s = eligibility(rec('samar'));
    expect(bannerModel({ ...jasmeet(2), eligibility: s, hasBook: false, listed: false, priceStatus: null })).toMatchObject({ state: 'noBook', dismissible: true });
    expect(bannerModel({ ...jasmeet(23), eligibility: s, hasBook: false, listed: false, priceStatus: null, committed: false })).toBeNull();
  });

  it('reseller and plain mode: no banner', () => {
    expect(bannerModel({ ...jasmeet(3), eligibility: eligibility(rec('reseller')) })).toBeNull();
    expect(bannerModel({ ...jasmeet(3), c2m: false })).toBeNull();
  });
});

describe('LW-4 eligibility drawer: the same checklist as the banner', () => {
  const drawer = (day: number, over: Partial<BannerInput> = {}) => {
    const { c2m: _c, slotRemoved: _s, ...i } = jasmeet(day, over);
    return drawerModel(i);
  };

  it('Jasmeet D1: 2 of 5 (3 of 5 once her cost check’s price qualifies); D3: 4 of 5; D5: 4 of 5, 5 of 5 once committed', () => {
    expect([drawer(1).done, drawer(1).total, drawer(1).next?.action]).toEqual([2, 5, 'tellUs']);
    expect([drawer(1, { told: true, priceStatus: 'qualifies' }).done, drawer(1, { told: true }).next?.action]).toEqual([3, 'createFromPhotos']);
    expect([drawer(3).done, drawer(3).total, drawer(3).next?.action]).toEqual([4, 5, 'orderBook']);
    expect([drawer(5).done, drawer(5, { committed: true }).done, drawer(5, { committed: true }).next]).toEqual([4, 5, null]);
  });

  it('agrees with the Home banner’s count on every day of the window', () => {
    for (const d of [1, 2, 3, 5, 7]) expect(drawer(d).done, `D${d}`).toBe(bannerModel(jasmeet(d))!.done);
  });

  it('reseller: not eligible, both record checks failed (0 of 2), why from eligibility(), no next step', () => {
    const r = drawer(3, { eligibility: eligibility(rec('reseller')) });
    expect([r.eligible, r.status, r.done, r.total, r.next]).toEqual([false, 'notEligible', 0, 2, null]);
    expect(r.items.map((x) => x.key)).toEqual(['manufacturer', 'records']);
    expect(r.failedChecks).toEqual(['sellerType', 'gstNature', 'udyam']);
  });

  it('Samar (sneakers, no order book): eligible, nothing to commit to, so the stock row has no button', () => {
    const s = drawer(1, { eligibility: eligibility(rec('samar')), told: true, hasBook: false, priceStatus: 'qualifies' });
    expect([s.eligible, s.done, s.total]).toEqual([true, 3, 5]);
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
