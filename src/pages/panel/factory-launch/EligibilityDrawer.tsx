// LW-4 · "Check my eligibility": one right-side drawer in the panel's side-panel frame (growth-loop/SidePanel.tsx,
// the Pack Point drawer's frame), opened in place by every "Check my eligibility" (finish screen, Home banner,
// pinned notice) and by ?fl=open. Opening it never changes the route; closing it (×, Esc, the overlay, Close) leaves
// the maker where he was. Only the buttons inside move him to the next step.
// Rows (entry.ts drawerModel, the same checklist as the Home banner's "n of 5 done"): manufacturer, records agree,
// price qualifies (his listing's price, else his last "Check price" from the cost check or the bot), product listed,
// stock committed. The price row shows Qualifies or not, never B. A declared manufacturer whose records don't confirm
// it sees one neutral note (or that only his Udyam number is missing), never itemised reasons. Resellers and other
// non-manufacturing business types never get the drawer (nor any other Factory Launch surface).
import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { onboarding, paths } from '../../../app/paths';
import { Button, cx } from '../../../components/ui';
import { dayLabel } from '../../../engine/ui';
import { fmt, tEn as t } from '../../../i18n';
import { useDemo } from '../../../store/demo';
import { FL_OPEN_PARAM, useEligibilityDrawer } from '../../../store/eligibilityDrawer';
import { BOT_QUERY } from '../catalog/bot';
import { useDraft } from '../catalog/draftStore';
import { SidePanel } from '../growth-loop/SidePanel';
import { listWithPhotosUrl } from '../growth-loop/SwitchPanel';
import { T } from '../manage-pricing/crystal';
import { FL } from './copy';
import type { ChecklistItem, ItemAction } from './entry';
import { LAUNCH, liveDatesShort, shortDay } from './launch';
import { useFlAudience, useLaunchEntry } from './useLaunchEntry';

const B = FL.banner;

/** ✓ done / ○ to do, as the Home banner's checklist drew them. */
export function Mark({ done }: { done: boolean }) {
  if (done) return <img src="/brand/msa/merlin/filled/tick-green.svg" alt="done" width="20" height="20" className="size-5 shrink-0" />;
  return <span aria-label="to do" className="box-border size-5 shrink-0 rounded-full border-[1.5px] border-solid border-secondary-border bg-white" />;
}

/** Mounted once (App.tsx): renders the drawer while it's open; ?fl=open opens it; a route change closes it. */
export function EligibilityDrawerHost() {
  const open = useEligibilityDrawer((s) => s.open);
  const show = useEligibilityDrawer((s) => s.show);
  const hide = useEligibilityDrawer((s) => s.hide);
  const c2m = useDemo((s) => s.c2m);
  // Resellers and other non-manufacturing business types: no Factory Launch anywhere, so no drawer either.
  const audience = useFlAudience();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const flOpen = params.get(FL_OPEN_PARAM) === 'open';

  // Another page (a button inside the drawer, the sidebar, Back) closes it. Runs before the ?fl=open effect below,
  // so a link to another page with ?fl=open still opens it there.
  useEffect(() => {
    hide();
  }, [pathname, hide]);

  // ?fl=open (showcase jumps, older links): open, then drop the param so a reload or Back doesn't reopen it.
  useEffect(() => {
    if (!flOpen) return;
    if (audience) show();
    setParams(
      (p) => {
        p.delete(FL_OPEN_PARAM);
        return p;
      },
      { replace: true },
    );
  }, [flOpen, audience, show, setParams]);

  // "Today vs ours" (plain mode) and non-manufacturers: no drawer.
  if (!open || !c2m || !audience) return null;
  return <EligibilityDrawer onClose={hide} />;
}

function EligibilityDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { drawer: m, checked, view: v, productName } = useLaunchEntry();
  const typeName = productName ?? B.product;
  const close = shortDay(LAUNCH.commitmentsCloseDay);

  const go = (a: ItemAction) => {
    onClose();
    if (a === 'tellUs') navigate(onboarding.done);
    else if (a === 'createFromPhotos') {
      // "Create from photos" with his product pre-selected: the bot lists his own type unless a draft for another
      // type is open (What to make instead → List it with photos); then ?type= starts one for his.
      const override = useDraft.getState().typeOverride;
      navigate(v.ownType && override && override !== v.ownType ? listWithPhotosUrl(v.ownType) : `${paths.addSingleCategory}?${BOT_QUERY}`);
    } else if (a === 'pricePosition') navigate(paths.pricePosition);
    else if (a === 'orderBook') navigate(paths.factoryLaunch);
  };

  const label = (it: ChecklistItem) =>
    ({ manufacturer: B.item.manufacturer, records: B.item.records, price: t('fl.drawer.price'), listed: t('fl.drawer.listed'), stock: B.item.stock })[it.key];
  const sub = (it: ChecklistItem): string => {
    switch (it.key) {
      case 'manufacturer':
        return B.item.manufacturerSub;
      case 'records':
        return B.item.recordsSub;
      case 'price':
        if (v.listing) return it.done ? t('fl.drawer.price.listedOk') : B.item.priceFails;
        if (checked) return t(checked.status === 'qualifies' ? 'fl.drawer.price.checkedOk' : 'fl.drawer.price.checkedNo', { price: fmt(checked.price) });
        return t('fl.drawer.price.none');
      case 'listed':
        return it.done ? t('fl.drawer.listed.done', { type: typeName }) : it.action === 'tellUs' ? t('fl.drawer.listed.tellUs') : t('fl.drawer.listed.open', { type: typeName });
      case 'stock':
        if (it.done) return B.item.stockDone(v.commit!.units, shortDay(LAUNCH.stockAtNodeDay));
        if (v.ownType && !v.hasBook) return B.noBook(typeName);
        return v.phase === 'open' ? B.item.stockOpen(close) : B.item.stockClosed(dayLabel(LAUNCH.commitmentsCloseDay));
    }
  };
  const actionLabel = (a: ItemAction) => (a === 'tellUs' ? t('fl.drawer.tellUs') : a === 'createFromPhotos' ? t('fl.drawer.list') : a === 'pricePosition' ? FL.toPricePosition : B.toOrderBook);

  if (!m) return null;
  return (
    <SidePanel
      title={t('fl.drawer.title')}
      closeLabel={t('fl.drawer.close')}
      onClose={onClose}
      c2m="LW-4"
      panelAttrs={{ 'data-fl-drawer': m.access }}
      overlayAttrs={{ 'data-fl-drawer-overlay': true }}
      footer={
        <Button variant="outline" onClick={onClose} data-fl-drawer-close>
          {t('fl.drawer.close')}
        </Button>
      }
    >
      <section className="border-0 border-b border-solid border-neutral-light px-5 py-4">
        <p className={cx(T.bodyMd, 'font-bold')}>{FL.eventTitle(LAUNCH.name, LAUNCH.category)}</p>
        <p className={cx(T.bodySm, 'mt-1 text-neutral-secondary')}>{[B.liveOn(liveDatesShort()), B.manufacturersOnly, B.closeBy(close)].join(' · ')}</p>
      </section>

      {m.access === 'eligible' ? (
        <section className="px-5 py-4" data-fl-checklist>
          <p className={cx(T.bodyLg, 'font-bold')} data-fl-count data-done={m.done} data-total={m.total}>
            {B.progress(m.done, m.total)}
          </p>
          <ul className="m-0 mt-2 list-none p-0">
            {m.items.map((it) => (
              <li key={it.key} className="flex items-center gap-3 border-0 border-b border-solid border-neutral-light py-3 last:border-b-0" data-fl-item={it.key} data-done={it.done}>
                <Mark done={it.done} />
                <div className="min-w-0 flex-1">
                  <p className={cx(T.bodyMd, !it.done && 'font-bold')}>{label(it)}</p>
                  <p className={cx(T.bodySm, 'mt-0.5 text-neutral-secondary')}>{sub(it)}</p>
                </div>
                {!it.done && it.action && (
                  <Button size="sm" variant={it === m.next ? 'primary' : 'outline'} className="shrink-0" onClick={() => go(it.action)} data-fl-action={it.action}>
                    {actionLabel(it.action)}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        // Records don't confirm manufacturing yet: one neutral note, no itemised reasons.
        <section className="px-5 py-4" data-fl-unverified={m.access}>
          <p className={T.bodyMd}>{t(m.access === 'udyamMissing' ? 'fl.drawer.udyamMissing' : 'fl.drawer.unverified')}</p>
        </section>
      )}
    </SidePanel>
  );
}
