import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Builds an in-app link that keeps the demo's query params (persona/day/lang) from the
 * current URL. The target's own params win; `ref` is dropped unless the target sets it.
 */
export function linkWithDemo(to: string, currentSearch: string): string {
  const [pathname, own = ''] = to.split('?');
  const q = new URLSearchParams(currentSearch);
  q.delete('ref');
  new URLSearchParams(own).forEach((v, k) => q.set(k, v));
  const s = q.toString();
  return s ? `${pathname}?${s}` : pathname!;
}

export function useDemoLink() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const href = useCallback((to: string) => linkWithDemo(to, search), [search]);
  const go = useCallback((to: string) => navigate(linkWithDemo(to, search)), [navigate, search]);
  return { href, go };
}

/** "1 L steel water bottle" → "1 L steel water bottles" (for "For …" / "looking for …"). */
export const plural = (name: string) => (name.endsWith('s') ? name : `${name}s`);

/** ₹150–170 */
export const rupeeRange = (low: number, high: number) => (low === high ? `₹${low}` : `₹${low}–${high}`);
