// LW-2 / LW-3 / LW-4: the "Factory Launch" tab of Promotions and Sale Opt-in. Same layout as Sale
// Events (event header, Upcoming / Live / Expired, the event under its status), with the event's
// published order book. The price cap is checked at commit, not printed (doc p.22).
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { paths } from '../../../app/paths';
import { Banner, Button, InfoTip, Pill, cx } from '../../../components/ui';
import { dayLabel, type PriceStatus } from '../../../engine/ui';
import { EventsEmpty, NewTag, StatusTabs, eventsEmptyCopy } from '../promotions/PromoParts';
import { STATUSES } from '../promotions/tabs';
import { CommitModal } from './CommitModal';
import { FL } from './copy';
import { KeyDates } from './KeyDates';
import { LAUNCH, liveDates, liveDayIndex, statusForPhase, type LaunchPhase } from './launch';
import { Cell, MerlinTable, Section, T, type Col } from './parts';
import { useLaunchView, type LaunchView, type OrderBookRow } from './useLaunchView';
import { usePriceHold } from '../manage-pricing/priceHold';
import { COMMIT_PARAM } from '../../../embed/prep';
import { useDemo } from '../../../store/demo';

const PHASE_TONE: Record<LaunchPhase, 'brand' | 'warning' | 'info' | 'success' | 'error'> = {
  open: 'brand',
  closed: 'warning',
  stockReady: 'warning',
  live: 'success',
  ended: 'info',
};

function PhasePill({ phase }: { phase: LaunchPhase }) {
  return (
    <Pill tone={PHASE_TONE[phase]} bordered className="!text-body-small" >
      <span data-phase={phase}>{FL.phase[phase]}</span>
    </Pill>
  );
}

function EventHeader({ view }: { view: LaunchView }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className={T.h2}>{FL.eventTitle(LAUNCH.name, LAUNCH.category)}</h2>
            <NewTag />
          </div>
          <p className={cx(T.bodyMd, 'text-neutral-secondary')}>{FL.eventSub}</p>
        </div>
        <PhasePill phase={view.phase} />
      </div>
      <KeyDates day={view.day} />
    </div>
  );
}

/** The maker's own listing is live at a price that doesn't qualify (and he holds no slot): he can't commit until he
 *  lowers it on Price position. The listing itself sells as normal. Status only, never by how much. */
const priceNotEligible = (view: LaunchView, priceStatus: PriceStatus | null) => !!view.listing && !view.commit && priceStatus !== null && priceStatus !== 'qualifies';

function ActionCell({ view, row, onCommit, slotRemoved, priceStatus }: { view: LaunchView; row: OrderBookRow; onCommit: () => void; slotRemoved: boolean; priceStatus: PriceStatus | null }) {
  const navigate = useNavigate();
  if (!view.hasBook || view.ownType !== row.typeId) return <Cell value="—" />;
  if (view.commit && view.commit.typeId === row.typeId) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        {slotRemoved ? (
          <div className="flex flex-col items-start gap-0.5" data-c2m="PI-3" data-c2m-id="PI-3" data-slot-removed>
            <Pill tone="error" bordered>
              {FL.slotRemovedPill}
            </Pill>
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{FL.slotRemovedSub}</p>
          </div>
        ) : (
          <Pill tone="success" bordered>
            {FL.committedPill(view.commit.units)}
          </Pill>
        )}
        <button
          type="button"
          className="bg-transparent border-0 p-0 cursor-pointer text-body-small leading-4 font-medium text-brand-primary"
          onClick={() => navigate(paths.factoryLaunchLive)}
          data-c2m="LW-7"
          data-c2m-id="LW-7"
        >
          {FL.viewLive}
        </button>
      </div>
    );
  }
  if (view.phase === 'open' && priceNotEligible(view, priceStatus)) {
    return (
      <div className="flex flex-col items-start gap-1.5" data-c2m="PI-3" data-c2m-id="PI-3" data-price-not-eligible>
        <Button size="sm" disabled>
          {FL.commit}
        </Button>
        <p className={cx(T.bodySm, 'text-neutral-secondary')}>{FL.notEligiblePrice}</p>
        <button type="button" className="bg-transparent border-0 p-0 cursor-pointer text-body-small leading-4 font-medium text-brand-primary" onClick={() => navigate(paths.pricePosition)}>
          {FL.toPricePosition}
        </button>
      </div>
    );
  }
  if (view.phase === 'open') {
    return (
      <Button size="sm" onClick={onCommit} data-commit-open>
        {FL.commit}
      </Button>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button size="sm" disabled>
        {FL.commit}
      </Button>
      <p className={cx(T.bodySm, 'text-neutral-secondary')}>{FL.closedOn(dayLabel(LAUNCH.commitmentsCloseDay))}</p>
    </div>
  );
}

function OrderBook({ view, onCommit, slotRemoved, priceStatus }: { view: LaunchView; onCommit: (row: OrderBookRow) => void; slotRemoved: boolean; priceStatus: PriceStatus | null }) {
  const holdsSlot = (row: OrderBookRow) => view.commit?.typeId === row.typeId;
  const lostSlot = (row: OrderBookRow) => holdsSlot(row) && slotRemoved;
  const cols: Col[] = [
    { key: 'type', header: FL.col.type, width: '15%' },
    { key: 'slots', header: FL.col.slots, width: '11%' },
    { key: 'expected', header: FL.col.expected, width: '13%' },
    { key: 'lot', header: FL.col.lot, width: '11%' },
    { key: 'committed', header: FL.col.committed, width: '11%' },
    { key: 'ppFee', header: FL.col.ppFee, width: '13%' },
    {
      key: 'priceCap',
      header: (
        <span className="inline-flex items-center gap-1">
          {FL.col.priceCap}
          <InfoTip text={FL.priceCapTip} />
        </span>
      ),
      width: '11%',
    },
    { key: 'action', header: FL.col.action, width: '15%' },
  ];
  const rows = view.rows.map((r) => ({
    id: r.typeId,
    type: (
      <Cell
        value={<b className="font-button">{r.name}</b>}
        sub={
          // The maker's own product type (what they told us after onboarding, or their listing's).
          r.typeId === view.ownType ? (
            <span className="inline-flex flex-col items-start gap-1">
              {LAUNCH.category}
              <Pill tone="brand" bordered>
                <span data-own-type>{FL.yourProduct}</span>
              </Pill>
            </span>
          ) : (
            LAUNCH.category
          )
        }
      />
    ),
    slots: (
      <Cell
        value={`${r.slots.taken}/${r.slots.total}`}
        sub={
          lostSlot(r) ? (
            <span className="text-error-text" data-slots="removed">
              {FL.slotRemovedPill}
            </span>
          ) : (
            <span className={r.slots.crowded && !holdsSlot(r) ? 'text-error-text' : undefined} data-slots={r.slots.crowded ? 'crowded' : 'open'}>
              {r.slots.crowded ? (holdsSlot(r) ? FL.slotsFullYours : FL.slotsFull) : FL.slotsLeft(r.slots.left)}
            </span>
          )
        }
      />
    ),
    expected: <Cell value={FL.expectedRange(r.expected.low, r.expected.high)} sub={FL.forecast} />,
    lot: <Cell value={FL.units(r.suggestedLot)} />,
    committed: <Cell value={FL.units(r.committedUnits)} />,
    ppFee: <Cell value={r.packPointFee !== undefined ? FL.ppFeeValue(r.packPointFee) : '—'} sub={view.packPointMaker && view.hasBook ? FL.ppFeeYours : FL.ppFeeInfo} />,
    priceCap: <Cell value={FL.priceCapValue} />,
    action: <ActionCell view={view} row={r} onCommit={() => onCommit(r)} slotRemoved={slotRemoved} priceStatus={priceStatus} />,
  }));
  return (
    <div className="px-4 pb-4" data-c2m="LW-3" data-c2m-id="LW-3">
      <h3 className={cx(T.h3, 'mb-3')}>{FL.orderBook}</h3>
      <div className="overflow-hidden rounded-8 border border-solid border-neutral-light">
        <MerlinTable cols={cols} rows={rows} label={FL.orderBook} />
      </div>
      <div className="mt-2 flex items-center gap-1">
        <img src="/brand/msa/merlin/lined/info-grey.svg" alt="" width="14" height="14" className="size-3.5" />
        <p className={cx(T.bodySm, 'text-neutral-secondary')} data-oversubscribed>
          {FL.oversubscribed}
        </p>
      </div>
    </div>
  );
}

function StateBanner({ view, slotRemoved, priceStatus }: { view: LaunchView; slotRemoved: boolean; priceStatus: PriceStatus | null }) {
  const navigate = useNavigate();
  const stock = dayLabel(LAUNCH.stockAtNodeDay);
  const viewLive = (
    <Button size="sm" variant="outline" onClick={() => navigate(paths.factoryLaunchLive)}>
      {FL.viewLive}
    </Button>
  );
  if (!view.hasBook) {
    return (
      <div className="px-4 pb-4" data-c2m="LW-4" data-c2m-id="LW-4" data-no-order-book>
        <Banner tone="info">
          <b className="font-button">{FL.noOrderBook}</b>
          <br />
          {FL.noOrderBookSub}
        </Banner>
      </div>
    );
  }
  const live = liveDayIndex(view.day);
  if (view.commit && slotRemoved) {
    // PI-3 price-hold breach: no number shown.
    return (
      <div className="px-4 pb-4" data-c2m="PI-3" data-c2m-id="PI-3" data-launch-banner="slotRemoved">
        <Banner
          tone="error"
          action={
            <Button size="sm" variant="outline" onClick={() => navigate(paths.pricePosition)}>
              {FL.toPricePosition}
            </Button>
          }
        >
          {FL.slotRemovedBanner}
        </Banner>
      </div>
    );
  }
  if (view.phase === 'open' && priceNotEligible(view, priceStatus)) {
    // Live above the cap: the listing sells as normal; no slot until the price is lowered (no number shown).
    return (
      <div className="px-4 pb-4" data-c2m="PI-3" data-c2m-id="PI-3" data-launch-banner="priceNotEligible">
        <Banner
          tone="info"
          action={
            <Button size="sm" variant="outline" onClick={() => navigate(paths.pricePosition)}>
              {FL.toPricePosition}
            </Button>
          }
        >
          {FL.notEligiblePriceBanner}
        </Banner>
      </div>
    );
  }
  let banner = null;
  if (view.commit && live) banner = <Banner tone="success" action={viewLive}>{FL.liveBanner(live.n, live.of)}</Banner>;
  else if (view.commit && view.phase === 'ended') banner = <Banner tone="info" action={viewLive}>{FL.endedBanner}</Banner>;
  else if (view.commit) banner = <Banner tone="success" action={viewLive}>{FL.success(LAUNCH.name, view.commit.units, liveDates())}</Banner>;
  else if (view.phase === 'closed') banner = <Banner tone="info">{FL.closedBanner(stock)}</Banner>;
  else if (view.phase === 'stockReady') banner = <Banner tone="info">{FL.stockBanner(stock, dayLabel(LAUNCH.liveFromDay))}</Banner>;
  if (!banner) return null;
  return (
    <div className="px-4 pb-4" data-c2m="LW-5" data-c2m-id="LW-5" data-launch-banner>
      {banner}
    </div>
  );
}

export function FactoryLaunchPanel() {
  const view = useLaunchView();
  const hold = usePriceHold();
  const slotRemoved = hold?.slotRemoved ?? false;
  // The listing's price now (an edit on Price position counts), checked by the engine: the commit gate.
  const priceStatus = hold?.status ?? view.priceStatus;
  const [params, setParams] = useSearchParams();
  const [commitRow, setCommitRow] = useState<OrderBookRow | null>(null);
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  // Showcase prep 'commitModal' (src/embed/prep.ts): ?commit=1 opens the commit modal on the maker's own row,
  // once the jump's persona and day have landed; the param is then dropped.
  useEffect(() => {
    if (params.get(COMMIT_PARAM) !== '1' || params.get('persona') !== persona || params.get('day') !== String(day)) return;
    const own = view.phase === 'open' && !view.commit ? view.rows.find((r) => r.typeId === view.ownType) : undefined;
    if (own) setCommitRow(own);
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(COMMIT_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [params, persona, day, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const eventStatus = statusForPhase(view.phase);
  const raw = (params.get('status') ?? '').toUpperCase();
  const status = STATUSES.find((s) => s.value === (raw === 'EXPIRED' ? 'COMPLETED' : raw)) ?? STATUSES.find((s) => s.value === eventStatus)!;
  const setStatus = (s: (typeof STATUSES)[number]) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('status', s.value);
        return next;
      },
      { replace: true },
    );

  return (
    <div data-c2m="LW-2" data-c2m-id="LW-2" className="flex flex-1 flex-col">
      <StatusTabs active={status} onChange={setStatus} />
      {status.value === eventStatus ? (
        <div className="p-4">
          <Section className="overflow-hidden">
            <EventHeader view={view} />
            <StateBanner view={view} slotRemoved={slotRemoved} priceStatus={priceStatus} />
            <OrderBook view={view} onCommit={setCommitRow} slotRemoved={slotRemoved} priceStatus={priceStatus} />
          </Section>
        </div>
      ) : (
        <EventsEmpty {...eventsEmptyCopy('factory launch', status.word)} />
      )}
      {commitRow && <CommitModal open onClose={() => setCommitRow(null)} view={view} row={commitRow} />}
    </div>
  );
}
