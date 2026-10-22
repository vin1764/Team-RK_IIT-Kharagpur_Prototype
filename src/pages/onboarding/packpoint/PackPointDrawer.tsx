// FO-8 / PP-10 · "See details & rate cards": right-side drawer behind the generic Pack Point option.
// Seller view: how it works, "Pack Points near you" (sorted by distance, each open one with his fee and
// "Use this Pack Point", opening ones with "Join waitlist"), the providers serving his pincode with their rate
// cards, and self-ship vs Pack Point in words. No cluster economics (fee by size, opening rule, fee build-up,
// sign-ups): those are Meesho's view, shown only in the showcase sidebar. Every number comes from seed JSON
// (packPointNodes, packPointProviders, packPointLot) or the engine (packPointFee, packPointsNear).
//
// Context-aware: what "Use this Pack Point" does depends on where the drawer was opened.
//   'onboarding' (Pickup Address): picks the Pack Point option on that step with this node, closes the drawer.
//   'price'      (bot Price screen): this product ships through this node; the caller recalculates the price.
//   'warehouse'  (Warehouse card): the caller opens its confirm panel in place.
// The footer has a plain Close; "Switch back to self-ship" shows beside the node he is on when onSwitchBack is given.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, cx } from '../../../components/ui';
import providersData from '../../../data/packPointProviders.json';
import { C2M } from '../stepper/copy';
import { NearList } from './NearList';
import { packPointStatus, type PackPointNode } from './status';

export type { PackPointNode } from './status';

interface Provider {
  name: string;
  services: string[];
  ratePerOrder: number | null;
}
const PROVIDERS = providersData.providers as Provider[];
const SHIP_WITHIN_HOURS = providersData.howItWorks.shipWithinHours;

const H = 'm-0 text-xl leading-5 font-button text-primary-text';
const BODY = 'm-0 text-lg leading-5 font-body text-primary-text';
const TH = 'border border-solid border-tertiary-border bg-tertiary-bg px-3 py-2.5 text-left text-sm leading-4 font-button font-semibold text-primary-text';
const TD = 'border border-solid border-tertiary-border px-3 py-2.5 text-lg leading-5 font-body text-primary-text align-top';

function Section({ title, children, c2m }: { title: string; children: ReactNode; c2m?: 'PP-10' }) {
  return (
    <section className="border-0 border-b border-solid border-tertiary-border px-5 py-4 last:border-b-0" data-c2m={c2m} data-c2m-id={c2m}>
      <h4 className={H}>{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export type PackPointDrawerContext = 'onboarding' | 'price' | 'warehouse';

export interface PackPointDrawerProps {
  open: boolean;
  onClose: () => void;
  /** the maker's pickup pincode: the list is sorted by distance from it */
  pincode: string;
  /** where the drawer was opened (default 'onboarding'; 'price' when only the legacy onChoose is passed) */
  context?: PackPointDrawerContext;
  /** "Use this Pack Point" on an open node. The drawer closes itself first. No buttons without it (or onChoose). */
  onUse?: (node: PackPointNode) => void;
  /** "Switch back to self-ship", beside the node he is on (`current`). The drawer closes itself first. */
  onSwitchBack?: () => void;
  /** also called on "Join waitlist" (the drawer stores the waitlist per persona + node itself) */
  onWaitlist?: (node: PackPointNode) => void;
  /** the Pack Point he is on now, by city (shows "You're on this Pack Point" instead of the button) */
  current?: string | null;
  /** @deprecated legacy alias (bot Price screen): mapped to onUse for the node(s) the caller allows. */
  onChoose?: () => void;
}

export function PackPointDrawer({ open, onClose, pincode, context, onUse, onSwitchBack, onWaitlist, current, onChoose }: PackPointDrawerProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const own = packPointStatus(pincode);
  const ctx: PackPointDrawerContext = context ?? (onChoose && !onUse ? 'price' : 'onboarding');
  // Legacy onChoose (Price screen, before it passes onUse): it means "this product ships through his own cluster",
  // so only the node in his district gets the button.
  const use: ((n: PackPointNode) => void) | undefined = onUse ?? (onChoose ? () => onChoose() : undefined);
  const legacyOwnOnly = !onUse && !!onChoose;

  // Esc closes; Tab stays inside the drawer; focus returns to the opener on close; the page behind doesn't scroll.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
      if (f.length === 0) return;
      const first = f[0]!;
      const last = f[f.length - 1]!;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.current.contains(document.activeElement)) {
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
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-modal" style={{ top: 'var(--concept-strip-h)' }} data-testid="pp-drawer-root">
      <div className="absolute inset-0 bg-overlay-bg" onClick={onClose} data-testid="pp-drawer-overlay" />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-c2m="FO-8"
        data-c2m-id="FO-8"
        data-testid="pp-drawer"
        data-context={ctx}
        className="absolute top-0 right-0 bottom-0 flex w-[30rem] max-w-full flex-col bg-white outline-none animate-fade-in"
      >
        <div className="flex items-center justify-between gap-3 border-0 border-b border-solid border-tertiary-border px-5 py-4">
          <h3 id={titleId} className="m-0 text-2xl leading-6 font-heading text-primary-text">
            {C2M.ppDrawerTitle}
          </h3>
          <button type="button" aria-label={C2M.ppClose} onClick={onClose} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent p-0">
            <img src="/brand/msa/merlin/lined/cross-grey.svg" alt="" width="24" height="24" className="size-6" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Section title={C2M.ppHowHeading}>
            <ol className="m-0 list-none p-0" data-testid="pp-how">
              {C2M.ppHowSteps(SHIP_WITHIN_HOURS).map((s, i) => (
                <li key={i} className={cx('flex gap-2.5', i > 0 && 'mt-2')}>
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary-bg text-sm font-button text-primary-text">{i + 1}</span>
                  <span className={BODY}>{s}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={C2M.ppNearHeading}>
            <NearList
              pincode={pincode}
              current={current}
              onUse={
                use
                  ? (n) => {
                      onClose();
                      use(n);
                    }
                  : undefined
              }
              useFor={legacyOwnOnly ? (n) => n === own?.node : undefined}
              onSwitchBack={
                onSwitchBack
                  ? () => {
                      onClose();
                      onSwitchBack();
                    }
                  : undefined
              }
              onWaitlist={onWaitlist}
            />
            <p className="m-0 mt-2 text-base leading-4 font-body text-secondary-text">{C2M.ppNothingAtSignup}</p>
          </Section>

          {/* PP-10: providers serving the maker's pincode (doc p.20 mock-up) */}
          <Section title={C2M.ppProvidersHeading} c2m="PP-10">
            {own ? (
              <table className="w-full border-collapse" data-testid="pp-providers">
                <thead>
                  <tr>
                    <th className={TH}>{C2M.ppProvider}</th>
                    <th className={TH}>{C2M.ppServices}</th>
                    <th className={TH}>{C2M.ppRateCard}</th>
                  </tr>
                </thead>
                <tbody>
                  {PROVIDERS.map((p) => (
                    <tr key={p.name}>
                      <td className={cx(TD, 'font-button')}>{p.name}</td>
                      <td className={TD}>{p.services.join(' · ')}</td>
                      <td className={cx(TD, 'whitespace-nowrap', p.ratePerOrder === null && 'text-secondary-text')}>{p.ratePerOrder === null ? C2M.ppOnRequest : C2M.ppPerOrder(p.ratePerOrder)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={cx(BODY, 'text-secondary-text')}>{C2M.ppNoProviders}</p>
            )}
          </Section>

          <Section title={C2M.ppCompareHeading}>
            <div className="grid grid-cols-2 gap-3" data-testid="pp-compare">
              {[
                { title: C2M.ppSelfShip, points: C2M.ppSelfShipPoints },
                { title: C2M.ppPackPoint, points: C2M.ppPackPointPoints },
              ].map((c) => (
                <div key={c.title} className="rounded-lg border border-solid border-tertiary-border p-3">
                  <p className="m-0 text-lg leading-5 font-button text-primary-text">{c.title}</p>
                  <ul className="m-0 mt-2 list-disc pl-4">
                    {c.points.map((p) => (
                      <li key={p} className="mt-1 text-base leading-4 font-body text-secondary-text">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="m-0 mt-3 text-base leading-4 font-body text-secondary-text">{C2M.ppCompareNote}</p>
          </Section>
        </div>

        <div className="flex justify-end gap-3 border-0 border-t border-solid border-tertiary-border px-5 py-4">
          <Button variant="outline" onClick={onClose} data-testid="pp-drawer-close">
            {C2M.ppClose}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
