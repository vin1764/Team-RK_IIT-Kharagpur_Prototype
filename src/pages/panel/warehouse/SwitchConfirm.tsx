// PP-3 · the Warehouse card's confirm panel, in place: "Switch to Pack Point · <city>" (from "Use this Pack Point")
// or "Switch back to self-ship". Apply to [All my products] [Choose products]; each live listing with its take-home
// today → after the switch at its current price and its Factory Launch status after it ("Qualifies" / "Not eligible
// at this price"), all from the engine (./switch.ts). Nothing here is typed in; the cap never shows.
import { useMemo, useState } from 'react';
import { Button, Pill, cx } from '../../../components/ui';
import { productTypeName, type ProductTypeId } from '../../../engine/ui';
import { fmt } from '../../../i18n';
import type { ShipMode } from '../../../store/fulfilmentSwitch';
import { C2M } from '../../onboarding/stepper/copy';
import { canSelfShip, switchRows, type SwitchListing } from './switch';

const TEXT = 'm-0 p-0 text-primary-text font-normal font-body text-lg leading-5';
const SUB = 'm-0 p-0 text-secondary-text font-normal font-body text-base leading-4';

/** "₹14", "−₹10" */
export const rupee = (n: number) => (n < 0 ? `−₹${fmt(-n)}` : `₹${fmt(n)}`);

function Toggle({ on, onClick, children, testId }: { on: boolean; onClick: () => void; children: string; testId: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      data-testid={testId}
      className={cx(
        'h-8 cursor-pointer rounded-full border border-solid px-3 text-lg leading-5 font-button',
        on ? 'border-brand-primary-bg bg-brand-secondary-bg text-brand-primary-text' : 'border-secondary-border bg-white text-primary-text',
      )}
    >
      {children}
    </button>
  );
}

export function SwitchConfirm({
  to,
  city,
  makersPooled,
  listings,
  productType,
  onConfirm,
  onCancel,
}: {
  to: ShipMode;
  /** the Pack Point switched to, or the one he leaves */
  city: string;
  /** the node's pool (its fee), for the Pack Point side of the numbers */
  makersPooled: number;
  listings: SwitchListing[];
  /** his own product type (the onboarding one), checked for self-ship when he has no listings */
  productType: ProductTypeId | null;
  onConfirm: (keys: string[]) => void;
  onCancel: () => void;
}) {
  const rows = useMemo(() => switchRows(listings, to, makersPooled), [listings, to, makersPooled]);
  const [all, setAll] = useState(true);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const selectable = rows.filter((r) => to === 'packPoint' || r.takeHomeAfter !== null);
  const blockedType = to === 'selfShip' ? (rows.find((r) => r.takeHomeAfter === null)?.typeId ?? (productType && !canSelfShip(productType) ? productType : null)) : null;
  const chosen = all ? selectable.map((r) => r.key) : selectable.filter((r) => picked.has(r.key)).map((r) => r.key);
  const blocked = to === 'selfShip' && blockedType !== null && selectable.length === 0;
  const canConfirm = !blocked && (rows.length === 0 ? to === 'packPoint' : chosen.length > 0);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-solid border-brand-primary-border bg-white p-5" data-c2m="PP-3" data-c2m-id="PP-3" data-pp-confirm={to} id="pp-confirm">
      <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">{to === 'packPoint' ? C2M.ppSwitchTitle(city) : C2M.ppSwitchBackTitle}</h3>

      {blocked && blockedType ? (
        <p className={TEXT} data-pp-cant-selfship>
          {C2M.ppCantSelfShip(productTypeName(blockedType))}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className={cx(TEXT, 'font-button')}>{C2M.ppApplyTo}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={C2M.ppApplyTo}>
              <Toggle on={all} onClick={() => setAll(true)} testId="pp-apply-all">
                {C2M.ppAllProducts}
              </Toggle>
              <Toggle on={!all} onClick={() => setAll(false)} testId="pp-apply-choose">
                {C2M.ppChooseProducts}
              </Toggle>
            </div>
          </div>
          {rows.length === 0 ? (
            <p className={SUB}>{C2M.ppNoListings}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0" data-pp-products>
              {rows.map((r) => {
                const can = to === 'packPoint' || r.takeHomeAfter !== null;
                const checked = can && (all || picked.has(r.key));
                return (
                  <li key={r.key} className="rounded-lg border border-solid border-tertiary-border px-3 py-2.5" data-pp-product={r.key}>
                    <label className={cx('flex items-start gap-3', can && !all ? 'cursor-pointer' : 'cursor-default')}>
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-brand-primary-bg"
                        checked={checked}
                        disabled={all || !can}
                        onChange={(e) =>
                          setPicked((p) => {
                            const n = new Set(p);
                            if (e.target.checked) n.add(r.key);
                            else n.delete(r.key);
                            return n;
                          })
                        }
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className={cx(TEXT, 'font-button')}>{r.name}</span>
                          {r.statusAfter && (
                            <Pill tone={r.statusAfter === 'qualifies' ? 'success' : 'warning'} bordered>
                              <span data-pp-status={r.statusAfter}>{r.statusAfter === 'qualifies' ? C2M.ppQualifies : C2M.ppNotEligible}</span>
                            </Pill>
                          )}
                        </span>
                        <span className={SUB}>
                          {r.id ? `Catalog Id ${r.id} · ` : ''}
                          {rupee(r.price)}
                        </span>
                        {r.takeHomeAfter !== null && r.takeHomeNow !== null ? (
                          <span className={TEXT} data-pp-takehome={r.takeHomeAfter}>
                            {C2M.ppTakeHome(rupee(r.takeHomeNow), rupee(r.takeHomeAfter))} {C2M.ppTakeHomeAt(rupee(r.price))}
                          </span>
                        ) : (
                          <span className={SUB}>{C2M.ppCantSelfShip(productTypeName(r.typeId))}</span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-col gap-1">
            <p className={cx(TEXT, 'font-button')}>{C2M.ppWhatChanges}</p>
            <p className={TEXT}>{to === 'packPoint' ? C2M.ppWhatChangesBody : C2M.ppWhatChangesBack}</p>
            {rows.length > 0 && <p className={SUB}>{C2M.ppPackerNote}</p>}
          </div>
        </>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} data-pp-cancel>
          {C2M.ppCancel}
        </Button>
        <Button disabled={!canConfirm} onClick={() => onConfirm(chosen)} data-pp-confirm-btn>
          {C2M.ppConfirm}
        </Button>
      </div>
    </div>
  );
}
