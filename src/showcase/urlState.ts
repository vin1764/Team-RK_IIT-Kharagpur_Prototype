// Shareable showcase URL: /?f=<featureId>&at=<frame route>&hl=0&c2m=off&sb=0&zoom=100
//   f     last feature jumped to (opening the link jumps there once the frame is ready)
//   at    the frame's route incl. its persona/day/lang params (wins over f for the frame's start page)
//   hl=0  highlights off · c2m=off "Today on Meesho" · sb=0 sidebar collapsed · zoom=100 real size
import { paths } from '../app/paths';
import calendar from '../data/calendar.json';
import { withDemoParams, type Lang, type Persona } from '../store/demo';

export type Zoom = 'fit' | '100';

export interface ShowcaseUrl {
  f?: string;
  at?: string;
  hl: boolean;
  c2m: boolean;
  sb: boolean;
  zoom: Zoom;
}

export const DEFAULT_URL: ShowcaseUrl = { hl: true, c2m: true, sb: true, zoom: 'fit' };

/** Only same-origin app paths may be loaded into the frame ("/x", never "//host" or "/\host"). */
export function safeAppPath(p: string | null | undefined): string | undefined {
  if (!p || p.length > 2000) return undefined;
  if (!p.startsWith('/') || p.startsWith('//') || p.startsWith('/\\')) return undefined;
  if (/[\u0000-\u001f]/.test(p)) return undefined;
  // "/" itself is the showcase: never nest it in its own frame.
  if (p === '/' || p.startsWith('/?') || p.startsWith('/#')) return undefined;
  return p;
}

const FEATURE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function parseShowcaseUrl(search: string): ShowcaseUrl {
  const q = new URLSearchParams(search);
  const f = q.get('f');
  return {
    f: f && FEATURE_ID.test(f) ? f : undefined,
    at: safeAppPath(q.get('at')),
    hl: q.get('hl') !== '0',
    c2m: q.get('c2m') !== 'off',
    sb: q.get('sb') !== '0',
    zoom: q.get('zoom') === '100' ? '100' : 'fit',
  };
}

/** "?f=…&at=…" (only non-default values), or "" when everything is default. */
export function serializeShowcaseUrl(s: ShowcaseUrl): string {
  const q = new URLSearchParams();
  if (s.f) q.set('f', s.f);
  const at = safeAppPath(s.at);
  if (at) q.set('at', at);
  if (!s.hl) q.set('hl', '0');
  if (!s.c2m) q.set('c2m', 'off');
  if (!s.sb) q.set('sb', '0');
  if (s.zoom === '100') q.set('zoom', '100');
  const out = q.toString();
  return out ? `?${out}` : '';
}

export interface FrameDemo {
  persona: Persona;
  day: number;
  lang: Lang;
  c2m: boolean;
}

/** A frame route (pathname + search) with the demo params written on, keeping its own query. */
export function routeWithDemo(route: string, d: FrameDemo): string {
  const [path, query = ''] = route.split('?') as [string, string?];
  return `${path}${withDemoParams(query, d)}`;
}

/** The frame's default start: Home, Jasmeet, onboarding day (D1). */
export const DEFAULT_FRAME_SRC = routeWithDemo(paths.home, { persona: 'jasmeet', day: calendar.jumps.onboarding, lang: 'en', c2m: true });

/**
 * The iframe's first src: `at` if given, else the feature's href, else Home at D1.
 * c2m=off on the showcase URL is carried onto the frame route.
 */
export function initialFrameSrc(u: ShowcaseUrl, hrefForFeature: (id: string) => string | undefined): string {
  let src = u.at ?? (u.f ? hrefForFeature(u.f) : undefined) ?? DEFAULT_FRAME_SRC;
  if (!u.c2m) {
    const [path, query = ''] = src.split('?') as [string, string?];
    const q = new URLSearchParams(query);
    q.set('c2m', 'off');
    src = `${path}?${q.toString()}`;
  }
  return src;
}

/** Persona/day/lang/c2m as written on a frame route's query (defaults where missing). */
export function demoFromRoute(route: string): FrameDemo {
  const q = new URLSearchParams(route.split('?')[1] ?? '');
  const persona = q.get('persona');
  const day = Number(q.get('day'));
  return {
    persona: persona === 'samar' || persona === 'reseller' ? persona : 'jasmeet',
    day: q.has('day') && Number.isInteger(day) && day >= 0 && day <= calendar.maxDay ? day : calendar.jumps.onboarding,
    lang: q.get('lang') === 'hi' ? 'hi' : 'en',
    c2m: q.get('c2m') !== 'off',
  };
}
