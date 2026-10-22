// GL-2: the restock card under the bottle on Inventory → Low Stock. Every value is the D28 snapshot
// from growthAt(): run-rate of the last 7 days, on hand, days of cover, reorder point, next batch
// (and its cost at the making cost), start-by date, landing date and units left when it lands.
// "Plan this batch" opens the plan panel (RestockPlanPanel); once a batch is confirmed and until it lands,
// the yellow start-by banner becomes the green "Batch planned" one with "Edit plan". ?plan=open opens the
// panel on arrival (showcase jumps); closing it drops the param.
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Banner, Button } from '../../../components/ui';
import { landsDayOf, planBatch, type GrowthView } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { useDemo } from '../../../store/demo';
import { usePickupPincode } from '../../../store/onboarding';
import { planKey, useRestockBatches, useRestockPlans, type StoredBatch } from '../../../store/restockPlan';
import { useScriptedListing } from '../../../store/timeline';
import { packPointStatus } from '../../onboarding/packpoint/status';
import { Section } from '../factory-launch/parts';
import { Tiles } from './parts';
import { RestockPlanPanel, type PlanMaker } from './RestockPlanPanel';
import { STOCKED_SKU, shortDate } from './useGrowth';

export function RestockCard({ g }: { g: GrowthView }) {
  const t = useT();
  const r = g.restock;
  const day = useDemo((s) => s.day);
  const persona = useDemo((s) => s.persona);
  const listing = useScriptedListing();
  const pincode = usePickupPincode();
  const batches = useRestockBatches(persona, STOCKED_SKU);
  const confirmBatch = useRestockPlans((s) => s.confirm);
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get('plan') === 'open');

  // The last confirmed batch, while it hasn't landed yet, is "planned"; one that has landed is history.
  const last = batches[batches.length - 1] ?? null;
  const pending = last && day < landsDayOf(last) ? last : null;
  const earlier = useMemo(() => (pending ? batches.slice(0, -1) : batches), [pending, batches]);
  const maker: PlanMaker | null = listing
    ? { name: listing.name, leadTimeDays: listing.leadTimeDays, minRun: listing.minRun, makingCost: listing.makingCost, fulfilment: listing.fulfilment, pincode }
    : null;
  const planned = pending && maker ? planBatch({ base: g.stockBase, units: pending.units, startDay: pending.startDay, leadTimeDays: pending.leadTimeDays, makingCost: maker.makingCost, minRun: maker.minRun, earlier }) : null;
  const ppCity = pending?.shipFrom === 'packPoint' ? (packPointStatus(pincode)?.node.city ?? null) : null;

  const close = useCallback(() => {
    setOpen(false);
    if (params.has('plan')) {
      setParams(
        (p) => {
          p.delete('plan');
          return p;
        },
        { replace: true },
      );
    }
  }, [params, setParams]);
  const onConfirm = (b: StoredBatch) => {
    confirmBatch(planKey(persona, STOCKED_SKU), b, pending !== null);
    close();
  };

  return (
    <Section
      c2m="GL-2"
      className="mt-3"
      title={t('gl.restock.title')}
      right={<p className="m-0 p-0 text-body-small leading-4 text-neutral-tertiary">{t('gl.restock.sub', { from: shortDate(g.weekFrom), to: shortDate(g.weekTo) })}</p>}
    >
      <div className="px-4 pb-4 flex flex-col gap-3" data-restock>
        <Tiles
          tiles={[
            { key: 'runRate', label: t('gl.restock.runRate'), value: t('gl.restock.runRateValue', { n: fmt(g.runRate) }), info: t('gl.restock.runRateTip') },
            { key: 'onHand', label: t('gl.restock.onHand'), value: fmt(g.onHand), sub: t('gl.restock.cover', { days: fmt(r.coverDays) }) },
            { key: 'reorder', label: t('gl.restock.reorder'), value: fmt(r.reorderPoint), info: t('gl.restock.reorderTip') },
            {
              key: 'batch',
              label: t('gl.restock.batch'),
              value: t('gl.restock.batchValue', { n: fmt(r.nextBatch) }),
              sub: t('gl.restock.batchCost', { cost: fmt(r.batchAtCost) }),
              info: t('gl.restock.batchTip'),
            },
          ]}
        />
        {planned ? (
          <div data-c2m="GL-2" data-c2m-id="GL-2" data-restock-planned>
            <Banner
              tone="success"
              action={
                <Button size="sm" variant="outline" onClick={() => setOpen(true)} data-plan-edit>
                  {t('gl.plan.edit')}
                </Button>
              }
            >
              <span className="font-button">{t('gl.plan.planned')}</span>
              {' · '}
              {t('gl.plan.plannedDetail', { n: fmt(planned.units), start: shortDate(planned.startsOn), lands: shortDate(planned.landsOn) })}
              {ppCity && ` ${t('gl.plan.plannedAtPackPoint', { city: ppCity })}`}
            </Banner>
          </div>
        ) : (
          <Banner
            tone="info"
            action={
              <Button size="sm" onClick={() => setOpen(true)} disabled={!maker} data-plan-open>
                {t('gl.restock.plan')}
              </Button>
            }
          >
            <span className="font-button" data-start-by>
              {t('gl.restock.startBy', { n: fmt(r.nextBatch), date: shortDate(r.startBy) })}
            </span>
            {' · '}
            {t('gl.restock.lands', { date: shortDate(r.landsOn), left: fmt(r.leftOnLanding) })}
          </Banner>
        )}
      </div>
      {maker && open && <RestockPlanPanel open={open} onClose={close} g={g} maker={maker} initial={pending} earlier={earlier} onConfirm={onConfirm} />}
    </Section>
  );
}
