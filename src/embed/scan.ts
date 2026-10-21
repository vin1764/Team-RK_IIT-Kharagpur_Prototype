// Showcase frame: which C2M additions are on screen. Every element we added carries
// data-c2m-id="<doc ID>" (src/embed/c2mTags.test.ts checks the tags in source).
// "Visible" = rendered with a box: not display:none (incl. plain mode's html[data-c2m="off"] rule),
// not inside a hidden or closed container, not zero-sized.

export interface C2mTarget {
  el: HTMLElement;
  docId: string;
  /** badge number: 1-based position of docId in `ids` */
  n: number;
}

export const OVERLAY_ATTR = 'data-embed-overlay';

export function isShown(el: Element): boolean {
  if (typeof el.checkVisibility === 'function') {
    if (!el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })) return false;
  } else if (!el.getClientRects().length) return false;
  if (el.closest('[hidden],details:not([open]) > :not(summary)')) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/**
 * The visible [data-c2m-id] elements: `ids` = unique doc IDs in DOM order of first appearance (the badge
 * numbers 1, 2, 3…); `targets` = the elements to outline. A node inside a visible node with the same
 * doc ID is covered by the outer outline and left out of `targets`.
 */
export function scanC2m(root: ParentNode = document): { ids: string[]; targets: C2mTarget[] } {
  const ids: string[] = [];
  const found: { el: HTMLElement; docId: string }[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-c2m-id]'))) {
    if (el.closest(`[${OVERLAY_ATTR}]`)) continue;
    const docId = el.dataset.c2mId;
    if (!docId || !isShown(el)) continue;
    if (!ids.includes(docId)) ids.push(docId);
    const outer = el.parentElement?.closest<HTMLElement>(`[data-c2m-id="${docId}"]`);
    if (outer && isShown(outer)) continue;
    found.push({ el, docId });
  }
  return { ids, targets: found.map((t) => ({ ...t, n: ids.indexOf(t.docId) + 1 })) };
}

/** `focus` from a message: a doc ID ("LB-6") or a CSS selector. */
export const focusSelector = (focus: string) => (/^[A-Z]{2}-\d+$/.test(focus) ? `[data-c2m-id="${focus}"]` : focus);

/** First visible element for a doc ID or selector (null on a bad selector). */
export function findFocus(focus: string): HTMLElement | null {
  try {
    return Array.from(document.querySelectorAll<HTMLElement>(focusSelector(focus))).find((el) => !el.closest(`[${OVERLAY_ATTR}]`) && isShown(el)) ?? null;
  } catch {
    return null;
  }
}

/** Outermost visible elements of a doc ID (what a pulse rings). */
export function nodesFor(docId: string): HTMLElement[] {
  return scanC2m().targets.filter((t) => t.docId === docId).map((t) => t.el);
}
