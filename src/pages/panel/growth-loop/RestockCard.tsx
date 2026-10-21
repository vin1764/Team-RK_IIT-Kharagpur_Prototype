// GL-2: the restock card under the bottle on Inventory → Low Stock. Every value is the D28 snapshot
// from growthAt(): run-rate of the last 7 days, on hand, days of cover, reorder point, next batch
// (and its cost at the making cost), start-by date, landing date and units left when it lands.
import { Banner, Button } from '../../../components/ui';
import { notInPrototype } from '../../../components/Toast';
import type { GrowthView } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { Section } from '../factory-launch/parts';
import { Tiles } from './parts';
import { shortDate } from './useGrowth';

export function RestockCard({ g }: { g: GrowthView }) {
  const t = useT();
  const r = g.restock;
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
        <Banner
          tone="info"
          action={
            <Button size="sm" onClick={() => notInPrototype(t('gl.restock.plan'))}>
              {t('gl.restock.plan')}
            </Button>
          }
        >
          <span className="font-semibold" data-start-by>
            {t('gl.restock.startBy', { n: fmt(r.nextBatch), date: shortDate(r.startBy) })}
          </span>
          {' · '}
          {t('gl.restock.lands', { date: shortDate(r.landsOn), left: fmt(r.leftOnLanding) })}
        </Banner>
      </div>
    </Section>
  );
}
