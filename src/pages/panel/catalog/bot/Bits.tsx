// Small pieces of the short bot screens, built from the panel's own tokens and FormBits inputs:
// white step card, question row, number box with ₹ / unit affix, Yes/No segmented toggle, chips, pencil icon.
import type { ReactNode } from 'react';
import { cx } from '../../../../components/ui';
import { borderFor, Info, INPUT_BOX } from '../FormBits';

/** White panel card with an optional 15px title (Card / "Add Product Details" look). */
export function StepCard({ title, right, className, children, c2m, testId }: { title?: ReactNode; right?: ReactNode; className?: string; children: ReactNode; c2m: string; testId?: string }) {
  return (
    <section className={cx('mt-2.5 rounded bg-white p-5', className)} data-c2m={c2m} data-c2m-id={c2m} data-testid={testId}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="m-0 font-button text-xl leading-5 text-primary-text">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/** One question row. `label` above the controls; several fields in one row sit side by side. */
export function QRow({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-0 border-t border-solid border-tertiary-border py-4 first:border-t-0 first:pt-0 last:pb-0" data-testid={testId} data-maker-row>
      {children}
    </div>
  );
}

export function QField({ label, info, className, children }: { label: ReactNode; info?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="mb-2 flex items-center gap-1 font-body text-lg leading-5 text-secondary-text">
        {label}
        {info && <Info text={info} />}
      </div>
      {children}
    </div>
  );
}

/** Number input with an optional "₹" prefix and/or unit suffix inside the box. */
export function NumberBox({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  width = 'w-24',
  testId,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  width?: string;
  testId?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cx('relative shrink-0', width)}>
      {prefix && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-body text-xl text-secondary-text">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        data-testid={testId}
        onChange={(e) => onChange(e.target.value)}
        className={cx(INPUT_BOX, borderFor(false), 'h-10', prefix ? 'pl-7' : 'pl-3', suffix ? 'pr-12' : 'pr-3')}
      />
      {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-body text-lg text-secondary-text">{suffix}</span>}
    </div>
  );
}

/** Choice button: Yes/No segments and add-on chips. Selected = lavender with the brand border. */
export function Choice({ on, onClick, children, round = false, testId }: { on: boolean; onClick: () => void; children: ReactNode; round?: boolean; testId?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      data-testid={testId}
      className={cx(
        'inline-flex h-10 min-w-16 cursor-pointer items-center justify-center gap-1.5 border border-solid px-4 font-body text-xl transition-all',
        round ? 'rounded-full' : 'rounded-sm',
        on ? 'border-brand-primary-border bg-brand-secondary-bg text-brand-primary-text' : 'border-[rgb(196,196,196)] bg-white text-primary-text',
      )}
    >
      {on && round && (
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2.5 6.2l2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function Pencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20h4L18.5 9.5a2.12 2.12 0 00-3-3L5 17v3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.5 8.5l3 3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export const GREEN_CHECK = '/brand/msa/merlin/filled/success-green.svg';

/** Text link in the panel's indigo (Button variant="text" without the height). */
export function LinkButton({ onClick, children, className, testId }: { onClick: () => void; children: ReactNode; className?: string; testId?: string }) {
  return (
    <button type="button" onClick={onClick} data-testid={testId} className={cx('cursor-pointer border-0 bg-transparent p-0 font-button text-lg leading-5 text-brand-primary-text', className)}>
      {children}
    </button>
  );
}
