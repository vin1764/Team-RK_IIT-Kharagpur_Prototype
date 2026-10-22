// The right-side panel frame of the growth-loop plans (GL-2 "Plan this batch", GL-6 "Plan a lot"): the Pack Point
// drawer's frame (src/pages/onboarding/packpoint/PackPointDrawer.tsx) with Inventory's crystal type. Overlay below
// the concept strip, header with title and close, a scrolling body, a footer row of buttons. Esc closes; Tab stays
// inside; focus returns to the opener on close; the page behind doesn't scroll. Plus the rows, value lines and date
// field the plan panels share.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../../components/ui';
import { formatDate } from '../../../engine/ui';
import { T } from '../manage-pricing/crystal';

export const BOX = 'flex items-center h-8 rounded-sm border border-solid border-neutral-light focus-within:border-brand-base px-2 gap-1 bg-neutral-base';
export const INPUT = 'w-full border-none outline-none bg-transparent text-body-medium leading-5 text-neutral-primary [font-family:inherit]';

type DataAttrs = Record<`data-${string}`, string | boolean | undefined>;

export function SidePanel({
  title,
  closeLabel,
  onClose,
  c2m,
  rootAttrs,
  panelAttrs,
  overlayAttrs,
  footer,
  children,
}: {
  title: ReactNode;
  closeLabel: string;
  onClose: () => void;
  /** doc ID written to data-c2m / data-c2m-id */
  c2m: string;
  rootAttrs?: DataAttrs;
  panelAttrs?: DataAttrs;
  overlayAttrs?: DataAttrs;
  footer: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  // The latest onClose, so a new callback identity (the URL changing behind the panel) doesn't re-run the effect below.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'));
      if (f.length === 0) return;
      const first = f[0]!;
      const last = f[f.length - 1]!;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-modal font-default text-neutral-primary tracking-[-0.1px]" style={{ top: 'var(--concept-strip-h)' }} {...rootAttrs}>
      <div className="absolute inset-0 bg-overlay-bg" onClick={onClose} {...overlayAttrs} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-c2m={c2m}
        data-c2m-id={c2m}
        {...panelAttrs}
        className="absolute top-0 right-0 bottom-0 flex w-[30rem] max-w-full flex-col bg-neutral-base outline-none animate-fade-in"
      >
        <div className="flex items-center justify-between gap-3 border-0 border-b border-solid border-neutral-light px-5 py-4">
          <h3 id={titleId} className={T.h3}>
            {title}
          </h3>
          <button type="button" aria-label={closeLabel} onClick={onClose} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent p-0">
            <img src="/brand/msa/merlin/lined/cross-grey.svg" alt="" width="24" height="24" className="size-6" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <div className="flex justify-end gap-3 border-0 border-t border-solid border-neutral-light px-5 py-4">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Row({ label, children, c }: { label: ReactNode; children: ReactNode; c?: string }) {
  return (
    <section className={cx('border-0 border-b border-solid border-neutral-light px-5 py-4 last:border-b-0', c)}>
      <div className={cx(T.bodySm, 'text-neutral-secondary flex items-center gap-1')}>{label}</div>
      <div className="mt-2 flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

export function Value({ children, sub, testId, attr = 'data-plan-value' }: { children: ReactNode; sub?: ReactNode; testId: string; attr?: `data-${string}` }) {
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <h3 className={T.h3} {...{ [attr]: testId }}>
        {children}
      </h3>
      {sub && <p className={cx(T.bodySm, 'text-neutral-secondary')}>{sub}</p>}
    </div>
  );
}

/** The panel's date field: shows "21 Nov 2026"; the browser's own picker sits under it (as on the notice board). */
export function DateField({ id, value, min, max, onChange, attr = 'data-plan-start' }: { id: string; value: string; min: string; max: string; onChange: (iso: string) => void; attr?: `data-${string}` }) {
  const native = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = native.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };
  return (
    <div className="relative w-44">
      <input
        ref={native}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        min={min}
        max={max}
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        {...{ [`${attr}-native`]: true }}
        className="absolute left-0 bottom-0 w-full h-px opacity-0 pointer-events-none"
      />
      <div className={cx(BOX, 'cursor-pointer')} onClick={open}>
        <input
          id={id}
          readOnly
          aria-haspopup="dialog"
          value={formatDate(value)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
          className={cx(INPUT, 'cursor-pointer')}
          {...{ [attr]: true }}
        />
        <img src="/brand/msa/merlin/lined/calendar.svg" alt="" width="16" height="16" className="size-4 shrink-0" />
      </div>
    </div>
  );
}
