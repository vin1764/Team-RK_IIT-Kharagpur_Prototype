// LW-6: Home step 3 "Get your first order" gains a Factory Launch card. Before committing:
// "Next Factory Launch · n slots left · Join"; after: "You're in … · live dates"; during the live
// week: "Live now · n orders today"; after it: "Launch week ended · orders continue".
// From D28 the ended card counts sales as the restock plan does (to the end of D27, useGrowth); after
// a price edit that no longer qualifies (PI-3), it says the launch slot was removed.
// Returns null when there is nothing to show (no order book for the maker, not eligible).
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { Button } from '../../../components/ui';
import { dayLabel } from '../../../engine/ui';
import { PinkTag } from '../catalog/BulkTemplatePanel';
import { FL } from './copy';
import { LAUNCH, liveDates, liveDayIndex } from './launch';
import { useLaunchView } from './useLaunchView';
import { useGrowth, shortDate } from '../growth-loop/useGrowth';
import { usePriceHold } from '../manage-pricing/priceHold';

function Shell({ tag, title, line, body, button, onClick, state, c2m = 'LW-6' }: { tag?: boolean; title: string; line?: string; body: string; button: string; onClick: () => void; state: string; c2m?: string }) {
  return (
    <div className="mt-0.5 p-6 bg-white" data-c2m={c2m} data-home-launch={state}>
      <div className="flex items-start gap-7.5 rounded border border-solid border-brand-secondary-border bg-brand-secondary-bg p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">{title}</h3>
            {tag && <PinkTag>NEW</PinkTag>}
          </div>
          {line && <span className="m-0 p-0 font-semibold font-button text-lg leading-5 text-black">{line}</span>}
          <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">{body}</p>
        </div>
        <Button onClick={onClick} className="shrink-0 self-center">
          {button}
        </Button>
      </div>
    </div>
  );
}

/** Whether the step-3 card has anything to show for this persona. */
export function useHasHomeLaunchCard(): boolean {
  const v = useLaunchView();
  return v.eligibility.status !== 'notEligible' && v.hasBook && v.rows.some((r) => r.typeId === v.ownType);
}

export function HomeLaunchCard() {
  const navigate = useNavigate();
  const v = useLaunchView();
  const g = useGrowth();
  const hold = usePriceHold();
  if (v.eligibility.status === 'notEligible' || !v.hasBook) return null;
  const row = v.rows.find((r) => r.typeId === v.ownType);
  if (!row) return null;
  const toTab = () => navigate(paths.factoryLaunch);
  const toLive = () => navigate(paths.factoryLaunchLive);
  const live = liveDayIndex(v.day);

  if (v.commit && hold?.slotRemoved) {
    // PI-3: the edited price no longer qualifies; the sales so far stay as they were.
    const sold = g ? g.soldBefore : (v.progress?.soldToDate ?? 0);
    const body = g ? FL.homeEndedBody(FL.ofLot(sold, v.commit.units), shortDate(g.weekTo), g.onHand) : FL.homeLiveBody(FL.ofLot(sold, v.commit.units));
    return (
      <Shell state="slotRemoved" c2m="PI-3" title={FL.homeSlotRemoved} line={FL.homeSlotRemovedLine} body={body} button={FL.toPricePosition} onClick={() => navigate(paths.pricePosition)} />
    );
  }
  if (v.commit && live && v.progress) {
    return (
      <Shell
        state="live"
        title={FL.homeLive(v.progress.today ?? 0)}
        line={FL.dayOf(live.n, live.of, dayLabel(v.day))}
        body={FL.homeLiveBody(FL.ofLot(v.progress.soldToDate, v.commit.units))}
        button={FL.viewLive}
        onClick={toLive}
      />
    );
  }
  if (v.commit && v.phase === 'ended' && v.progress) {
    // D28+: the restock plan's count, sales to the end of the snapshot week (77 of 150, 73 left).
    const body = g
      ? FL.homeEndedBody(FL.ofLot(g.soldBefore, v.commit.units), shortDate(g.weekTo), g.onHand)
      : FL.homeLiveBody(FL.ofLot(v.progress.soldToDate, v.commit.units));
    return <Shell state="ended" title={FL.homeEnded} body={body} button={FL.viewLive} onClick={toLive} />;
  }
  if (v.commit) {
    return <Shell state="in" title={FL.homeIn(LAUNCH.name, liveDates())} body={FL.homeInBody(dayLabel(LAUNCH.stockAtNodeDay))} button={FL.viewLive} onClick={toLive} />;
  }
  if (v.phase !== 'open') {
    return <Shell state="closed" title={FL.homeNext} line={LAUNCH.name} body={FL.homeClosed(dayLabel(LAUNCH.commitmentsCloseDay))} button={FL.tab} onClick={toTab} />;
  }
  return (
    <Shell
      state="join"
      tag
      title={FL.homeNext}
      line={FL.homeNextLine(LAUNCH.name, row.slots.crowded ? FL.slotsFull : FL.slotsLeft(row.slots.left))}
      body={FL.homeNextBody(dayLabel(LAUNCH.commitmentsCloseDay), dayLabel(LAUNCH.liveFromDay))}
      button={FL.join}
      onClick={toTab}
    />
  );
}
