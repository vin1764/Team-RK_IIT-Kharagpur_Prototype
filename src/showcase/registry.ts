// The showcase registry (src/showcase/features.json), typed, with the lookups the sidebar needs.
// One source of truth: "Jump to what's new", "On this screen", highlights and "Today vs ours" all read it.
// "Behind it" lines come from ./behind.ts (BEHIND[element.behind]).
import { withDemoParams, type Lang } from '../store/demo';
import data from './features.json';
import type { ElementInfo, Feature, PageInfo, Part, PartId, Registry } from './types';

export const REGISTRY: Registry = data as Registry;

const PAGE_RE = REGISTRY.pages.map((p) => ({ page: p, re: new RegExp(p.match) }));
const ELEMENTS = new Map(REGISTRY.elements.map((e) => [e.docId, e]));
const FEATURES = new Map(REGISTRY.features.map((f) => [f.id, f]));

/** The page a frame route (pathname + search) is on: the first pattern that matches. */
export function pageFor(route: string): PageInfo | undefined {
  return PAGE_RE.find(({ re }) => re.test(route))?.page;
}

/** What we added, for a data-c2m-id value. */
export function elementInfo(docId: string): ElementInfo | undefined {
  return ELEMENTS.get(docId);
}

export function featureById(id: string): Feature | undefined {
  return FEATURES.get(id);
}

/** The jump list grouped by the six solution parts, in sidebar order (parts without features are kept, empty). */
export function featuresByPart(): { part: Part; features: Feature[] }[] {
  return REGISTRY.parts.map((part) => ({ part, features: REGISTRY.features.filter((f) => f.part === part.id) }));
}

export function partTitle(id: PartId): string {
  return REGISTRY.parts.find((p) => p.id === id)?.title ?? id;
}

/** Prev (-1) / Next (+1) in jump-list order; undefined past either end unless `wrap`. Unknown id → the first feature. */
export function nextFeature(id: string | undefined, dir: 1 | -1, wrap = false): Feature | undefined {
  const list = REGISTRY.features;
  const i = id ? list.findIndex((f) => f.id === id) : -1;
  if (i < 0) return dir === 1 ? list[0] : list[list.length - 1];
  const j = i + dir;
  if (j >= 0 && j < list.length) return list[j];
  return wrap ? list[(j + list.length) % list.length] : undefined;
}

/**
 * The feature's route with ?persona=&day=&lang= added (its own query kept), for "Open full screen"
 * and share links. `opts` is the language, or { lang, base } with base e.g. window.location.origin.
 */
export function featureHref(f: Feature, opts: Lang | { lang?: Lang; base?: string } = {}): string {
  const { lang = 'en', base = '' } = typeof opts === 'string' ? { lang: opts } : opts;
  const [path, query = ''] = f.route.split('?') as [string, string?];
  return `${base}${path}${withDemoParams(query, { persona: f.persona, day: f.day, lang })}`;
}

/** CSS selector for a feature's element: its own, or every node tagged with its doc ID. */
export function featureSelector(f: Feature): string {
  return f.selector ?? `[data-c2m-id="${f.docId}"]`;
}
