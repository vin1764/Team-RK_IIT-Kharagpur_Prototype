import { useState } from 'react';
import { cx } from '../../../components/ui';
import { T } from '../manage-pricing/crystal';

/**
 * The live panel's first-visit coach-mark under the Active tab ("Find all your live catalogs
 * here · GOT IT"). Ported from the floating tooltip in reference/html/meesho-inventory.html;
 * dismissed by the cross or GOT IT (per visit; the panel's own persistence wasn't captured).
 */
export function CoachMark({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      role="tooltip"
      className={cx(
        "absolute box-border z-tooltip w-max max-w-60 py-1 px-2 text-body-small leading-4 rounded-lg text-brand-inverse shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] animate-fade-in bg-neutral-dark after:content-[''] after:absolute after:w-0 after:h-0 after:border-solid after:bottom-full after:left-3 after:border-[6px] after:border-t-0 after:border-b-(--neutral-900) after:border-x-transparent after:border-t-transparent",
        className,
      )}
    >
      <div className="flex flex-col">
        <div className="flex items-start">
          <p className={cx(T.bodySm, 'text-brand-inverse text-wrap text-left')}>{text}</p>
          <div className="cursor-pointer ml-1" onClick={() => setOpen(false)} role="button" aria-label="Close">
            <img src="/brand/msa/merlin/lined/cross-white.svg" alt="" width="16" height="16" className="block" />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-1 rounded-6 font-[500] font-default border-none cursor-pointer bg-transparent text-brand-inverse h-8 p-0 text-body-xsmall"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
