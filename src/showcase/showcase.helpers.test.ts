import { describe, expect, it } from 'vitest';
import { paths, onboarding } from '../app/paths';
import { CHROME, FRAME_H, FRAME_W, fitScale, laptopSize } from './frameMath';
import { nearestMeeshoRoute } from './meeshoNearest';
import { DEFAULT_FRAME_SRC, DEFAULT_URL, demoFromRoute, initialFrameSrc, parseShowcaseUrl, routeWithDemo, safeAppPath, serializeShowcaseUrl } from './urlState';

describe('fitScale', () => {
  it('is width-limited on a laptop stage and keeps the laptop inside it', () => {
    // 1366×768 viewport, 20px concept strip, 36px toolbar, 355px sidebar.
    const w = 1366 - 355;
    const h = 768 - 20 - 36;
    const k = fitScale(w, h);
    expect(k).toBeGreaterThan(0.66);
    expect(k).toBeLessThan(0.71);
    const l = laptopSize(k);
    expect(l.w + 2 * CHROME.pad).toBeLessThanOrEqual(w);
    expect(l.h + 2 * CHROME.pad).toBeLessThanOrEqual(h);
  });
  it('is height-limited on a wide, short stage', () => {
    const k = fitScale(3000, 500);
    expect(Math.round(FRAME_H * k) + CHROME.top + CHROME.bottom + CHROME.base + 2 * CHROME.pad).toBeLessThanOrEqual(500);
    expect(k).toBeCloseTo((500 - 2 * CHROME.pad - CHROME.top - CHROME.bottom - CHROME.base) / FRAME_H, 2);
  });
  it('never upscales past real size and never collapses', () => {
    expect(fitScale(5000, 5000)).toBe(1);
    expect(fitScale(10, 10)).toBe(0.2);
    expect(fitScale(0, 0)).toBe(0.2);
    expect(fitScale(Number.NaN, 400)).toBe(0.2);
  });
  it('fits a 768-wide phone/tablet by width', () => {
    const k = fitScale(768, 1000);
    expect(Math.round(FRAME_W * k) + 2 * (CHROME.side + CHROME.overhang + CHROME.pad)).toBeLessThanOrEqual(768);
  });
});

describe('showcase URL state', () => {
  it('defaults when empty', () => {
    expect(parseShowcaseUrl('')).toEqual(DEFAULT_URL);
    expect(serializeShowcaseUrl(DEFAULT_URL)).toBe('');
  });
  it('round-trips every field', () => {
    const at = `${paths.managePricing}?persona=jasmeet&day=40&lang=en&c2m=off`;
    const s = { f: 'lb-price', at, hl: false, c2m: false, sb: false, zoom: '100' as const };
    const q = serializeShowcaseUrl(s);
    expect(q).toContain('f=lb-price');
    expect(q).toContain('hl=0');
    expect(q).toContain('c2m=off');
    expect(q).toContain('sb=0');
    expect(q).toContain('zoom=100');
    expect(parseShowcaseUrl(q)).toEqual(s);
  });
  it('rejects unsafe frame routes and odd feature ids', () => {
    for (const bad of ['//evil.example/x', '/\\evil', 'https://evil.example', 'javascript:alert(1)', '/', '/?f=x', '']) expect(safeAppPath(bad)).toBeUndefined();
    expect(parseShowcaseUrl('?at=%2F%2Fevil.example&f=..%2Fx').at).toBeUndefined();
    expect(parseShowcaseUrl('?f=..%2Fx').f).toBeUndefined();
    expect(safeAppPath(paths.home)).toBe(paths.home);
  });
  it('picks the first frame src: at, then the feature, then Home at D1', () => {
    const href = (id: string) => (id === 'x' ? '/cost-check?persona=jasmeet&day=1&lang=en' : undefined);
    expect(initialFrameSrc({ ...DEFAULT_URL, at: '/outreach?day=3', f: 'x' }, href)).toBe('/outreach?day=3');
    expect(initialFrameSrc({ ...DEFAULT_URL, f: 'x' }, href)).toBe('/cost-check?persona=jasmeet&day=1&lang=en');
    expect(initialFrameSrc({ ...DEFAULT_URL, f: 'nope' }, href)).toBe(DEFAULT_FRAME_SRC);
    expect(DEFAULT_FRAME_SRC).toBe(`${paths.home}?persona=jasmeet&day=1&lang=en`);
    expect(initialFrameSrc({ ...DEFAULT_URL, c2m: false }, href)).toBe(`${paths.home}?persona=jasmeet&day=1&lang=en&c2m=off`);
  });
  it('writes and reads the demo params on a frame route, keeping its own query', () => {
    const r = routeWithDemo(paths.factoryLaunch, { persona: 'samar', day: 50, lang: 'hi', c2m: false });
    expect(r).toContain('tab=FACTORY_LAUNCH');
    expect(demoFromRoute(r)).toEqual({ persona: 'samar', day: 50, lang: 'hi', c2m: false });
    expect(demoFromRoute('/outreach')).toEqual({ persona: 'jasmeet', day: 1, lang: 'en', c2m: true });
  });
});

describe('nearest Meesho page for ours-only screens', () => {
  it('maps each ours-only screen to an existing page', () => {
    expect(nearestMeeshoRoute('/cost-check?day=1')).toBe(onboarding.signup);
    expect(nearestMeeshoRoute(`${paths.factoryLaunch}&persona=jasmeet`)).toBe(paths.promotions);
    expect(nearestMeeshoRoute(paths.factoryLaunchLive)).toBe(paths.promotions);
    expect(nearestMeeshoRoute(paths.pricePosition)).toBe(paths.managePricing);
    expect(nearestMeeshoRoute(paths.home)).toBeUndefined();
  });
});
