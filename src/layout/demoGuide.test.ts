import { describe, expect, it } from 'vitest';
import { onboarding, paths } from '../app/paths';
import calendar from '../data/calendar.json';
import launch from '../data/launch.json';
import lotSeed from '../data/packPointLot.json';
import { costStack } from '../engine/costStack';
import { launchProgress, trailingRunRate } from '../engine/launch';
import { lotInbound } from '../engine/lot';
import { likelyOrdersPerDay, suggestedLot } from '../engine/demand';
import { restock } from '../engine/restock';
import { checkListingPrice, listingPricePosition } from '../engine/ui';
import { BOT_FILLED_COUNT, MAKER_COUNT } from '../pages/panel/catalog/bot';
import { DEMO_GUIDE, guideNumbers, jumpHref } from './demoGuide';

// Plan §10 (updated): every number the presenter's guide quotes, recomputed from the engine and the
// seed independently of demoGuide.ts, and then checked against the literal values of the script.
const n = guideNumbers();
const text = (i: number) => DEMO_GUIDE[i - 1]!.body;

describe('demo guide numbers — recomputed from engine/seed', () => {
  const stack = costStack('steel-bottle-1l', 80, 17.5, 'selfShip');

  it('₹147 list, ₹14 take-home, qualifies (step 1, 3)', () => {
    expect([stack.listPrice, stack.takeHome, stack.breakEven]).toEqual([147, 14, 133]);
    expect([n.listPrice, n.takeHome]).toEqual([147, 14]);
    expect(checkListingPrice('steel-bottle-1l', 147, 133)).toBe('qualifies');
    expect(n.listQualifies).toBe(true);
    expect(text(1)).toContain('₹80 cost and ₹14 to earn → “Your price: ₹147 · you earn ₹14” → Check price: qualifies');
    // Teaser after onboarding, for the type she picks (plan §10 step 1, updated)
    expect(text(1)).toContain('picks the 1 L steel water bottle → teaser “about 300 orders a week at ₹150–170”');
    expect(text(1)).toContain('Home & Kitchen invitation');
    expect(DEMO_GUIDE[0]!.also.map((a) => a.path)).toEqual([onboarding.signup, `${onboarding.done}?state=picked`]);
    expect(text(3)).toContain('List at ₹147 · take home ₹14, Qualifies');
  });

  it('Jasmeet Factory verified; the reseller’s ₹120 + ₹20 → ₹195 doesn’t qualify (step 2)', () => {
    expect(n.jasmeetEligible).toBe('eligible');
    const r = costStack('steel-bottle-1l', 120, 16.7, 'selfShip');
    expect([r.takeHome, r.breakEven, r.listPrice]).toEqual([20, 175, 195]);
    expect(checkListingPrice('steel-bottle-1l', 195, 175)).toBe('aboveCap');
    expect([n.resellerPrice, n.resellerQualifies]).toEqual([195, false]);
    expect(text(2)).toContain('Factory verified ✓');
    expect(text(2)).toContain('As Reseller: cost check ₹120 + ₹20 to earn → “Your price: ₹195” → Check price: not eligible at this price');
  });

  it('Meesho fills 21, she adds 14 (step 3)', () => {
    expect([BOT_FILLED_COUNT, MAKER_COUNT]).toEqual([21, 14]);
    expect(text(3)).toContain('Meesho fills 21, she adds 14');
  });

  it('commits 150 units = the suggested lot (step 4)', () => {
    expect(launch.commit.jasmeet.units).toBe(150);
    expect(suggestedLot('steel-bottle-1l', 80).units).toBe(150);
    expect(text(4)).toContain('commits 150 units');
  });

  it('D23: 11 today, expected 9–13, 33 of 150 sold, Building (step 5)', () => {
    const p = launchProgress(launch.dailyOrders, 150, calendar.jumps.liveLaunch);
    expect([p.today, p.soldToDate]).toEqual([11, 33]);
    expect(likelyOrdersPerDay('steel-bottle-1l')).toEqual({ low: 9, high: 13 });
    expect(text(5)).toBe('Live launch: 11 orders today, expected 9–13, 33 of 150 sold; listing score Building.');
  });

  it('D28: start 230 by 21 Nov (step 6)', () => {
    const run = trailingRunRate(launch.dailyOrders, 28);
    const onHand = launchProgress(launch.dailyOrders, 150, 27).left;
    const r = restock({ runRate: run, onHand, leadTimeDays: 5, safetyDays: 2, makingCost: 80, minRun: 100, today: '2026-11-21' });
    expect([run, onHand, r.nextBatch, r.startBy]).toEqual([11, 73, 230, '2026-11-21']);
    expect([n.restockBatch, n.restockStartBy]).toEqual([230, '21 Nov']);
    expect(n.coachSku).toBe('lunchbox');
    expect(n.coachFix).toBe('changeMainPhoto');
    expect(n.switchFor).toEqual(['sipper']);
    expect(text(6)).toContain('“Start 230 by 21 Nov”');
  });

  it('D40: ₹165 doesn’t qualify, position Mid (step 7)', () => {
    expect(launch.priceEdit.price).toBe(165);
    expect(checkListingPrice('steel-bottle-1l', 165, 133)).toBe('aboveCap');
    expect(listingPricePosition('steel-bottle-1l', 165)).toBe('mid');
    expect(text(7)).toContain('price raised to ₹165 → “Doesn’t qualify · slot removed”, position Mid');
  });

  it('D50: Samar (Agra), 90 pairs in (step 8)', () => {
    expect(suggestedLot('sneakers-slip-on-men', 200).units).toBe(90);
    expect(lotInbound(lotSeed).received).toBe(90);
    expect(text(8)).toContain('Samar (Agra)');
    expect(text(8)).toContain('first lot of 90 pairs in');
  });

  it('the guide never quotes a hidden benchmark (plan §8b: ₹160 bottle, ₹370 sneakers)', () => {
    const all = DEMO_GUIDE.map((s) => `${s.title} ${s.body}`).join(' ');
    expect(all).not.toMatch(/₹160\b|₹370\b/);
  });
});

describe('demo guide jumps', () => {
  it('8 steps on the plan §6 jump days', () => {
    const J = calendar.jumps;
    expect(DEMO_GUIDE.map((s) => s.day)).toEqual([J.onboarding, J.onboarding, J.listing, J.commit, J.liveLaunch, J.restock, J.priceEdit, J.packPointLot]);
    expect(DEMO_GUIDE.map((s) => s.day)).toEqual([1, 1, 3, 5, 23, 28, 40, 50]);
  });

  it('each step opens the right page as the right persona, in EN', () => {
    const want = [
      [onboarding.outreach, 'jasmeet'],
      [onboarding.businessDetails, 'jasmeet'],
      [paths.home, 'jasmeet'],
      [paths.factoryLaunch, 'jasmeet'],
      [paths.factoryLaunchLive, 'jasmeet'],
      [paths.inventory, 'jasmeet'],
      [paths.pricePosition, 'jasmeet'],
      [paths.warehouse, 'samar'],
    ];
    expect(DEMO_GUIDE.map((s) => [s.jump.path, s.jump.persona])).toEqual(want);
    for (const s of DEMO_GUIDE) {
      const href = jumpHref(s.jump);
      const q = new URLSearchParams(href.split('?')[1]);
      expect(q.get('persona')).toBe(s.persona);
      expect(q.get('day')).toBe(String(s.day));
      expect(q.get('lang')).toBe('en');
    }
  });

  it('keeps the route’s own query (Factory Launch tab)', () => {
    expect(jumpHref(DEMO_GUIDE[3]!.jump)).toMatch(/\?tab=FACTORY_LAUNCH&persona=jasmeet&day=5&lang=en$/);
  });

  it('step 6 links the Business Dashboard; step 2 offers the Reseller’s cost check (checked)', () => {
    expect(DEMO_GUIDE[5]!.also.map((a) => a.path)).toContain(paths.businessDashboard);
    expect(DEMO_GUIDE[1]!.also[0]).toMatchObject({ persona: 'reseller', path: `${onboarding.done}?state=checked` });
  });
});
