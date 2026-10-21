// The showcase frame's side of the bridge (contract: src/showcase/types.ts). Rendered by DemoControls only when the
// app runs inside the showcase's <iframe> (EMBEDDED); outside the frame nothing here runs.
//   → parent: 'ready' once, then 'state' (route, persona, day, lang, c2m, visible doc IDs) whenever one changes.
//   ← parent: navigate (with prep + focus), demo, c2m, highlight, pulse.
// Jumps reuse the Demo guide's mechanism (startJump → DemoUrlSync adopts persona/day/lang once the route is current).
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { clearPendingJump, startJump } from '../layout/DemoGuide';
import { useDemo, withDemoParams } from '../store/demo';
import { isShowcaseMsg, type FrameMsg, type ShowMsg } from '../showcase/types';
import { HighlightOverlay, PULSE_DURATION, type Pulse } from './HighlightOverlay';
import { draftJump, endDraftJump } from '../pages/panel/catalog/draftStore';
import { resetInteractive, runPrep } from './prep';
import { findFocus, nodesFor, OVERLAY_ATTR, scanC2m, type C2mTarget } from './scan';

/** Batches DOM changes before a rescan (and a 'state' message if anything changed). */
const SCAN_MS = 150;
/** How long a jump's focus keeps looking for its element while the page renders. */
const FOCUS_TRY_MS = 3000;
/** A focus target must stay put this long before scrolling (pages scroll to top on mount). */
const FOCUS_SETTLE_MS = 250;
/** A jump whose route never became current (e.g. a redirect) is applied directly after this. */
const LAND_MS = 3000;
/** How often a jump in flight checks whether its route is current. */
const LAND_POLL_MS = 100;

/** Room above a tall focus target for the concept strip and the page's sticky header (CSS px). */
const TALL_TOP = 84;

/**
 * Scroll a target into view: centred, or — when it is taller than the viewport — with its top (and so its
 * badge) just under the page's sticky header. scroll-margin is read when the scroll starts, so it is restored at once.
 */
function reveal(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  // Already in full view: leave the page where it is.
  if (r.top >= TALL_TOP && r.bottom <= window.innerHeight) return;
  if (r.height <= window.innerHeight - TALL_TOP) {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }
  const prev = el.style.scrollMarginTop;
  el.style.scrollMarginTop = `${TALL_TOP}px`;
  el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  el.style.scrollMarginTop = prev;
}

const SHOW_TYPES = new Set(['navigate', 'demo', 'c2m', 'highlight', 'pulse']);
const post = (msg: FrameMsg) => window.parent.postMessage(msg, window.location.origin);
let readySent = false;

const inOverlay = (n: Node | null) => !!(n && (n instanceof Element ? n : n.parentElement)?.closest(`[${OVERLAY_ATTR}]`));
const isOverlayRecord = (r: MutationRecord) =>
  inOverlay(r.target) ||
  (r.type === 'childList' && [...Array.from(r.addedNodes), ...Array.from(r.removedNodes)].every((n) => n instanceof Element && n.hasAttribute(OVERLAY_ATTR)));
const sameTargets = (a: C2mTarget[], b: C2mTarget[]) => a.length === b.length && a.every((t, i) => t.el === b[i]!.el && t.n === b[i]!.n);

export function FrameBridge() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { persona, day, lang, c2m } = useDemo();
  const [highlight, setHighlight] = useState(true);
  const [targets, setTargets] = useState<C2mTarget[]>([]);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const lastSent = useRef('');
  const timer = useRef(0);
  const pulseKey = useRef(0);
  const focusRun = useRef(0);
  const navRun = useRef(0);

  // ── scan + 'state' ──
  const flush = () => {
    const { ids, targets: found } = scanC2m();
    setTargets((prev) => (sameTargets(prev, found) ? prev : found));
    const s = useDemo.getState();
    const msg: FrameMsg = {
      rk: 'showcase',
      type: 'state',
      route: window.location.pathname + window.location.search,
      persona: s.persona,
      day: s.day,
      lang: s.lang,
      c2m: s.c2m,
      elements: s.c2m ? ids : [],
    };
    const key = JSON.stringify(msg);
    if (key !== lastSent.current) {
      lastSent.current = key;
      post(msg);
    }
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;
  const schedule = () => {
    if (timer.current) return;
    timer.current = window.setTimeout(() => {
      timer.current = 0;
      flushRef.current();
    }, SCAN_MS);
  };

  const pulseEls = (els: HTMLElement[]) => {
    if (!els.length) return;
    const items = els.map((el) => ({ key: ++pulseKey.current, el }));
    setPulses((p) => [...p, ...items]);
    window.setTimeout(() => setPulses((p) => p.filter((x) => !items.includes(x))), PULSE_DURATION + 50);
  };

  /** Scroll to and pulse the first element for `focus`, retrying while the page renders. */
  const focusWhenReady = (focus: string, path: string) => {
    const run = ++focusRun.current;
    const start = performance.now();
    let seenAt = 0;
    const tick = () => {
      if (run !== focusRun.current) return;
      const now = performance.now();
      const el = window.location.pathname === path ? findFocus(focus) : null;
      if (el) {
        if (!seenAt) seenAt = now;
        else if (now - seenAt >= FOCUS_SETTLE_MS) {
          reveal(el);
          pulseEls([el]);
          return;
        }
      } else seenAt = 0;
      if (now - start < FOCUS_TRY_MS) window.setTimeout(tick, 100);
    };
    tick();
  };

  const onNavigate = (m: Extract<ShowMsg, { type: 'navigate' }>) => {
    const lang = m.lang ?? 'en';
    const s = useDemo.getState();
    const hrefFor = (to: string) => {
      const [path, query = ''] = to.split('?') as [string, string?];
      return { path, href: `${path}${withDemoParams(query, { persona: m.persona, day: m.day, lang, c2m: s.c2m })}` };
    };
    const here = window.location.pathname + window.location.search;
    // The prep may clear the draft under the current page: hold its redirect until the jump lands.
    if (m.prep?.length && hrefFor(m.to).href !== here) draftJump.pending = true;
    const to = runPrep(m.prep, m.persona, m.to);
    const { path, href } = hrefFor(to);
    if (href === here) {
      endDraftJump();
      s.setPersona(m.persona);
      s.setDay(m.day);
      s.setLang(lang);
    } else {
      const run = ++navRun.current;
      startJump({ label: 'showcase', persona: m.persona, day: m.day, lang, path: to });
      navigate(href);
      // Normally DemoUrlSync adopts the jump when its route becomes current. It can't when the router never
      // sees the location change (the frame's first page redirected, and the jump goes back to that same
      // first URL); the jump would then stay pending and undo the next persona/day/language change. So as
      // soon as the route is current (or after LAND_MS, e.g. a redirect elsewhere), apply it here.
      const start = performance.now();
      const land = () => {
        if (run !== navRun.current) return;
        const current = window.location.pathname + window.location.search === href;
        if (!current && performance.now() - start < LAND_MS) {
          window.setTimeout(land, LAND_POLL_MS);
          return;
        }
        endDraftJump();
        const j = clearPendingJump();
        if (!j) return;
        const st = useDemo.getState();
        st.setPersona(m.persona);
        st.setDay(m.day);
        st.setLang(lang);
      };
      window.setTimeout(land, LAND_POLL_MS);
    }
    window.scrollTo(0, 0);
    if (m.focus) focusWhenReady(m.focus, path);
    else focusRun.current++;
  };

  const onMessage = (m: ShowMsg) => {
    const s = useDemo.getState();
    switch (m.type) {
      case 'navigate':
        onNavigate(m);
        break;
      case 'demo':
        if (m.reset) {
          // Same as the Reset demo button; "Today vs ours" stays as the parent set it.
          resetInteractive();
          const keep = s.c2m;
          s.reset();
          s.setC2m(keep);
        }
        if (m.persona) s.setPersona(m.persona);
        if (m.day !== undefined) s.setDay(m.day);
        if (m.lang) s.setLang(m.lang);
        break;
      case 'c2m':
        s.setC2m(m.on);
        break;
      case 'highlight':
        setHighlight(m.on);
        break;
      case 'pulse': {
        const els = nodesFor(m.docId);
        if (m.focus && els[0]) reveal(els[0]);
        pulseEls(els);
        break;
      }
    }
  };
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  // ── wiring ──
  useEffect(() => {
    if (!readySent) {
      readySent = true;
      post({ rk: 'showcase', type: 'ready' });
    }
    const listen = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent || !isShowcaseMsg(e.data)) return;
      if (!SHOW_TYPES.has((e.data as { type: string }).type)) return;
      onMessageRef.current(e.data as ShowMsg);
    };
    window.addEventListener('message', listen);
    const mo = new MutationObserver((records) => {
      if (records.some((r) => !isOverlayRecord(r))) schedule();
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open', 'data-c2m-id'] });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      window.removeEventListener('message', listen);
      window.removeEventListener('resize', schedule);
      mo.disconnect();
      window.clearTimeout(timer.current);
      timer.current = 0;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(schedule, [loc.pathname, loc.search, persona, day, lang, c2m]); // eslint-disable-line react-hooks/exhaustive-deps
  // A jump's route is current: the draft pages may redirect again.
  useEffect(endDraftJump, [loc.pathname, loc.search]);

  return <HighlightOverlay on={highlight && c2m} targets={targets} pulses={pulses} />;
}
