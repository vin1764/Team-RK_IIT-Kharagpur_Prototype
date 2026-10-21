// Onboarding form controls, replicated from reference/screens/onb-*.png:
// outlined 44px fields with a floating label, the business-type dropdown, read-only detail
// lists, checkboxes, and the small "Use demo …" fill links.
import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../../components/ui';

/** Outline box + label that floats onto the border once focused or filled. */
function Outline({ label, floating, focused, error, children, className }: { label: string; floating: boolean; focused: boolean; error?: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'relative h-11 rounded border border-solid bg-secondary-bg',
        error ? 'border-error-text' : focused ? 'border-brand-primary-border' : 'border-secondary-border',
        className,
      )}
    >
      <span
        className={cx(
          'pointer-events-none absolute font-body transition-all duration-150 whitespace-nowrap',
          floating ? 'left-2 px-1 -top-[7px] bg-secondary-bg text-sm leading-[14px]' : 'left-4 px-0 top-1/2 -translate-y-1/2 text-xl leading-5',
          error ? 'text-error-text' : floating && focused ? 'text-brand-primary-text' : 'text-tertiary-text',
        )}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  error,
  helper,
  trailing,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  helper?: ReactNode;
  trailing?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <Outline label={label} floating={focused || value !== ''} focused={focused} error={!!error}>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cx('h-full w-full rounded border-0 bg-transparent pl-4 text-xl font-body text-primary-text outline-none', trailing ? 'pr-24' : 'pr-4')}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </Outline>
      {error && <p className="m-0 mt-1 text-base leading-4 font-body text-error-text">{error}</p>}
      {helper && !error && <p className="m-0 mt-[7px] text-base leading-4 font-body text-secondary-text">{helper}</p>}
    </div>
  );
}

/** "What's your business type" — the dropdown of onb-business-type-dropdown.png. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  badge,
  className,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
  /** optional tag rendered after an option (e.g. the suggested one) */
  badge?: (o: T) => ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toggle = () => {
    // Opens upward when there's no room below, as in onb-business-type-dropdown.png.
    const r = ref.current?.getBoundingClientRect();
    if (r) setUp(window.innerHeight - r.bottom < 250 && r.top > window.innerHeight - r.bottom);
    setOpen(!open);
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} className={cx('relative', className)}>
      <button type="button" onClick={toggle} className="block w-full bg-transparent border-0 p-0 text-left cursor-pointer" aria-haspopup="listbox" aria-expanded={open}>
        <Outline label={label} floating={open || value !== null} focused={open}>
          <span className="flex h-full items-center pl-4 pr-10 text-lg font-body text-primary-text">
            <span className="truncate">{value ?? ''}</span>
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className={cx('absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text', !open && 'rotate-180')}>
            <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Outline>
      </button>
      {open && (
        <ul
          role="listbox"
          className={cx(
            'absolute inset-x-0 z-modal m-0 max-h-[238px] list-none overflow-y-auto rounded border border-solid border-secondary-border bg-white p-0 shadow-[0_2px_6px_rgba(0,0,0,0.12)]',
            '[&::-webkit-scrollbar]:w-[9px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8B8B8B] [&::-webkit-scrollbar-track]:bg-white',
            up ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          {options.map((o) => (
            <li
              key={o}
              role="option"
              aria-selected={o === value}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={cx('flex cursor-pointer items-center gap-2 px-3 py-[7px] text-lg leading-[21px] font-body text-primary-text hover:bg-brand-secondary-bg', o === value && 'bg-brand-secondary-bg')}
            >
              <span className="min-w-0 flex-1">{o}</span>
              {badge?.(o)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Business Details: the green-ruled list under "Below details are linked to your …". */
export function RuledList({ rows }: { rows: { label: string; value: ReactNode; c2m?: string }[] }) {
  return (
    <dl className="m-0 mt-[11px] border-0 border-l border-solid border-success-text pl-4">
      {rows.map((r, i) => (
        <div key={r.label} data-c2m={r.c2m} data-c2m-id={r.c2m} className={cx(i > 0 && 'mt-[18px]')}>
          <dt className="text-base leading-4 font-button text-secondary-text">{r.label}</dt>
          <dd className="m-0 mt-1 text-xl leading-6 font-body text-primary-text">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Pickup Address (saved): label / value pairs, no rule. */
export function DetailList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="m-0 mt-6">
      {rows.map((r, i) => (
        <div key={r.label} className={cx(i > 0 && 'mt-5')}>
          <dt className="text-lg leading-5 font-body text-tertiary-text">{r.label}</dt>
          <dd className="m-0 mt-0.5 text-lg leading-5 font-body text-primary-text">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Checkbox({ checked, onChange, children, className }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <label className={cx('flex cursor-pointer items-center gap-[13px] text-base leading-5 font-body text-secondary-text', className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cx(
          'ml-[3px] flex size-[14px] shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-solid',
          checked ? 'border-brand-primary-bg bg-brand-primary-bg' : 'border-secondary-text bg-white',
        )}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5.2l2 2 4-4.4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </label>
  );
}

/** Prototype-only shortcut that fills a step with the persona's fake record. */
export function DemoFill({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button type="button" data-demo-fill onClick={onClick} className={cx('self-start bg-transparent border-0 p-0 cursor-pointer text-base leading-4 font-button text-brand-primary-text', className)}>
      {children}
    </button>
  );
}

/** The panel's small circular loader, for mock fetches. */
export const Spinner = ({ className }: { className?: string }) => (
  <span aria-label="Loading" className={cx('inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent', className)} />
);
