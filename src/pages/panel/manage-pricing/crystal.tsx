// "Crystal" widgets used by the services/insights micro-frontends (Manage Pricing, Reduce RTO,
// Inventory, Business Dashboard). Class strings are ported from reference/html; the panel's
// tracking-free / -breathable / -relaxed tokens (-0.1 / -0.2 / -0.5px) are written as arbitrary
// values because src/styles/tokens.css doesn't define --tracking-*.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../../components/ui';

/** Crystal <Text> variants, as rendered in the snapshots. */
export const T = {
  bodyXs: 'm-0 p-0 text-body-xsmall leading-4 md:tracking-[-0.1px] font-regular',
  bodySm: 'm-0 p-0 text-body-small leading-4 md:tracking-[-0.1px] max-md:leading-5 font-regular',
  bodyMd: 'm-0 p-0 text-body-medium leading-5 md:tracking-[-0.1px] font-regular',
  bodyLg: 'm-0 p-0 text-body-large leading-6 md:tracking-[-0.1px] font-regular',
  h1: 'm-0 p-0 text-neutral-primary text-heading-large leading-8 font-bold md:tracking-[-0.1px] max-md:text-heading-medium max-md:leading-7',
  h2: 'm-0 p-0 text-neutral-primary text-heading-medium leading-7 font-bold md:tracking-[-0.1px] max-md:text-heading-small max-md:leading-6',
  h3: 'm-0 p-0 text-neutral-primary text-heading-small leading-6 font-bold md:tracking-[-0.1px]',
};

/** Page wrapper: the services/insights apps set DM Sans + neutral-700 on <body>. */
export function CrystalPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('font-default text-neutral-primary tracking-[-0.1px]', className)}>{children}</div>;
}

/** Outlined search field (Manage Pricing / Reduce RTO header). */
export function SearchBox({ placeholder, className }: { placeholder: string; className?: string }) {
  const [q, setQ] = useState('');
  return (
    <div className={cx('relative', className)}>
      <div className="flex flex-col min-w-75 gap-px">
        <div className="group text-body-xsmall leading-4 md:tracking-[-0.1px] flex relative font-normal items-center box-border w-full p-0 m-0 text-neutral-primary border border-solid border-neutral-light rounded-sm transition-[border-color] duration-200 ease-in-out focus-within:border-brand-base hover:border-brand-base min-w-75 gap-px">
          <img src="/brand/msa/merlin/lined/search-light-grey.svg" alt="search" width="17" height="17" className="mx-3" />
          <input
            className="peer flex-1 bg-transparent border-none md:tracking-[-0.1px] [font-family:inherit] transition-all duration-200 ease-in-out rounded-sm outline-none z-1 focus:z-1 px-0 min-h-9 placeholder:text-neutral-tertiary text-neutral-primary text-body-small leading-4"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}

/** Closes a popover on outside click. */
export function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, close]);
  return ref;
}

/**
 * Dropdown button + menu. The button is the captured markup; the menu wasn't captured,
 * so it uses the panel's white popover (border neutral-light, the tooltip shadow).
 */
export function Dropdown({
  value,
  options,
  onChange,
  buttonClass,
  chevron = 20,
  wrapLabel,
  align = 'left',
  note,
  chevronSrc = '/brand/msa/merlin/lined/chevron-up-grey.svg',
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  buttonClass: string;
  chevron?: number;
  wrapLabel?: (label: string) => ReactNode;
  align?: 'left' | 'right';
  note?: ReactNode;
  chevronSrc?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(open, () => setOpen(false));
  const chev = (
    <img
      src={chevronSrc}
      alt="chevron-down"
      width={chevron}
      height={chevron}
      className={cx('transition-[transform_0.2s_ease-in-out] origin-center', !open && 'rotate-180')}
    />
  );
  return (
    <div className="relative inline-block" ref={ref}>
      <button className={buttonClass} type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        {wrapLabel ? (
          <div className="flex items-center gap-1">
            {wrapLabel(value)}
            {chev}
          </div>
        ) : (
          <>
            {value}
            {chev}
          </>
        )}
      </button>
      {open && (
        <ul
          role="listbox"
          className={cx(
            'absolute top-full z-20 mt-1 min-w-full list-none m-0 p-0 py-1 bg-neutral-base rounded-6 border border-solid border-neutral-light shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((o) => (
            <li
              key={o}
              role="option"
              aria-selected={o === value}
              className={cx(
                'px-3 py-2 text-body-small leading-4 whitespace-nowrap cursor-pointer hover:bg-brand-light',
                o === value ? 'text-brand-primary font-medium' : 'text-neutral-primary',
              )}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              {o}
            </li>
          ))}
          {note && <li className="px-3 py-2 text-body-xsmall leading-4 text-neutral-tertiary whitespace-nowrap">{note}</li>}
        </ul>
      )}
    </div>
  );
}

/** Crystal (i) tooltip: dark bubble below the icon (classes from the Inventory coach-mark). */
export function CrystalTip({ icon = 'grey', text }: { icon?: 'grey' | 'blue'; text: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <img src={`/brand/msa/merlin/lined/info-${icon}.svg`} alt="" width="16" height="16" className="block" />
      {open && (
        <span
          role="tooltip"
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-tooltip w-max max-w-60 py-1 px-2 text-body-small leading-4 md:tracking-[-0.1px] font-regular text-left whitespace-normal rounded-lg text-brand-inverse shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] animate-fade-in bg-neutral-dark after:content-[''] after:absolute after:w-0 after:h-0 after:border-solid after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-t-0 after:border-b-(--neutral-900) after:border-x-transparent"
        >
          {text}
        </span>
      )}
    </div>
  );
}

/** Centred empty state with the UFO illustration (Manage Pricing, Reduce RTO). */
export function UfoEmpty({ title, text, heading = 'h1', testId }: { title: string; text: string; heading?: 'h1' | 'h2'; testId?: string }) {
  const H = heading;
  return (
    <div className="flex flex-col justify-center items-center h-125" data-testid={testId}>
      <img alt="empty-state-ufo" src="/brand/msa/public/empty-state-ufo.svg" />
      <H className={cx(heading === 'h1' ? T.h1 : T.h2, 'mt-4')}>{title}</H>
      <p className={cx(T.bodyLg, 'max-w-120 text-center text-neutral-secondary')}>{text}</p>
    </div>
  );
}
