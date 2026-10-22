import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { onboarding, paths } from '../app/paths';
import calendar from '../data/calendar.json';
import { BEHIND } from './behind';
import { REGISTRY, elementInfo, featureById, featureHref, featuresByPart, laterFeature, nextFeature, pageFor } from './registry';
import type { BehindCtx, Prep } from './types';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const JSON_TEXT = readFileSync(fileURLToPath(new URL('./features.json', import.meta.url)), 'utf8');

/** Numbers that must never reach the maker side: the hidden price cap (both personas), the drop to it, the coach trigger. */
const FORBIDDEN = [/₹\s?(160|370)\b/, /₹\s?(13|34)\b(?![.,\d])/, /2\.5\s?%/];

describe('registry shape', () => {
  it('six parts, in sidebar order', () => {
    expect(REGISTRY.parts.map((p) => p.title)).toEqual([
      'Factory Onboarding',
      'AI listing bot',
      'Factory Launch Week',
      'Growth Loop',
      'Price Integrity',
      'Cluster Pack Point',
    ]);
  });

  it('ids are unique (features, elements, pages)', () => {
    const uniq = (xs: string[]) => expect(new Set(xs).size).toBe(xs.length);
    uniq(REGISTRY.features.map((f) => f.id));
    uniq(REGISTRY.elements.map((e) => e.docId));
    uniq(REGISTRY.pages.map((p) => p.id));
  });

  it('feature ids are kebab-case', () => {
    for (const f of REGISTRY.features) expect(f.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('every part has features, and the jump list is grouped by part in part order', () => {
    const order = REGISTRY.parts.map((p) => p.id);
    const seen = REGISTRY.features.map((f) => order.indexOf(f.part));
    expect(seen.every((v, i) => i === 0 || v >= seen[i - 1]!)).toBe(true);
    for (const g of featuresByPart()) expect(g.features.length).toBeGreaterThan(0);
  });

  it('every element has a title, what and why; doc IDs look like the doc’s', () => {
    for (const e of REGISTRY.elements) {
      expect(e.docId).toMatch(/^(FO|LB|LW|GL|PI|PP)-\d+$/);
      expect(e.title && e.what && e.why).toBeTruthy();
      expect(REGISTRY.parts.some((p) => p.id === e.part)).toBe(true);
    }
  });
});

describe('features (the jump list)', () => {
  const PREPS: Prep[] = ['botPhotos', 'botFilled', 'commitModal', 'clean'];

  it('each feature’s doc ID has an ElementInfo with the same tag and part', () => {
    for (const f of REGISTRY.features) {
      const e = elementInfo(f.docId);
      expect(e, f.id).toBeDefined();
      expect(e!.tag, f.id).toBe(f.tag);
      expect(e!.part, f.id).toBe(f.part);
    }
  });

  it('persona, day and prep are valid', () => {
    for (const f of REGISTRY.features) {
      expect(['jasmeet', 'samar', 'reseller']).toContain(f.persona);
      expect(Number.isInteger(f.day) && f.day >= 0 && f.day <= calendar.maxDay, f.id).toBe(true);
      for (const p of f.prep ?? []) expect(PREPS).toContain(p);
    }
  });

  it('routes carry no demo params of their own', () => {
    for (const f of REGISTRY.features) expect(f.route, f.id).not.toMatch(/[?&](persona|day|lang|c2m)=/);
  });

  // Where each jump lands. Keep in step with features.json.
  const LANDS: Record<string, string> = {
    'fo-outreach': 'outreach',
    'pp-drawer': 'pickup-address',
    'pp-use-onboarding': 'pickup-address',
    'lb-price-packpoint': 'bot-price',
    'pp-switch-confirm': 'warehouse',
    'gl-plan-batch': 'inventory',
    'gl-plan-lot': 'inventory',
    'fo-checks-maker': 'business-details',
    'fo-checks-reseller': 'business-details',
    'fo-ship-choice': 'pickup-address',
    'fo-finish-pick': 'onboarding-finish',
    'fo-finish-teaser': 'onboarding-finish',
    'fo-finish-cost': 'onboarding-finish',
    'lb-entry': 'home',
    'lb-product': 'bot-product',
    'lb-hindi': 'bot-product',
    'lb-quantity': 'bot-quantity',
    'lb-price': 'bot-price',
    'lb-go-live': 'bot-price',
    'lw-banner': 'home',
    'lw-banner-listed': 'home',
    'lw-sidebar': 'home',
    'lw-notice': 'notices',
    'lw-order-book': 'factory-launch',
    'lw-commit': 'factory-launch',
    'lw-live': 'live-launch',
    'lw-score': 'quality',
    'gl-restock': 'inventory',
    'gl-verdicts': 'inventory',
    'gl-coach': 'business-dashboard',
    'pi-position': 'price-position',
    'pi-hold': 'price-position',
    'pp-samar': 'warehouse',
    'pp-lot': 'warehouse',
    'pp-jasmeet': 'warehouse',
  };

  it('every feature route lands on its intended page (also with the demo params added)', () => {
    expect(Object.keys(LANDS).sort()).toEqual(REGISTRY.features.map((f) => f.id).sort());
    for (const f of REGISTRY.features) {
      expect(pageFor(f.route)?.id, f.id).toBe(LANDS[f.id]);
      expect(pageFor(featureHref(f))?.id, `${f.id} (href)`).toBe(LANDS[f.id]);
    }
  });

  it('the jump list covers the demo guide’s hero moments in order', () => {
    const ids = REGISTRY.features.map((f) => f.id);
    const hero = ['fo-outreach', 'fo-checks-maker', 'fo-checks-reseller', 'fo-ship-choice', 'fo-finish-pick', 'fo-finish-teaser', 'fo-finish-cost', 'lb-entry', 'lb-product', 'lb-quantity', 'lb-price', 'lb-go-live', 'lw-banner', 'lw-order-book', 'lw-commit', 'lw-live', 'lw-score', 'gl-restock', 'gl-verdicts', 'gl-coach', 'pi-position', 'pi-hold', 'pp-samar', 'pp-jasmeet'];
    const at = hero.map((id) => ids.indexOf(id));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it('price position before the edit (D39) and the breach on the edit day', () => {
    expect(featureById('pi-position')!.day).toBeLessThan(calendar.jumps.priceEdit);
    expect(featureById('pi-hold')!.day).toBe(calendar.jumps.priceEdit);
  });

  it('the commit jump lands before commitments close, on a clean order book', () => {
    const f = featureById('lw-commit')!;
    expect(f.day).toBeLessThanOrEqual(calendar.launch.commitmentsCloseDay);
    expect(f.prep).toEqual(expect.arrayContaining(['clean', 'commitModal']));
  });

  it('featureHref keeps the route’s own query and adds persona/day/lang', () => {
    const f = featureById('lw-order-book')!;
    expect(featureHref(f)).toBe(`${paths.promotionsBase}?tab=FACTORY_LAUNCH&persona=jasmeet&day=5&lang=en`);
    expect(featureHref(f, 'hi')).toContain('lang=hi');
    expect(featureHref(f, { base: 'https://x.test' })).toMatch(/^https:\/\/x\.test\/panel\//);
  });

  it('nextFeature steps through the jump list', () => {
    const list = REGISTRY.features;
    expect(nextFeature(list[0]!.id, 1)).toBe(list[1]);
    expect(nextFeature(list[1]!.id, -1)).toBe(list[0]);
    expect(nextFeature(list[0]!.id, -1)).toBeUndefined();
    expect(nextFeature(list.at(-1)!.id, 1, true)).toBe(list[0]);
    expect(nextFeature(undefined, 1)).toBe(list[0]);
  });
});

describe('pages ("On this screen", "Today vs ours")', () => {
  // One route for every <Route> in src/app/App.tsx (plus the variants we describe separately).
  const ROUTES: [string, string][] = [
    // the 21 existing panel pages
    [paths.home, 'home'],
    [paths.notices, 'notices'],
    [paths.orders, 'orders'],
    [paths.returns, 'returns'],
    [paths.claims, 'claims'],
    [paths.warehouse, 'warehouse'],
    [paths.reduceRto, 'reduce-rto'],
    [paths.managePricing, 'manage-pricing'],
    [paths.inventory, 'inventory'],
    [paths.quality, 'quality'],
    [paths.catalogUploadsBulk, 'catalog-uploads'],
    [paths.imageBulkUpload, 'image-bulk-upload'],
    [paths.payments, 'payments'],
    [paths.influencerMarketing, 'influencer-marketing'],
    [paths.promotions, 'promotions'],
    [paths.saleOptIn, 'sale-opt-in'],
    [paths.offerOptIn, 'offer-opt-in'],
    [paths.instantCash, 'instant-cash'],
    [paths.businessDashboard, 'business-dashboard'],
    [paths.addSingleCategory, 'add-single-category'],
    [paths.addBulk, 'bulk-catalog-upload'],
    // other states of the same routes
    [paths.catalogUploadsSingle, 'catalog-uploads'],
    [paths.ordersTab('shipped'), 'orders'],
    [paths.returnsTab('return-tracking'), 'returns'],
    [paths.reduceRtoAdd, 'reduce-rto'],
    [`${paths.managePricing}?sort=x`, 'manage-pricing'],
    [`${paths.home}?state=qc`, 'home'],
    // new or changed screens
    [paths.pricePosition, 'price-position'],
    [paths.factoryLaunch, 'factory-launch'],
    [`${paths.promotionsBase}?tab=FACTORY_LAUNCH&status=LIVE`, 'factory-launch'],
    [`${paths.promotionsBase}?tab=SALE&status=UPCOMING`, 'promotions'],
    [paths.factoryLaunchLive, 'live-launch'],
    [`${paths.addSingleCategory}?mode=photos`, 'bot-photos'],
    [`${paths.addSingleDetails}?mode=photos&step=product`, 'bot-product'],
    [`${paths.addSingleDetails}?mode=photos&step=quantity`, 'bot-quantity'],
    [`${paths.addSingleDetails}?mode=photos&step=price`, 'bot-price'],
    [`${paths.addSingleDetails}?mode=photos`, 'bot-product'],
    [`${paths.addSingleDetails}?mode=photos&view=form`, 'catalog-full-form-bot'],
    [paths.addSingleDetails, 'add-single-details'],
    [onboarding.outreach, 'outreach'],
    [onboarding.signup, 'signup'],
    [onboarding.businessDetails, 'business-details'],
    [onboarding.pickupAddress, 'pickup-address'],
    [onboarding.bankDetails, 'bank-details'],
    [onboarding.supplierDetails, 'supplier-details'],
    [onboarding.done, 'onboarding-finish'],
    [`${onboarding.done}?state=picked`, 'onboarding-finish'],
    // the outreach link now opens Meesho's own sign-up; an old ?ref=outreach link is plain sign-up too
    ['/signup?ref=outreach', 'signup'],
  ];

  it('every route resolves to its page, with or without demo params', () => {
    for (const [route, id] of ROUTES) {
      expect(pageFor(route)?.id, route).toBe(id);
      const sep = route.includes('?') ? '&' : '?';
      expect(pageFor(`${route}${sep}persona=samar&day=50&lang=hi`)?.id, `${route} + params`).toBe(id);
    }
  });

  it('App.tsx has no frame route the registry doesn’t know (31 at the time of writing, with /onboarding/done; the showcase itself excluded)', () => {
    const app = readFileSync(join(SRC, 'app', 'App.tsx'), 'utf8');
    const routes = [...app.matchAll(/<Route\s+path=(\{[^}]*\}|"[^"]*")/g)].map((m) => m[1]!).filter((p) => !['"*"', '"/"', '{SHOWCASE_PATH}'].includes(p));
    expect(routes).toHaveLength(31);
  });

  it('every page is covered by the route list above', () => {
    const hit = new Set(ROUTES.map(([, id]) => id));
    expect(REGISTRY.pages.map((p) => p.id).filter((id) => !hit.has(id))).toEqual([]);
  });

  it('ours-only screens say so; Meesho pages describe what the real page does', () => {
    const ours = REGISTRY.pages.filter((p) => p.onlyOurs).map((p) => p.id).sort();
    expect(ours).toEqual(['bot-price', 'bot-product', 'bot-quantity', 'onboarding-finish', 'factory-launch', 'live-launch', 'outreach', 'price-position'].sort());
    for (const p of REGISTRY.pages) expect(p.today.length, p.id).toBeGreaterThan(10);
  });

  it('every page’s nearest feature exists', () => {
    for (const p of REGISTRY.pages) if (p.nearest) expect(featureById(p.nearest), p.id).toBeDefined();
  });

  it('pages with additions in another state point to them; unchanged pages do not', () => {
    const page = (id: string) => REGISTRY.pages.find((p) => p.id === id)!;
    expect(laterFeature(page('business-details'))?.id).toBe('fo-checks-maker');
    expect(laterFeature(page('inventory'))?.id).toBe('gl-restock');
    expect(laterFeature(page('manage-pricing'))?.id).toBe('pi-position');
    // LW-6: the pinned notice lands on Notices (eligible makers only)
    expect(laterFeature(page('notices'))?.id).toBe('lw-notice');
    for (const id of ['orders', 'claims', 'payments', 'bank-details', 'signup']) expect(laterFeature(page(id)), id).toBeUndefined();
    for (const p of REGISTRY.pages) if (p.addsLater) expect(p.nearest, p.id).toBeDefined();
  });

  it('every match is a valid regex anchored at the start', () => {
    for (const p of REGISTRY.pages) {
      expect(() => new RegExp(p.match)).not.toThrow();
      expect(p.match.startsWith('^'), p.id).toBe(true);
    }
  });
});

describe('the registry matches the app’s C2M tags', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
    });
  // Every quoted doc ID on a line that mentions c2m (data-c2m-id="…", data-c2m="…", c2m="…", c2m: '…').
  const tagged = new Set<string>();
  for (const f of files(SRC).filter((f) => !relative(SRC, f).startsWith('showcase'))) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (!line.includes('c2m')) continue;
      for (const m of line.matchAll(/['"]((?:FO|LB|LW|GL|PI|PP)-\d+)['"]/g)) tagged.add(m[1]!);
    }
  }

  it('every doc ID tagged in the app has an ElementInfo', () => {
    expect([...tagged].filter((id) => !elementInfo(id)).sort()).toEqual([]);
  });

  it('every ElementInfo is tagged somewhere in the app', () => {
    expect(REGISTRY.elements.map((e) => e.docId).filter((id) => !tagged.has(id))).toEqual([]);
  });
});

describe('no hidden numbers in the registry', () => {
  it('features.json has no price cap, price drop or coach trigger', () => {
    for (const re of FORBIDDEN) expect(JSON_TEXT).not.toMatch(re);
  });

  it('nor do any Behind-it lines, for any persona on the demo’s key days', () => {
    const days = [0, ...Object.values(calendar.jumps), 39, 90];
    for (const persona of ['jasmeet', 'samar', 'reseller'] as const)
      for (const day of days)
        for (const [key, fn] of Object.entries(BEHIND)) {
          const ctx: BehindCtx = { persona, day, lang: 'en', route: '' };
          const text = fn(ctx).join('\n');
          for (const re of FORBIDDEN) expect(text, `${key} ${persona} D${day}`).not.toMatch(re);
        }
  });
});
