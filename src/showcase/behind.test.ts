import { describe, expect, it } from 'vitest';
import calendar from '../data/calendar.json';
import { BEHIND } from './behind';
import { REGISTRY } from './registry';
import type { BehindCtx } from './types';

const at = (persona: BehindCtx['persona'], day: number) => ({ persona, day, lang: 'en', route: '' }) as BehindCtx;
const text = (key: string, persona: BehindCtx['persona'], day: number) => BEHIND[key]!(at(persona, day)).join('\n');
const J = calendar.jumps;

describe('Behind it: keys and shape', () => {
  it('every behind key in the registry exists in BEHIND', () => {
    const keys = REGISTRY.elements.flatMap((e) => (e.behind ? [e.behind] : []));
    expect(keys.filter((k) => !(k in BEHIND))).toEqual([]);
  });

  it('every BEHIND entry is used by some element', () => {
    const used = new Set(REGISTRY.elements.map((e) => e.behind));
    expect(Object.keys(BEHIND).filter((k) => !used.has(k))).toEqual([]);
  });

  it('returns 1–4 non-empty lines for every persona on every key day, without throwing', () => {
    const days = [0, ...Object.values(J), 21, 25, 30, 39, calendar.maxDay];
    for (const persona of ['jasmeet', 'samar', 'reseller'] as const)
      for (const day of days)
        for (const [key, fn] of Object.entries(BEHIND)) {
          const lines = fn(at(persona, day));
          expect(lines.length, `${key} ${persona} D${day}`).toBeGreaterThanOrEqual(1);
          expect(lines.length, `${key} ${persona} D${day}`).toBeLessThanOrEqual(4);
          for (const l of lines) expect(l.trim(), `${key} ${persona} D${day}`).not.toBe('');
        }
  });
});

describe('Behind it: hero numbers (plan §8b)', () => {
  it('Jasmeet’s cost stack: 126 → ₹133 break-even, ₹14 take-home, ₹147 list, GST ₹7', () => {
    const t = text('price', 'jasmeet', J.listing);
    expect(t).toContain('80 making + 6 packaging + 32 shipping & fixed fee + 8 returns buffer = 126');
    expect(t).toContain('126 × 1.05 GST = 132.3 → ₹133');
    expect(t).toContain('17.5% × ₹80 = ₹14');
    expect(t).toContain('(126 + 14) × 1.05 = ₹147');
    expect(t).toContain('GST inside ₹7');
    expect(t).toContain('Qualifies');
  });

  it('Samar’s cost stack: 290 → ₹305, (290 + 30) × 1.05 = ₹336', () => {
    const t = text('price', 'samar', J.packPointLot);
    expect(t).toContain('200 making + 30 Pack Point fee + 40 shipping & fixed fee + 20 returns buffer = 290');
    expect(t).toContain('304.5 → ₹305');
    expect(t).toContain('(290 + 30) × 1.05 = ₹336');
  });

  it('cost check: his own numbers → his price, Qualifies only after Check price; no “qualifying price exists”, cap explained not shown', () => {
    const t = text('costCheck', 'jasmeet', J.onboarding);
    expect(t).toContain('cost ₹80 per unit, wants to earn ₹14 (the same as 17.5%');
    expect(t).toContain('→ ₹133');
    expect(t).toContain('Your price: (126 + 14) × 1.05 = 147 → ₹147');
    expect(t).toContain('→ Qualifies');
    expect(t).toContain('25th-percentile price buyers paid for like-for-like listings');
    expect(t).toContain('skip the middleman’s margin');
    expect(t).not.toMatch(/qualifying price exists/);
    const s = text('costCheck', 'samar', J.onboarding);
    expect(s).toContain('Pack Point');
    expect(s).toContain('(290 + 30) × 1.05 = 336 → ₹336');
    // the reseller: ₹120 + ₹20 → ₹195, not eligible; resellers can join but their margin prices them out
    const r = text('costCheck', 'reseller', J.onboarding);
    expect(r).toContain('(166 + 20) × 1.05 = 195.3 → ₹195');
    expect(r).toContain('Not eligible at this price · a lower price may qualify');
    expect(r).toContain('their margin prices them out');
  });

  it('demand, share, slots and lot: 9–13 a day, 5 slots, 150 (₹12,000)', () => {
    const t = text('demandLot', 'jasmeet', J.listing);
    expect(t).toContain('300–450 a week × 20%');
    expect(t).toContain('60–90 a week');
    expect(t).toContain('9–13 a day');
    expect(t).toContain('= 5');
    expect(t).toContain('10.7 a day × 14 days = 150 → 150 (₹12,000 at cost)');
  });

  it('order book: 600 committed = 4 slots taken → 1 left', () => {
    expect(text('orderBook', 'jasmeet', J.commit)).toContain('600 units already committed ÷ 150 a lot = 4 slots taken → 1 left');
  });

  it('LW-6 banner: 5 − 4 = 1 slot left, the launch dates, 0 → 2 → 3 of 3 from the scripted story', () => {
    const d1 = text('launchBanner', 'jasmeet', J.onboarding);
    expect(d1).toContain('5 − 4 taken = 1 left for 1 L steel water bottle');
    expect(d1).toContain('D7 (31 Oct)');
    expect(d1).toContain('D18 (11 Nov)');
    expect(d1).toContain('D21–D25 (14–18 Nov)');
    expect(d1).toContain('= 0 of 3');
    expect(text('launchBanner', 'jasmeet', 2)).toContain('= 0 of 3');
    expect(text('launchBanner', 'jasmeet', J.listing)).toContain('= 2 of 3');
    expect(text('launchBanner', 'jasmeet', J.restock)).toContain('= 3 of 3');
    expect(text('launchBanner', 'jasmeet', J.liveLaunch)).toContain('11 orders today');
    // the reseller sells the bottle too: he sees the banner; his ₹195 check doesn't qualify
    expect(text('launchBanner', 'reseller', J.listing)).toContain('not eligible');
    expect(text('launchBanner', 'reseller', J.listing)).toContain('= 0 of 3');
    expect(text('launchBanner', 'samar', J.onboarding)).toMatch(/no banner/);
  });

  it('live launch at D23: 11 today, 33 of 150 sold, 117 left; not live before D21', () => {
    const t = text('launchLive', 'jasmeet', J.liveLaunch);
    expect(t).toContain('11 orders today vs 9–13 expected');
    expect(t).toContain('12 + 10 + 11 = 33 of 150 → 117 left');
    expect(text('launchLive', 'jasmeet', J.commit)).toMatch(/^Not live yet/);
  });

  it('restock at D28: 11 a day, 6.6 days, reorder 77, batch 230 (₹18,400), 21 Nov → 26 Nov', () => {
    const t = text('restock', 'jasmeet', J.restock);
    expect(t).toContain('77 ÷ 7 = 11 a day');
    expect(t).toContain('73 ÷ 11 = 6.6 days < 5 lead + 2 safety → Make more');
    expect(t).toContain('11 × (5 + 2) = 77');
    expect(t).toContain('231 → 230 (₹18,400 at cost)');
    expect(t).toContain('Start 21 Nov, lands 26 Nov');
    expect(text('restock', 'jasmeet', J.liveLaunch)).toMatch(/^Starts on D28/);
  });

  it('coach: 1.6% vs 4.2%, 7.9% conversion, with no trigger value', () => {
    const t = text('coach', 'jasmeet', J.restock);
    expect(t).toContain('38 clicks ÷ 2,400 views = 1.6% click-through vs 4.2% for similar listings');
    expect(t).toContain('7.9%');
  });

  it('dashboard: 4.0%, 10.0%, ₹11,319', () => {
    const t = text('dashboard', 'jasmeet', J.restock);
    expect(t).toContain('770 ÷ 19,250 = 4.0%');
    expect(t).toContain('77 ÷ 770 = 10.0%');
    expect(t).toContain('77 × ₹147 = ₹11,319');
  });

  it('verdicts and switch: Make more / Fix / Stop, casserole and flask', () => {
    const v = text('verdicts', 'jasmeet', J.restock);
    expect(v).toContain('Make more');
    expect(v).toContain('Fix');
    expect(v).toContain('Stop');
    expect(text('switchTo', 'jasmeet', J.restock)).toMatch(/casserole[\s\S]*flask/);
  });

  it('silent checks: Jasmeet Factory verified (sees the badge); reseller not verified, sees nothing; neither is a launch gate', () => {
    const j = text('eligibility', 'jasmeet', J.onboarding);
    expect(j).toContain('→ Factory verified');
    expect(j).toContain('the maker sees “Factory verified ✓”');
    const r = text('eligibility', 'reseller', J.onboarding);
    expect(r).toContain('→ not Factory verified');
    expect(r).toContain('he sees nothing');
    expect(r.match(/✗/g)).toHaveLength(3);
    expect(r).toContain('Not a gate: Factory Launch is open to every seller whose price qualifies');
  });

  it('price position: ₹147 Low and Qualifies before the edit; ₹165 Mid and doesn’t qualify from D40', () => {
    const before = text('pricePosition', 'jasmeet', J.priceEdit - 1);
    expect(before).toContain('₹147 → Low third · Qualifies');
    const after = text('pricePosition', 'jasmeet', J.priceEdit);
    expect(after).toContain('₹165 → Mid third · Doesn’t qualify');
    const hold = text('priceHold', 'jasmeet', J.priceEdit);
    expect(hold).toContain('₹147 → ₹165');
    expect(hold).toContain('launch slot removed');
    expect(hold).toContain('Position Low → Mid');
  });

  it('Pack Point fee (Meesho’s view only): ₹1,26,444 ÷ 6,000 = ₹21.07 → × 1.18 partner margin = ₹24.87 → ÷ 0.822 = ₹30.3 → ₹30', () => {
    const lines = BEHIND.packPointFee!(at('samar', J.packPointLot));
    expect(lines[0]).toMatch(/^Meesho’s view, not shown to sellers/);
    const t = lines.join('\n');
    expect(t).toContain('₹1,26,444 a month ÷ 6,000 orders = ₹21.07');
    expect(t).toContain('× 1.18 (+ 18% partner margin, 3PL norm 15–20%) = ₹24.87');
    // Q20: the 1.18 is the partner margin; GST (18%) on the service sits on top and is reclaimed, so prices use ₹30
    expect(t).not.toMatch(/18% GST\)|× 1\.18 \(\+ 18% GST/);
    expect(lines[0]).toContain('“₹30 + GST per delivered order”: 18% GST on this service, which GST-registered sellers claim back as input credit');
    expect(lines[0]).toContain('every price uses ₹30');
    expect(t).toContain('÷ 0.822');
    expect(t).toContain('= ₹30.3 → ₹30 per delivered order at 40 makers');
    expect(t).toContain('₹44 at 20 · ₹30 at 40 · ₹26 at 60 · ₹23 at 80 makers; a Pack Point opens only at 40 makers');
    expect(t).toContain('Moradabad: 32/40 makers signed up');
  });

  it('Pack Point at Pickup Address: what the seller sees vs Meesho’s view', () => {
    const lines = BEHIND.fulfilment!(at('samar', J.onboarding));
    // only Pack Points within 150 km: Moradabad (200 km) and Rajkot (910 km) aren't listed for Agra
    expect(lines[0]).toBe('Seller sees: Agra in your district · Open, ₹30 + GST (only Pack Points within 150 km; city-centre distances, rounded to 10 km)');
    // every economics line is labelled
    for (const l of lines.slice(1)) expect(l).toMatch(/^Meesho’s view, not shown to sellers: /);
    expect(lines.join('\n')).toContain('Moradabad: 32/40 makers signed up');
    expect(lines.join('\n')).toContain('₹44 at 20 · ₹30 at 40 · ₹26 at 60 · ₹23 at 80 makers');
    const pp = BEHIND.packPointProgram!(at('samar', J.packPointLot));
    expect(pp.at(-1)).toMatch(/^Meesho’s view, not shown to sellers: Agra pools 40 makers; a Pack Point opens only at 40\./);
  });

  it('Samar’s lot at D50: 90 received, 617.5–682.5 g, free to D80 then ₹26.10 a day', () => {
    const t = text('lotInbound', 'samar', J.packPointLot);
    expect(t).toContain('6.5 a day × 14 = 91 → 90 (₹18,000 at cost)');
    expect(t).toContain('90 expected · 90 received');
    expect(t).toContain('650 g ± 5% = 617.5–682.5 g');
    expect(t).toContain('free to D80');
    expect(t).toContain('90 × ₹0.29 = ₹26.10 a day');
    expect(text('lotInbound', 'samar', J.packPointLot - 1)).toContain('Inbound at Agra on D50');
  });
});
