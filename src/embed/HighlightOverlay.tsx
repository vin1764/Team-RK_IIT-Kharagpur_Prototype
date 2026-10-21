// Showcase frame: "Highlight changes". A fixed layer over the page (pointer-events: none) that outlines every
// visible C2M addition with a dashed brand-indigo box and its badge number, and plays the hover pulse.
// It only reads the elements' boxes (every frame, so scroll, resize and layout shifts are followed); it never
// touches their styles or layout. The layer is clipped below the concept strip and sits under it (z-index).
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

function place(node: HTMLElement | null, el: HTMLElement, pad: number) {
  if (!node) return;
  const r = el.getBoundingClientRect();
  const hidden = r.width === 0 && r.height === 0;
  const s = node.style;
  const v = hidden ? 'hidden' : 'visible';
  if (s.visibility !== v) s.visibility = v;
  const t = `translate(${r.left - pad}px, ${r.top - pad}px)`;
  if (s.transform !== t) s.transform = t;
  const w = `${r.width + pad * 2}px`;
  const h = `${r.height + pad * 2}px`;
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
    const tick = () => {
      const { on: o, targets: ts, pulses: ps } = live.current;
      if (o) ts.forEach((t, i) => place(boxes.current[i] ?? null, t.el, 2));
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
