// "Introducing Mega Combo Offer" — the NEW popover that points at the Deals tab on first load
// (reference/html/meesho-promotions.html, role="tooltip"). Fixed-positioned beside its anchor,
// as the panel does: left = anchor's right edge, vertically centred, then translate(1.25rem, -10%).
import { useLayoutEffect, useState, type RefObject } from 'react';
import { NewTag } from './PromoParts';

// "First load": once dismissed it stays dismissed until the page is reloaded.
let dismissed = false;

export function MegaComboPopover({ anchor }: { anchor: RefObject<HTMLElement | null> }) {
  const [open, setOpen] = useState(!dismissed);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    // Follow the anchor every frame: scrolling, fonts/images loading and banners
    // above it (e-signature) all move the Deals tab.
    let raf = 0;
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (r) {
        const top = r.top + r.height / 2;
        const left = r.right;
        setPos((p) => (p && p.top === top && p.left === left ? p : { top, left }));
      }
      raf = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(raf);
  }, [open, anchor]);

  if (!open || !pos) return null;
  const close = () => {
    dismissed = true;
    setOpen(false);
  };

  return (
    <div
      role="tooltip"
      data-open="true"
      className="fixed box-border z-tooltip font-default text-body-small leading-4 animate-fade-in overflow-visible rounded-3xl bg-neutral-base p-0 text-neutral-primary shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] min-w-84 max-w-84"
      style={{ top: pos.top, left: pos.left, transform: 'translate(1.25rem, -10%)' }}
    >
      <div className="relative">
        <div className="absolute -left-2.5 top-12 h-0 w-0 border-y-[12px] border-r-[12px] border-y-transparent border-r-transparent" />
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <NewTag />
              <h3 className="m-0 p-0 text-neutral-primary text-heading-small leading-6 font-bold mt-1 mb-2">Introducing Mega Combo Offer</h3>
            </div>
            <button
              className="inline-flex items-center justify-center gap-1 rounded-6 font-medium font-default border-none cursor-pointer transition-all duration-200 ease-in-out bg-transparent text-brand-primary outline-transparent hover:bg-brand-light text-body-small size-6 p-0"
              type="button"
              aria-label="Close"
              onClick={close}
            >
              <img src="/brand/msa/merlin/lined/cross-grey.svg" alt="" width="24" height="24" className="size-6" />
            </button>
          </div>
          <div className="py-1">
            <img src="/brand/mimg/images/marketing/1758784976990.webp" alt="banner" className="block object-cover shrink-0" style={{ width: 180, height: 180 }} />
          </div>
          <div>
            <p className="m-0 p-0 text-body-small leading-4 max-md:leading-5 font-regular mt-2 text-neutral-secondary">
              Enjoy <span className="inline-block">top visibility</span> for your products in the app with Mega Combo Offer
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-1 rounded-6 font-medium font-default cursor-pointer transition-all duration-200 ease-in-out bg-transparent text-brand-primary border border-solid border-brand-base outline-transparent hover:bg-brand-light active:outline-offset-2 active:outline-2 active:outline-brand-disabled text-body-medium mt-4 h-8 px-7"
            type="button"
            onClick={close}
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}
