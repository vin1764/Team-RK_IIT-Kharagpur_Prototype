// One layout for Promotions, Sale Opt-in and Offer Opt-in: season banner, sticky title,
// tab bar (driven by a tab list + ?tab=), then the tab's panel. Only the captured empty
// states exist — no events are listed in the prototype.
import { useRef, type ReactNode } from 'react';
import { MegaComboPopover } from './MegaComboPopover';
import { DealsCarousel, EventListHeader, EventsEmpty, PromoHeader, PromoTabBar, SeasonBanner, eventsEmptyCopy } from './PromoParts';
import { usePromoParams, type PromoTab } from './tabs';

export function PromotionsLayout({
  title,
  tabs,
  megaCombo = false,
  renderPanel,
}: {
  title: string;
  tabs: PromoTab[];
  /** Show the "Introducing Mega Combo Offer" popover on the Deals tab (Promotions only). */
  megaCombo?: boolean;
  /** Override a tab's panel (for tabs added later); return undefined to use the default. */
  renderPanel?: (tab: PromoTab) => ReactNode | undefined;
}) {
  const { tab, status, setTab, setStatus } = usePromoParams(tabs);
  const dealAnchor = useRef<HTMLDivElement>(null);
  const showPopover = megaCombo && tabs.some((t) => t.value === 'DEAL');

  const panel =
    renderPanel?.(tab) ??
    (tab.kind === 'deals' ? (
      <>
        <DealsCarousel />
        {/* Offer Opt-in shows the deals list with no status tabs; captured copy is for "upcoming". */}
        <EventsEmpty {...eventsEmptyCopy(tab.noun, 'upcoming')} />
      </>
    ) : (
      <>
        <EventListHeader status={status} onStatus={setStatus} />
        <EventsEmpty {...eventsEmptyCopy(tab.noun, status.word)} />
      </>
    ));

  return (
    <div className="flex min-h-screen flex-col font-default text-neutral-primary tracking-[-0.1px]">
      <div className="flex min-h-screen flex-col">
        <SeasonBanner />
        <PromoHeader title={title} />
        <div className="py-3 empty:hidden" />
        <PromoTabBar tabs={tabs} active={tab} onChange={setTab} anchorRef={dealAnchor} anchorTab={showPopover ? 'DEAL' : undefined} />
        {panel}
      </div>
      {showPopover && <MegaComboPopover anchor={dealAnchor} />}
    </div>
  );
}
