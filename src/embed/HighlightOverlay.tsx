// Showcase frame: "Highlight changes". A fixed layer over the page (pointer-events: none) that outlines every
// visible C2M addition with a dashed brand-indigo box and its badge number, and plays the hover pulse.
// It only reads the elements' boxes (every frame, so scroll, resize and layout shifts are followed); it never
// touches their styles or layout. The layer is clipped below the concept strip and sits under it (z-index).
// An outline whose element is wholly covered by another layer (a modal's backdrop, a popover) is hidden.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OVERLAY_ATTR, type C2mTarget } from './scan';

export interface Pulse {
  key: number;
  el: HTMLElement;
}

/** Above modals (1300) and toasts (1400) so outlines inside a modal show; below the concept strip (1500). */
const Z = 1450;
const PULSE_MS = 1200;
export const PULSE_DURATION = PULSE_MS;

const CSS = `
@keyframes rk-embed-pulse {
  0% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--brand-primary-bg) 60%, transparent); }
  70% { opacity: 1; box-shadow: 0 0 0 14px color-mix(in srgb, var(--brand-primary-bg) 0%, transparent); }
  100% { opacity: 0; box-shadow: 0 0 0 14px color-mix(in srgb, var(--brand-primary-bg) 0%, transparent); }
}`;

/** Occlusion and clipping containers are re-checked every this many frames (cheap, but not free on a 50-target page). */
const COVER_EVERY = 6;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The ancestors that clip `el` (overflow other than visible, e.g. a horizontally scrolling price table), up to
 * the first fixed layer; html and body are left out (the page itself scrolls).
 */
function clipsOf(el: HTMLElement): Element[] {
  const out: Element[] = [];
  for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') out.push(n);
    if (cs.position === 'fixed') break;
  }
  return out;
}

/** `el`'s box cut to what its clipping ancestors let through (an outline never strays outside a scroll box). */
function shownBox(el: HTMLElement, clips: Element[]): Box {
  const r = el.getBoundingClientRect();
  const b = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  for (const c of clips) {
    const cr = c.getBoundingClientRect();
    b.left = Math.max(b.left, cr.left);
    b.top = Math.max(b.top, cr.top);
    b.right = Math.min(b.right, cr.right);
    b.bottom = Math.min(b.bottom, cr.bottom);
  }
  return b;
}

/**
 * True when something else is drawn over the whole visible part of `el` (a modal's backdrop, a popover):
 * its outline would then sit on top of that layer, pointing at nothing the viewer can see.
 * Samples a 3×3 grid of the on-screen part below the concept strip; any point where `el` shows counts as visible.
 */
function covered(el: HTMLElement, b: Box, stripH: number): boolean {
  const top = Math.max(b.top, stripH);
  const bottom = Math.min(b.bottom, window.innerHeight);
  const left = Math.max(b.left, 0);
  const right = Math.min(b.right, window.innerWidth);
  if (bottom - top < 1 || right - left < 1) return false;
  const xs = [left + 1, (left + right) / 2, right - 1];
  const ys = [top + 1, (top + bottom) / 2, bottom - 1];
  for (const x of xs)
    for (const y of ys) {
      const hit = document.elementFromPoint(x, y);
      if (!hit || shows(el, hit)) return false;
    }
  return true;
}

/** `hit` is `el` itself showing: inside it (but not in a fixed layer rendered inside it, e.g. a modal), or an ancestor. */
function shows(el: HTMLElement, hit: Element): boolean {
  if (hit.contains(el)) return true;
  if (!el.contains(hit)) return false;
  for (let n: Element | null = hit; n && n !== el; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return false;
  return true;
}

function place(node: HTMLElement | null, el: HTMLElement, pad: number, hide = false, clips: Element[] = []) {
  if (!node) return;
  const r = shownBox(el, clips);
  const width = r.right - r.left;
  const height = r.bottom - r.top;
  const hidden = hide || width <= 0 || height <= 0;
  const s = node.style;
  const v = hidden ? 'hidden' : 'visible';
  if (s.visibility !== v) s.visibility = v;
  if (hidden) return;
  const t = `translate(${r.left - pad}px, ${r.top - pad}px)`;
  if (s.transform !== t) s.transform = t;
  const w = `${width + pad * 2}px`;
  const h = `${height + pad * 2}px`;
  if (s.width !== w) s.width = w;
  if (s.height !== h) s.height = h;
}

export function HighlightOverlay({ on, targets, pulses }: { on: boolean; targets: C2mTarget[]; pulses: Pulse[] }) {
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const rings = useRef<(HTMLDivElement | null)[]>([]);
  const live = useRef({ on, targets, pulses });
  live.current = { on, targets, pulses };
  const active = on || pulses.length > 0;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let frame = 0;
    let hide: boolean[] = [];
    let clips: Element[][] = [];
    let seen: C2mTarget[] = [];
    const tick = () => {
      const { on: o, targets: ts, pulses: ps } = live.current;
      if (o) {
        if (frame++ % COVER_EVERY === 0 || seen !== ts) {
          seen = ts;
          const stripH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--concept-strip-h')) || 0;
          clips = ts.map((t) => clipsOf(t.el));
          hide = ts.map((t, i) => covered(t.el, shownBox(t.el, clips[i]!), stripH));
        }
        ts.forEach((t, i) => place(boxes.current[i] ?? null, t.el, 2, hide[i], clips[i]));
      }
      ps.forEach((p, i) => place(rings.current[i] ?? null, p.el, 3));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;
  return createPortal(
    <div
      {...{ [OVERLAY_ATTR]: '' }}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z,
        pointerEvents: 'none',
        overflow: 'hidden',
        clipPath: 'inset(var(--concept-strip-h) 0 0 0)',
      }}
    >
      <style>{CSS}</style>
      {on &&
        targets.map((t, i) => (
          <div
            key={`${t.docId}-${i}`}
            ref={(n) => {
              boxes.current[i] = n;
            }}
            data-embed-box={t.docId}
            style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', boxSizing: 'border-box', border: '2px dashed var(--brand-primary-bg)', borderRadius: 4 }}
          >
            <span
              data-embed-badge={t.n}
              style={{
                position: 'absolute',
                left: -2,
                top: -2,
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                boxSizing: 'border-box',
                borderRadius: 9,
                background: 'var(--brand-primary-bg)',
                color: 'var(--brand-foreground-text)',
                font: '700 11px/18px var(--font-sans)',
                textAlign: 'center',
              }}
            >
              {t.n}
            </span>
          </div>
        ))}
      {pulses.map((p, i) => (
        <div
          key={p.key}
          ref={(n) => {
            rings.current[i] = n;
          }}
          data-embed-pulse
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            visibility: 'hidden',
            boxSizing: 'border-box',
            border: '3px solid var(--brand-primary-bg)',
            borderRadius: 6,
            animation: `rk-embed-pulse ${PULSE_MS}ms ease-out forwards`,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}
