// LW-6 · Home banner "Factory Launch Week" at the very top of Home (above "Welcome…"), for every seller whose
// product is in the launch's category (no seller-type or GST/Udyam gate). One compact row (title + one line +
// "n of 3 done · Next: …" + button);
// "Check my eligibility" opens the eligibility drawer in place (LW-4, EligibilityDrawer.tsx, the same checklist
// model; no page change). Dismissible (×) only once the maker has committed or commitments have closed. States and
// their triggers: src/pages/panel/factory-launch/entry.ts. Every number from the launch seed, the calendar
// or the engine; the price check shows only Qualifies / doesn't (B never shown).
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { Button, cx } from '../../../components/ui';
import { tEn } from '../../../i18n';
import { useDemo } from '../../../store/demo';
import { useEligibilityDrawer } from '../../../store/eligibilityDrawer';
import { useLaunchBanner } from '../../../store/launchBanner';
import { PinkTag } from '../catalog/BulkTemplatePanel';
import { useGrowth } from '../growth-loop/useGrowth';
import { FL } from './copy';
import { LAUNCH, liveDatesShort, liveDayIndex, shortDay } from './launch';
import { useLaunchEntry } from './useLaunchEntry';

const B = FL.banner;

function IconButton({ icon, label, onClick, ...rest }: { icon: string; label: string; onClick: () => void } & Record<`data-${string}`, string | boolean>) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 hover:bg-secondary-bg" {...rest}>
      <img src={icon} alt="" width="20" height="20" className="size-5" />
    </button>
  );
}

export function LaunchBanner() {
  const navigate = useNavigate();
  const persona = useDemo((s) => s.persona);
  const { model, view: v, row, productName } = useLaunchEntry();
  const g = useGrowth();
  const dismissed = useLaunchBanner((s) => s.dismissed[persona]);
  const dismiss = useLaunchBanner((s) => s.dismiss);
  const openDrawer = useEligibilityDrawer((s) => s.show);
  if (!model || dismissed === model.state) return null;

  const state = model.state;
  const close = shortDay(LAUNCH.commitmentsCloseDay);
  const title = FL.eventTitle(LAUNCH.name, LAUNCH.category);
  // Before the maker has told us the product, the copy stays generic ("your product").
  const typeName = productName ?? FL.banner.product;
  const slots = row ? B.slotsFor(row.slots.crowded ? FL.slotsFull : FL.slotsLeft(row.slots.left), row.name) : null;
  const pitch = [B.liveOn(liveDatesShort()), B.openToAll, ...(slots && state === 'join' ? [slots] : [])].join(' · ');
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
  let right: [string, string | null] | null = null;
  // "Check my eligibility" opens the drawer in place (LW-4); only its buttons move the maker on.
  let button: { label: string; onClick: () => void } = { label: B.check, onClick: openDrawer };
  const red = state === 'slotRemoved';
  if (state === 'choose' || state === 'join') {
    const next = model.next;
    const nextLabel =
      next?.action === 'tellUs'
        ? B.item.product
        : next?.action === 'createFromPhotos'
          ? tEn('fl.drawer.list')
          : next?.action === 'pricePosition'
            ? B.lowerPrice
            : next?.action === 'orderBook'
              ? B.commitStock
              : null;
    // Two short lines, so the pitch line keeps its room: "2 of 3 done · Next: Commit stock" / "Commitments close 31 Oct".
    right =
      state === 'choose'
        ? [B.progress(model.done, model.total), nextLabel && B.next(nextLabel)]
        : [[B.progress(model.done, model.total), nextLabel && B.next(nextLabel)].filter(Boolean).join(' · '), B.closeBy(close)];
    // Live above the cap: the listing sells as normal; the launch asks for a lower price (Price position, weekly rule).
    if (model.priceNotEligible) {
      line = B.notEligiblePrice;
      button = { label: FL.toPricePosition, onClick: () => navigate(paths.pricePosition) };
    }
  } else if (state === 'in') {
    heading = B.in(LAUNCH.name, shortDay(LAUNCH.stockAtNodeDay), shortDay(LAUNCH.liveFromDay));
    line = `${title} · ${FL.committedPill(v.commit!.units)}`;
    right = [B.progress(model.done, model.total), null];
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
  return (
    <section
      className={cx('mb-0.5 rounded border-0 border-l-4 border-solid', red ? 'border-error-text bg-error-bg' : 'border-brand-primary-bg bg-white')}
      data-c2m={tag}
      data-c2m-id={tag}
      data-fl-banner={state}
      data-fl-price={model.priceNotEligible ? 'notEligible' : undefined}
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
          <div className="shrink-0 text-right max-[1199px]:hidden" data-fl-progress>
            <p className="m-0 font-body text-lg leading-5 text-primary-text">{right[0]}</p>
            {right[1] && <p className="m-0 font-body text-lg leading-5 text-secondary-text">{right[1]}</p>}
          </div>
        )}
        <Button onClick={button.onClick} variant={red ? 'outline' : 'primary'} className="shrink-0" data-fl-button aria-haspopup={button.label === B.check ? 'dialog' : undefined}>
          {button.label}
        </Button>
        {dismissBtn}
      </div>
    </section>
  );
}
