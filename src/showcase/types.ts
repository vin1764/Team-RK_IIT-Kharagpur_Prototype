// Showcase contract: the registry shape (src/showcase/features.json) and the frame ↔ sidebar messages.
// Three parts read or write these; change them only together.
//
//   Registry  src/showcase/features.json  — one source of truth: jump list, "On this screen",
//             highlights and the tour all read it. "Behind it" lines come from src/showcase/behind.ts.
//   Frame     the prototype in an <iframe> (same origin). src/embed/FrameBridge.tsx runs inside it
//             (only when window.self !== window.top) and talks to the parent with postMessage.
//   Showcase  the page at "/" (src/showcase/Showcase.tsx): frame + sidebar.

import type { Lang, Persona } from '../store/demo';

/** The six solution parts, in sidebar order. */
export type PartId = 'onboarding' | 'listing' | 'launch' | 'growth' | 'price' | 'packpoint';

export interface Part {
  id: PartId;
  /** "Factory Onboarding", "AI listing bot", "Factory Launch Week", "Growth Loop", "Price Integrity", "Cluster Pack Point" */
  title: string;
}

/**
 * A new element in the app, keyed by its doc ID. Every element in the app that we added carries
 * data-c2m-id="<docId>" (several DOM nodes may share one docId; they share one badge number).
 */
export interface ElementInfo {
  /** doc ID from reference/C2M-solution-doc.pdf, e.g. "LB-6" — the data-c2m-id value */
  docId: string;
  /** short name, e.g. "Take-home and Qualifies chip" */
  title: string;
  tag: 'NEW' | 'EXTENDED';
  part: PartId;
  /** "What we added": one line */
  what: string;
  /** "Why": one line, tied to the solution */
  why: string;
  /** key into BEHIND in src/showcase/behind.ts; omitted when there is no calculation to show */
  behind?: string;
}

/** Things the frame must set up before a jump lands (implemented in FrameBridge). */
export type Prep =
  | 'botPhotos' //   draft with photos added and the bot pre-fill run; maker fields empty (Product screen)
  | 'botFilled' //   draft fully filled with the demo values and Pack of 1 confirmed (Quantity/Price reachable)
  | 'commitModal' // open the Factory Launch commit modal on the order book
  | 'clean'; //      clear the user's interactive demo state (listings, draft, commits, price edits) first

/** One item of "Jump to what's new". */
export interface Feature {
  /** unique, kebab-case, e.g. "lb-price"; also used in shareable showcase links (?f=lb-price) */
  id: string;
  docId: string;
  title: string;
  part: PartId;
  tag: 'NEW' | 'EXTENDED';
  persona: Persona;
  day: number;
  /** path + own query (e.g. "?tab=FACTORY_LAUNCH"), without persona/day/lang/c2m */
  route: string;
  /** element to highlight and scroll to; default `[data-c2m-id="<docId>"]` */
  selector?: string;
  prep?: Prep[];
}

/** A page of the app, for "On this screen" and "Today vs ours". */
export interface PageInfo {
  /** e.g. "home", "manage-pricing", "bot-price" */
  id: string;
  title: string;
  /**
   * Regex source tested against `pathname + search` of the frame (first match wins, so list the
   * more specific patterns first — e.g. the bot screens before the generic Add Single Catalog).
   */
  match: string;
  /** "Today on Meesho": one line on what the real page does. For ours-only screens, say so. */
  today: string;
  /** true for screens that exist only in our solution (cost check, outreach, Factory Launch tab…) */
  onlyOurs?: boolean;
  /** for unchanged pages (and as a fallback): the nearest new feature to link to */
  nearest?: string;
}

export interface Registry {
  parts: Part[];
  elements: ElementInfo[];
  features: Feature[];
  pages: PageInfo[];
}

/** Context for "Behind it" calculations (seeded values for the persona; never Benchmark B). */
export interface BehindCtx {
  persona: Persona;
  day: number;
  lang: Lang;
  route: string;
}

// ── postMessage protocol (same origin; every message has `rk: 'showcase'`) ────────────────────────

/** Frame → parent */
export type FrameMsg =
  | { rk: 'showcase'; type: 'ready' }
  | {
      rk: 'showcase';
      type: 'state';
      /** pathname + search of the frame */
      route: string;
      persona: Persona;
      day: number;
      lang: Lang;
      c2m: boolean;
      /** doc IDs of visible [data-c2m-id] elements, in DOM order of first appearance = badge numbers 1, 2, 3… */
      elements: string[];
    };

/** Parent → frame */
export type ShowMsg =
  | { rk: 'showcase'; type: 'navigate'; to: string; persona: Persona; day: number; lang?: Lang; prep?: Prep[]; focus?: string }
  | { rk: 'showcase'; type: 'demo'; persona?: Persona; day?: number; lang?: Lang; reset?: boolean }
  | { rk: 'showcase'; type: 'c2m'; on: boolean }
  | { rk: 'showcase'; type: 'highlight'; on: boolean }
  /** pulse the element(s) of this doc ID (hover in the sidebar); focus = also scroll into view */
  | { rk: 'showcase'; type: 'pulse'; docId: string; focus?: boolean };

export const isShowcaseMsg = (d: unknown): d is FrameMsg | ShowMsg =>
  typeof d === 'object' && d !== null && (d as { rk?: unknown }).rk === 'showcase';
