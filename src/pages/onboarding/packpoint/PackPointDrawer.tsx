// FO-8 / PP-10 · "See details & rate cards": right-side drawer behind the generic Pack Point option.
// Every number comes from seed JSON (packPointNodes, packPointProviders, packPointLot, packPointModel)
// or the engine (packPointFee). No product-specific prices here: those come after the maker says what
// he makes (cost check / Warehouse page). Reused by the bot's Price screen ("See rate cards").
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, Pill, cx } from '../../../components/ui';
import lotData from '../../../data/packPointLot.json';
import model from '../../../data/packPointModel.json';
import providersData from '../../../data/packPointProviders.json';
import { packPointFee } from '../../../engine/ui';
import { C2M } from '../stepper/copy';
import { PACK_POINT_NODES, highlightedPoolSize, packPointStatus, type PackPointNode } from './status';

interface Provider {
  name: string;
  services: string[];
  ratePerOrder: number | null;
}
const PROVIDERS = providersData.providers as Provider[];
const SHIP_WITHIN_HOURS = providersData.howItWorks.shipWithinHours;
const POOL_SIZES = Object.keys(model.staffByPoolSize)
  .filter((k) => !k.startsWith('_'))
  .map(Number)
  .sort((a, b) => a - b);

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

function NodeRow({ node, own }: { node: PackPointNode; own: boolean }) {
  const status =
    node.status === 'live' ? (
      <Pill tone="success">{C2M.ppLive}</Pill>
    ) : own && node.makersSignedUp !== undefined && node.opensAtMakers !== undefined ? (
      <Pill tone="warning">{C2M.ppNodeOpeningSoon(node.makersSignedUp, node.opensAtMakers)}</Pill>
    ) : (
      <Pill tone="warning">{C2M.ppOpensAt(node.opensAtMakers ?? model.densityFloorMakers)}</Pill>
    );
  return (
    <li data-testid={`pp-node-${node.city}`} data-own={own} className={cx('flex items-center justify-between gap-3 rounded-lg border border-solid px-3 py-2.5', own ? 'border-brand-primary-border bg-brand-secondary-bg' : 'border-tertiary-border bg-white')}>
      <span className="flex flex-col">
        <span className={cx(BODY, own && 'font-button')}>{node.city}</span>
        {own && <span className="text-base leading-4 font-body text-secondary-text">{C2M.ppYourPincode}</span>}
      </span>
      {status}
    </li>
  );
}

export function PackPointDrawer({ open, onClose, pincode, onChoose }: { open: boolean; onClose: () => void; pincode: string; onChoose?: () => void }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const status = packPointStatus(pincode);
  const ownNode = status?.node ?? null;
  const nodes = ownNode ? [ownNode, ...PACK_POINT_NODES.filter((n) => n !== ownNode)] : PACK_POINT_NODES;
  const highlight = highlightedPoolSize(status);
  const storage = lotData.storage;

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

  const chooseDisabled = status?.kind !== 'live';
  const chooseLabel = status?.kind === 'opening' ? C2M.ppOpensAt(status.opensAt) : C2M.ppChoose;

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
            {!ownNode && <p className={cx(BODY, 'mb-2 text-secondary-text')}>{C2M.ppNoneNear(pincode)}</p>}
            <ul className="m-0 flex list-none flex-col gap-2 p-0" data-testid="pp-nodes">
              {nodes.map((n) => (
                <NodeRow key={n.city} node={n} own={n === ownNode} />
              ))}
            </ul>
          </Section>

          {/* PP-10: providers serving the maker's pincode (doc p.20 mock-up) */}
          <Section title={C2M.ppProvidersHeading} c2m="PP-10">
            {ownNode ? (
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

          <Section title={C2M.ppFeeHeading}>
            <table className="w-full border-collapse" data-testid="pp-fees">
              <thead>
                <tr>
                  <th className={TH}>{C2M.ppFeeMakers}</th>
                  <th className={TH}>{C2M.ppFeePerOrder}</th>
                </tr>
              </thead>
              <tbody>
                {POOL_SIZES.map((n) => {
                  const on = n === highlight;
                  return (
                    <tr key={n} data-testid={`pp-fee-${n}`} data-current={on} className={on ? 'bg-brand-secondary-bg' : undefined}>
                      <td className={cx(TD, on && 'font-button')}>
                        <span className="flex items-center gap-2">
                          {C2M.ppMakers(n)}
                          {on && <Pill tone="brand" bordered>{status?.kind === 'opening' ? C2M.ppWhenItOpens : C2M.ppYourCluster}</Pill>}
                        </span>
                      </td>
                      <td className={cx(TD, on && 'font-button')}>₹{packPointFee(n).feePerDeliveredOrder}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="m-0 mt-2 text-base leading-4 font-body text-secondary-text">{C2M.ppFeeNote(model.densityFloorMakers)}</p>
          </Section>

          <Section title={C2M.ppChargesHeading}>
            <ul className="m-0 list-disc pl-5" data-testid="pp-charges">
              <li className={BODY}>{C2M.ppStorage(storage.freeDays, storage.perUnitPerDay)}</li>
              <li className={cx(BODY, 'mt-1')}>{C2M.ppNothingAtSignup}</li>
            </ul>
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
          {onChoose && (
            <Button
              disabled={chooseDisabled}
              data-testid="pp-drawer-choose"
              onClick={() => {
                onChoose();
                onClose();
              }}
            >
              {chooseLabel}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
