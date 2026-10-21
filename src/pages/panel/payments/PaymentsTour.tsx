// The Merlin guided-tour coach-mark the live Payments page opens on first visit
// (reference/html/meesho-payments.html, "Tour step 1 of 3"): a dimmed overlay with an 8px-padded
// spotlight around the target and a 320px card 16px to its right, vertically centred.
// Steps 2–3 weren't captured, so both Skip and Next dismiss the tour.
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Button } from '../../../components/ui';

const PAD = 8;
const GAP = 16;

export function PaymentsTour({ target, onDone }: { target: RefObject<HTMLElement | null>; onDone: () => void }) {
  const card = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardH, setCardH] = useState(120);

  // Follow the target every frame: it moves on scroll, resize and when content above it
  // changes height. State only updates when something moved.
  useLayoutEffect(() => {
    let raf = 0;
    const measure = () => {
      const r = target.current?.getBoundingClientRect();
      if (r) setRect((prev) => (prev && prev.x === r.x && prev.y === r.y && prev.width === r.width && prev.height === r.height ? prev : r));
      if (card.current) setCardH(card.current.offsetHeight);
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [target]);

  if (!rect) return null;
  const spot = { x: rect.left - PAD, y: rect.top - PAD, w: rect.width + 2 * PAD, h: rect.height + 2 * PAD };

  return (
    <>
      <div className="fixed inset-0 z-modal pointer-events-auto" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="merlin-guided-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={spot.x} y={spot.y} width={spot.w} height={spot.h} rx="6" ry="6" fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="var(--overlay-bg)" mask="url(#merlin-guided-tour-mask)" />
        </svg>
      </div>
      <div
        ref={card}
        className="fixed z-tooltip bg-primary-bg rounded-xl shadow-md p-4 w-80 max-w-[90vw] [transition:top_0.35s_ease,left_0.35s_ease] animate-fade-in outline-none"
        role="dialog"
        aria-modal="false"
        aria-label="Tour step 1 of 3"
        tabIndex={-1}
        style={{ top: spot.y + spot.h / 2 - cardH / 2, left: spot.x + spot.w + GAP }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            top: '50%',
            left: '-10px',
            transform: 'translateY(-50%)',
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderRight: '10px solid var(--primary-bg)',
          }}
        />
        <div className="text-xl font-semibold text-primary-text mb-1">
          <h5 className="m-0 p-0 text-primary-text text-lg leading-5 font-semibold font-button">Introducing a quick view of your upcoming 3 payments</h5>
        </div>
        <div className="text-lg text-secondary-text mb-4" />
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onDone}>
              Skip
            </Button>
            <Button size="sm" onClick={onDone}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
