// LW-5 commit flow: SKU → units the maker chooses (suggested lot prefilled, any number) → price
// re-checked against the latest data → Commit. No discount field anywhere. The price cap itself is
// never shown: only "Qualifies ✓" or "Price doesn't qualify for Factory Launch".
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { Banner, Button, Modal, Pill, cx } from '../../../components/ui';
import { checkListingPrice, dayLabel } from '../../../engine/ui';
import { useDemo } from '../../../store/demo';
import { useLaunch } from '../../../store/timeline';
import { BOT_QUERY } from '../catalog/bot';
import { FL } from './copy';
import { LAUNCH } from './launch';
import type { LaunchView, OrderBookRow } from './useLaunchView';

const LABEL = 'm-0 p-0 text-lg leading-5 font-semibold font-button text-primary-text';
const SUB = 'm-0 p-0 text-base leading-4 font-body text-secondary-text';

export function CommitModal({ open, onClose, view, row }: { open: boolean; onClose: () => void; view: LaunchView; row: OrderBookRow }) {
  const navigate = useNavigate();
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const commit = useLaunch((s) => s.commit);
  const [units, setUnits] = useState(String(row.suggestedLot));
  const n = Number(units);
  const validUnits = units.trim() !== '' && Number.isInteger(n) && n > 0;
  const listing = view.listing;
  // Re-checked now, against the latest data (LW-5).
  const status = listing ? checkListingPrice(listing.typeId, listing.price, listing.breakEven) : null;
  const qualifies = status === 'qualifies';

  if (!listing) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={FL.commitTitle(LAUNCH.name)}
        width="w-[32rem]"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              {FL.cancel}
            </Button>
            <Button onClick={() => navigate(`${paths.addSingleCategory}?${BOT_QUERY}`)}>{FL.createFromPhotos}</Button>
          </>
        }
      >
        <div data-c2m="LW-5" data-commit="no-listing">
          <Banner tone="info">
            <b className="font-button">{FL.listFirst(row.name)}</b>
            <br />
            {FL.listFirstSub}
          </Banner>
        </div>
      </Modal>
    );
  }

  const onCommit = () => {
    if (!validUnits || !qualifies) return;
    commit(persona, { typeId: listing.typeId, units: n, day, price: listing.price });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={FL.commitTitle(LAUNCH.name)}
      width="w-[34rem]"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {FL.cancel}
          </Button>
          <Button onClick={onCommit} disabled={!validUnits || !qualifies} data-commit-submit>
            {FL.commit}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5" data-c2m="LW-5">
        {/* SKU */}
        <div className="flex flex-col gap-1.5">
          <p className={LABEL}>{FL.sku}</p>
          <div className="flex items-center gap-3 rounded border border-solid border-tertiary-border p-3">
            <img src="/brand/local/catalog/demo-product-bottle-cleaned.png" alt="" className="size-12 shrink-0 rounded-sm border border-solid border-tertiary-border object-contain bg-white" />
            <div className="min-w-0 flex-1">
              <p className="m-0 p-0 text-lg leading-5 font-body text-primary-text truncate">{listing.name}</p>
              <p className={SUB}>
                {listing.id ? `${FL.catalogId(listing.id)} · ` : ''}
                {FL.yourPrice(listing.price)}
              </p>
            </div>
            <Pill tone="success">Live</Pill>
          </div>
        </div>

        {/* Units */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL} htmlFor="fl-units">
            {FL.unitsLabel}
          </label>
          <input
            id="fl-units"
            inputMode="numeric"
            value={units}
            onChange={(e) => setUnits(e.target.value.replace(/[^\d]/g, ''))}
            className={cx(
              'h-9 w-40 rounded-sm border border-solid px-3 text-lg font-body text-primary-text outline-none focus:border-brand-primary-border',
              validUnits ? 'border-secondary-border' : 'border-error-border',
            )}
          />
          <p className={SUB}>{FL.unitsHint(row.suggestedLot, row.lotDays)}</p>
          {validUnits && listing.minRun > 0 && n < listing.minRun && (
            <Banner tone="warning" className="mt-1">
              {FL.belowMinRun(n, listing.minRun)}
            </Banner>
          )}
        </div>

        {/* Price check */}
        <div className="flex flex-col gap-1.5" data-price-check={status}>
          {qualifies ? (
            <div className="flex items-center gap-2">
              <p className={LABEL}>{FL.priceCheck}:</p>
              <Pill tone="success" bordered>
                {FL.qualifies}
              </Pill>
            </div>
          ) : (
            <Banner tone="error">
              <b className="font-button">{FL.priceFails}</b>
              <br />
              {FL.priceFailsSub}
            </Banner>
          )}
        </div>

        <p className={SUB}>{FL.stockPromise(dayLabel(LAUNCH.stockAtNodeDay))}</p>
      </div>
    </Modal>
  );
}
