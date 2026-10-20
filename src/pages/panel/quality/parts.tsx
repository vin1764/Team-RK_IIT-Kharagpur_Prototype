// Shared bits of the Product Quality page (reference/html/meesho-quality.html).
import { useState, type ReactNode } from 'react';
import { cx } from '../../../components/ui';

/** Text button base used by every (i) icon and link on this page. */
export const TEXT_BTN =
  'gap-1 rounded-sm font-button border-none cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:touch-none active:scale-90 bg-transparent text-brand-primary-bg disabled:bg-transparent disabled:text-tertiary-text text-lg active:!scale-100';

/**
 * The page's (i) icon. The live tooltip copy wasn't captured, so `text` is short neutral
 * copy that restates what the page already shows.
 */
export function InfoIcon({ label, text, btnClass, size = 16 }: { label: string; text: ReactNode; btnClass: string; size?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label={label} className={cx(TEXT_BTN, btnClass)} onClick={() => setOpen((o) => !o)}>
        <img src="/brand/msa/merlin/lined/info-grey.svg" alt="" width={size} height={size} style={{ width: size, height: size }} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full -translate-x-1/2 z-tooltip mt-1 w-max max-w-64 rounded-lg bg-tooltip-bg px-2 py-1 text-base leading-4 text-brand-foreground-text font-body font-normal text-left whitespace-normal shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] animate-fade-in after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-solid after:border-t-0 after:border-b-tooltip-bg after:border-x-transparent"
        >
          {text}
        </span>
      )}
    </div>
  );
}
