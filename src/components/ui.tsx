// Panel primitives. Class strings are copied from the live panel (reference/html) so a
// C2M insert built from these is indistinguishable from the page around it.
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

// ── Button ──────────────────────────────────────────────────────────────────
const BTN_BASE =
  'inline-flex items-center justify-center gap-1 rounded-sm font-button cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:touch-none active:scale-90';
const BTN_VARIANT = {
  primary: 'border-none disabled:bg-tertiary-text bg-brand-primary-bg text-brand-foreground-text',
  outline:
    'bg-transparent text-brand-primary-bg border border-solid border-brand-primary-bg disabled:bg-transparent disabled:text-tertiary-text disabled:border disabled:border-solid disabled:border-tertiary-text',
  text: 'border-none bg-transparent text-brand-primary-bg disabled:bg-transparent disabled:text-tertiary-text',
};
const BTN_SIZE = { md: 'h-9 px-4 text-xl', sm: 'h-8 px-3 text-lg' };

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BTN_VARIANT; size?: keyof typeof BTN_SIZE }) {
  return <button type={type} className={cx(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...rest} />;
}

// ── Pill ────────────────────────────────────────────────────────────────────
const PILL_TONE = {
  success: 'bg-success-bg text-success-text border-success-border',
  error: 'bg-error-bg text-error-text border-error-border',
  warning: 'bg-warning-bg text-warning-text border-warning-border',
  info: 'bg-info-bg text-primary-text border-info-border',
  brand: 'bg-brand-secondary-bg text-brand-primary-text border-brand-secondary-border',
};
/** "Expert Led", "QC Error", "QC in progress"… DM Sans 11px, fully rounded, no border by default. */
export function Pill({ tone = 'success', bordered = false, className, children }: { tone?: keyof typeof PILL_TONE; bordered?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center justify-center rounded-full gap-1 border py-0.5 px-2 text-sm font-default', PILL_TONE[tone], bordered ? 'border-solid' : 'border-none', className)}>
      {children}
    </span>
  );
}

// ── Banner ──────────────────────────────────────────────────────────────────
const BANNER = {
  info: { box: 'bg-info-bg border-info-border', icon: '/brand/local/info-yellow.svg' },
  success: { box: 'bg-success-bg border-success-border', icon: '/brand/msa/merlin/filled/success-green.svg' },
  warning: { box: 'bg-warning-bg border-warning-border', icon: '/brand/msa/merlin/filled/alert-warning.svg' },
  error: { box: 'bg-error-bg border-error-border', icon: '/brand/msa/merlin/filled/alert-red.svg' },
};
/** Yellow info / green success / orange warning / red error strip with a leading icon. */
export function Banner({ tone = 'info', icon, className, children, action }: { tone?: keyof typeof BANNER; icon?: string; className?: string; children: ReactNode; action?: ReactNode }) {
  const t = BANNER[tone];
  return (
    <div className={cx('flex items-center gap-2.5 rounded-lg border border-solid px-3 py-2.5', t.box, className)}>
      <img src={icon ?? t.icon} alt="" width="20" height="20" className="size-5 shrink-0" />
      <div className="flex-1 text-lg leading-5 text-primary-text font-body">{children}</div>
      {action}
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
/** White card, radius 4px, padding 16px (right-rail cards on Home). */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded bg-white p-4', className)}>{children}</div>;
}

// ── InfoTip: the panel's (i) icon with a dark tooltip ───────────────────────
export function InfoTip({ text, className }: { text: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={cx('relative inline-flex align-middle', className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <img src="/brand/msa/merlin/lined/info-grey.svg" alt="info" width="16" height="16" className="size-4 cursor-pointer" />
      {open && (
        <span className="absolute left-1/2 top-full -translate-x-1/2 z-tooltip mt-2 w-max max-w-64 rounded-lg bg-tooltip-bg px-2 py-1 text-base leading-4 text-brand-foreground-text font-body shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] animate-fade-in after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-solid after:border-t-0 after:border-b-tooltip-bg after:border-x-transparent">
          {text}
        </span>
      )}
    </span>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, width = 'w-[45rem]' }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-modal pointer-events-auto flex items-center justify-center">
      <div className="absolute inset-0 bg-overlay-bg" onClick={onClose} />
      <div className={cx('relative max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] flex flex-col rounded-lg bg-white animate-fade-in', width)}>
        {title && <div className="px-5 py-4 border-0 border-b border-solid border-tertiary-border text-xl font-button text-primary-text">{title}</div>}
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 px-5 py-4 border-0 border-t border-solid border-tertiary-border">{footer}</div>}
      </div>
    </div>
  );
}

// ── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ img, title, children, className }: { img: string; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-col items-center justify-center text-center py-10', className)}>
      <img src={img} alt="" className="mb-3 max-w-40" />
      <p className="m-0 p-0 font-heading text-xl leading-5 text-primary-text">{title}</p>
      {children && <p className="m-0 mt-1 p-0 font-body text-base leading-4 text-secondary-text">{children}</p>}
    </div>
  );
}

export { cx };
