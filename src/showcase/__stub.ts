// TEMPORARY stand-in for registry.ts / behind.ts / features.json (written by another agent).
// Delete once the real files exist and point source.ts at them.
import { paths, onboarding } from '../app/paths';
import { withDemoParams, type Lang } from '../store/demo';
import type { BehindCtx, ElementInfo, Feature, PageInfo, Registry } from './types';

export const REGISTRY: Registry = {
  parts: [
    { id: 'onboarding', title: 'Factory Onboarding' },
    { id: 'listing', title: 'AI listing bot' },
    { id: 'launch', title: 'Factory Launch Week' },
    { id: 'growth', title: 'Growth Loop' },
    { id: 'price', title: 'Price Integrity' },
    { id: 'packpoint', title: 'Cluster Pack Point' },
  ],
  elements: [
    { docId: 'FO-1', title: 'Outreach message', tag: 'NEW', part: 'onboarding', what: 'Stub: outreach.', why: 'Stub why.' },
    { docId: 'FO-3', title: 'Cost check', tag: 'NEW', part: 'onboarding', what: 'Stub: cost check.', why: 'Stub why.', behind: 'costStack' },
    { docId: 'LW-1', title: 'Factory Launch tab', tag: 'NEW', part: 'launch', what: 'Stub.', why: 'Stub why.' },
    { docId: 'PI-2', title: 'Price position', tag: 'EXTENDED', part: 'price', what: 'Stub.', why: 'Stub why.' },
  ],
  features: [
    { id: 'fo-outreach', docId: 'FO-1', title: 'Outreach message', part: 'onboarding', tag: 'NEW', persona: 'jasmeet', day: 1, route: onboarding.outreach },
    { id: 'fo-cost', docId: 'FO-3', title: 'Cost check', part: 'onboarding', tag: 'NEW', persona: 'jasmeet', day: 1, route: onboarding.costCheck },
    { id: 'lw-tab', docId: 'LW-1', title: 'Factory Launch tab', part: 'launch', tag: 'NEW', persona: 'jasmeet', day: 5, route: paths.factoryLaunch },
    { id: 'pi-position', docId: 'PI-2', title: 'Price position', part: 'price', tag: 'EXTENDED', persona: 'jasmeet', day: 40, route: paths.pricePosition },
  ],
  pages: [
    { id: 'outreach', title: 'Outreach', match: '^/outreach', today: 'Not on Meesho today.', onlyOurs: true },
    { id: 'cost-check', title: 'Cost check', match: '^/cost-check', today: 'Not on Meesho today.', onlyOurs: true },
    { id: 'factory-launch', title: 'Promotions · Factory Launch', match: 'tab=FACTORY_LAUNCH', today: 'No Factory Launch tab today.', onlyOurs: true },
    { id: 'price-position', title: 'Price position', match: '/ipp/price-position', today: 'Not on Meesho today.', onlyOurs: true },
    { id: 'home', title: 'Home', match: '/growth/demo/home', today: 'Home dashboard.', nearest: 'fo-outreach' },
  ],
};

export const pageFor = (route: string): PageInfo | undefined => REGISTRY.pages.find((p) => new RegExp(p.match).test(route));
export const elementInfo = (docId: string): ElementInfo | undefined => REGISTRY.elements.find((e) => e.docId === docId);
export const featureById = (id: string): Feature | undefined => REGISTRY.features.find((f) => f.id === id);
export function featureHref(f: Feature, lang: Lang = 'en'): string {
  const [path, query = ''] = f.route.split('?') as [string, string?];
  return `${path}${withDemoParams(query, { persona: f.persona, day: f.day, lang })}`;
}
export const BEHIND: Record<string, (ctx: BehindCtx) => string[]> = {
  costStack: (c) => [`stub · persona ${c.persona} · D${c.day}`, 'stub line 2'],
};
