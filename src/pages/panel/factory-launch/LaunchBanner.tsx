// LW-6 · Home banner "Factory Launch Week" at the very top of Home (above "Welcome…"), for makers who passed
// the seller-type + GST/Udyam checks. One compact row collapsed (title + one line + button), the checklist
// inline behind "Check my eligibility" (no page change). ?fl=open opens it expanded (finish screen, notice).
// Collapsible; dismissible (×) only once the maker has committed or commitments have closed. States and
// their triggers: src/pages/panel/factory-launch/entry.ts. Every number from the launch seed, the calendar
// or the engine; the price check shows only Qualifies / doesn't (B never shown).
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { onboarding, paths } from '../../../app/paths';
import { Button, cx } from '../../../components/ui';
import { dayLabel } from '../../../engine/ui';
import { useDemo } from '../../../store/demo';
import { useLaunchBanner } from '../../../store/launchBanner';
import { PinkTag } from '../catalog/BulkTemplatePanel';
import { BOT_QUERY } from '../catalog/bot';
import { useGrowth } from '../growth-loop/useGrowth';
import { FL } from './copy';
import type { ChecklistItem, ItemAction } from './entry';
import { LAUNCH, liveDatesShort, liveDayIndex, shortDay } from './launch';
import { useLaunchEntry } from './useLaunchEntry';

const B = FL.banner;

function IconButton({ icon, label, onClick, rotate, ...rest }: { icon: string; label: string; onClick: () => void; rotate?: boolean } & Record<`data-${string}`, string | boolean>) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 hover:bg-secondary-bg" {...rest}>
      <img src={icon} alt="" width="20" height="20" className={cx('size-5 transition-transform duration-200', rotate && 'rotate-180')} />
    </button>
  );
}

function Mark({ done }: { done: boolean }) {
  return done ? (
    <img src="/brand/msa/merlin/filled/tick-green.svg" alt="done" width="20" height="20" className="size-5 shrink-0" />
  ) : (
    <span aria-label="to do" className="box-border size-5 shrink-0 rounded-full border-[1.5px] border-solid border-secondary-border bg-white" />
  );
}

export function LaunchBanner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const persona = useDemo((s) => s.persona);
  const { model, view: v, row, productName } = useLaunchEntry();
  const g = useGrowth();
  const dismissed = useLaunchBanner((s) => s.dismissed[persona]);
  const dismiss = useLaunchBanner((s) => s.dismiss);
  const [open, setOpen] = useState(params.get('fl') === 'open');
  if (!model || dismissed === model.state) return null;

  const state = model.state;
  const go = (a: ItemAction) => {
    if (a === 'tellUs') navigate(onboarding.done);
    else if (a === 'createFromPhotos') navigate(`${paths.addSingleCategory}?${BOT_QUERY}`);
    else if (a === 'pricePosition') navigate(paths.pricePosition);
    else if (a === 'orderBook') navigate(paths.factoryLaunch);
  };
  const close = shortDay(LAUNCH.commitmentsCloseDay);
  const title = FL.eventTitle(LAUNCH.name, LAUNCH.category);
  const typeName = productName ?? v.bookTypeName;
  const slots = row ? B.slotsFor(row.slots.crowded ? FL.slotsFull : FL.slotsLeft(row.slots.left), row.name) : null;
  const pitch = [B.liveOn(liveDatesShort()), B.manufacturersOnly, B.noAds, ...(slots && state === 'join' ? [slots] : [])].join(' · ');
  const dismissBtn = model.dismissible ? <IconButton icon="/brand/msa/merlin/lined/cross-grey.svg" label={B.dismiss} onClick={() => dismiss(persona, state)} data-fl-dismiss /> : null;
  const tag = state === 'slotRemoved' ? 'PI-3' : 'LW-6';

  // ── Slim one-liners: launch over, window closed, no order book for the maker's type ──
  if (state === 'ended' || state === 'closed' || state === 'noBook') {
    const text = state === 'ended' ? `${LAUNCH.name} · ${B.ended}` : state === 'closed' ? `${LAUNCH.name} · ${B.closed(close)}` : `${title} · ${B.noBook(typeName)}`;
    const link = state === 'ended' ? { label: B.results, to: paths.factoryLaunchLive } : state === 'noBook' ? { label: FL.tab, to: paths.factoryLaunch } : null;
    return (
      <div className="mb-0.5 flex items-center gap-3 rounded border-0 border-l-4 border-solid border-brand-primary-bg bg-white py-1.5 pl-3 pr-2" data-c2m={tag} data-c2m-id={tag} data-fl-banner={state}>
        <p className="m-0 min-w-0 flex-1 truncate text-lg leading-5 text-secondary-text">{text}</p>
        {link && (
          <button type="button" onClick={() => navigate(link.to)} className="shrink-0 cursor-pointer border-0 bg-transparent p-0 font-button text-lg leading-5 text-brand-primary-text" data-fl-link>
            {link.label}
          </button>
        )}
        {dismissBtn}
      </div>
    );
  }

  // ── Full banner ──
  let heading = title;
  let line = pitch;
  let right: string | null = null;
  let button: { label: string; onClick: () => void } = { label: B.check, onClick: () => setOpen(!open) };
  const red = state === 'slotRemoved';
  if (state === 'choose' || state === 'join') {
    const next = model.next;
    const nextLabel = next?.key === 'product' ? B.item.product : next?.key === 'price' ? B.createFromPhotos : next?.key === 'stock' ? B.commitStock : null;
    right = [B.progress(model.done, model.total), nextLabel && B.next(nextLabel), next?.key === 'stock' && B.closeBy(close)].filter(Boolean).join(' · ');
  } else if (state === 'in') {
    heading = B.in(LAUNCH.name, shortDay(LAUNCH.stockAtNodeDay), shortDay(LAUNCH.liveFromDay));
    line = `${title} · ${FL.committedPill(v.commit!.units)}`;
    right = B.progress(model.done, model.total);
    button = { label: FL.viewLive, onClick: () => navigate(paths.factoryLaunchLive) };
  } else if (state === 'live') {
    const live = liveDayIndex(v.day)!;
    heading = B.live(v.progress?.today ?? 0);
    line = `${title} · ${B.liveSub(FL.dayOf(live.n, live.of, shortDay(v.day)), FL.ofLot(v.progress?.soldToDate ?? 0, v.commit!.units))}`;
    button = { label: FL.viewLive, onClick: () => navigate(paths.factoryLaunchLive) };
  } else if (red) {
    // PI-3: the edited price no longer qualifies; the sales so far stay as they were (restock plan's count from D28).
    const sold = g ? g.soldBefore : (v.progress?.soldToDate ?? 0);
    heading = B.slotRemoved;
    line = `${title} · ${FL.ofLot(sold, v.commit!.units)} sold · ${B.slotRemovedSub}`;
    button = { label: FL.toPricePosition, onClick: () => navigate(paths.pricePosition) };
  }
  const expanded = open && model.hasChecklist;

  const sub = (it: ChecklistItem): string => {
    switch (it.key) {
      case 'product':
        return B.item.productSub;
      case 'manufacturer':
        return B.item.manufacturerSub;
      case 'records':
        return B.item.recordsSub;
      case 'price':
        return it.done ? B.item.priceListed(typeName) : v.listing ? B.item.priceFails : B.item.priceNotListed(typeName);
      case 'stock':
        return it.done ? B.item.stockDone(v.commit!.units, shortDay(LAUNCH.stockAtNodeDay)) : v.phase === 'open' ? B.item.stockOpen(close) : B.item.stockClosed(dayLabel(LAUNCH.commitmentsCloseDay));
    }
  };
  const label = (it: ChecklistItem) => B.item[it.key];
  const actionLabel = (a: ItemAction) => (a === 'tellUs' ? B.tellUs : a === 'createFromPhotos' ? B.createFromPhotos : a === 'pricePosition' ? FL.toPricePosition : B.toOrderBook);

  return (
    <section
      className={cx('mb-0.5 rounded border-0 border-l-4 border-solid', red ? 'border-error-text bg-error-bg' : 'border-brand-primary-bg bg-white')}
      data-c2m={tag}
      data-c2m-id={tag}
      data-fl-banner={state}
      data-expanded={expanded}
    >
      <div className="flex items-center gap-4 py-3 pl-3 pr-2 max-[767px]:flex-wrap">
        {red && <img src="/brand/msa/merlin/filled/alert-red.svg" alt="" width="20" height="20" className="size-5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="m-0 truncate p-0 font-heading text-2xl leading-6 text-primary-text" data-fl-title>
              {heading}
            </h3>
            {(state === 'choose' || state === 'join') && <PinkTag>{FL.newTag}</PinkTag>}
          </div>
          <p className="m-0 truncate p-0 font-body text-lg leading-5 text-secondary-text" data-fl-line>
            {line}
          </p>
        </div>
        {right && (
          <p className="m-0 shrink-0 font-body text-lg leading-5 text-secondary-text max-[1199px]:hidden" data-fl-progress>
            {right}
          </p>
        )}
        <Button onClick={button.onClick} variant={red ? 'outline' : 'primary'} className="shrink-0" data-fl-button aria-expanded={button.label === B.check ? expanded : undefined}>
          {button.label}
        </Button>
        {model.hasChecklist && (
          <IconButton icon="/brand/msa/merlin/lined/chevron-down-grey.svg" label={expanded ? B.collapse : B.expand} onClick={() => setOpen(!open)} rotate={expanded} data-fl-toggle />
        )}
        {dismissBtn}
      </div>
      {expanded && (
        <div className="border-0 border-t border-solid border-tertiary-border px-4 pb-3 pt-2" data-fl-checklist>
          <p className="m-0 mb-1 font-button text-lg leading-5 text-primary-text" data-fl-count>
            {B.progress(model.done, model.total)}
          </p>
          <ul className="m-0 list-none p-0">
            {model.items.map((it) => (
              <li key={it.key} className="flex items-center gap-3 border-0 border-b border-solid border-tertiary-border py-2 last:border-b-0" data-fl-item={it.key} data-done={it.done}>
                <Mark done={it.done} />
                <div className="min-w-0 flex-1">
                  <p className={cx('m-0 text-lg leading-5', it.done ? 'text-primary-text' : 'font-button text-primary-text')}>{label(it)}</p>
                  <p className="m-0 text-base leading-4 text-secondary-text">{sub(it)}</p>
                </div>
                {!it.done && it.action && (
                  <Button size="sm" variant={it === model.next ? 'primary' : 'outline'} onClick={() => go(it.action)} data-fl-action={it.action}>
                    {actionLabel(it.action)}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
