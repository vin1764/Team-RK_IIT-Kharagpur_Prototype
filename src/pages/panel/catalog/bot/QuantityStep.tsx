// Screen 2 · Quantity (LB-5, doc p.15): the demand card, the maker's factory (minimum run, lead time) and the
// first lot (bot suggests ≈ 2 weeks of sales; any number goes, a soft warning below the minimum run).
import { Banner } from '../../../../components/ui';
import type { ProductTypeId } from '../../../../engine/ui';
import { fmt, useT } from '../../../../i18n';
import { numberIn } from '../bot';
import { DemandCard, lotBasis } from '../BotPrice';
import { NumberBox, QField, QRow, StepCard } from './Bits';
import type { BotModel } from './useBotModel';

export function QuantityStep({ m, type }: { m: BotModel; type: ProductTypeId }) {
  const t = useT();
  const v = m.values;
  const lot = m.lot;
  const inventory = m.inventory;
  const minRun = numberIn(v.minRun);
  return (
    <div data-testid="botStep-quantity">
      <StepCard c2m="LB-5" testId="demandWrap">
        <DemandCard type={type} className="mt-0" />
      </StepCard>
      <StepCard title={t('qty.factory')} c2m="LB-6" testId="factoryCard">
        <QRow testId="row-factory">
          <QField label={t('qty.minRun')} info={t('tip.minRun')}>
            <NumberBox value={v.minRun ?? ''} onChange={(x) => m.setValue('minRun', x)} suffix={t('unit.units')} width="w-40" placeholder={m.typical ? fmt(m.typical.minRun) : undefined} ariaLabel={t('qty.minRun')} testId="in-minRun" />
          </QField>
          <QField label={t('qty.leadTime')} info={t('tip.leadTimeDays')}>
            <NumberBox value={v.leadTimeDays ?? ''} onChange={(x) => m.setValue('leadTimeDays', x)} suffix={t('unit.days')} width="w-40" placeholder={m.typical ? fmt(m.typical.leadTimeDays) : undefined} ariaLabel={t('qty.leadTime')} testId="in-leadTimeDays" />
          </QField>
        </QRow>
      </StepCard>
      <StepCard title={t('qty.lot')} c2m="LB-5" testId="lotCard">
        <QRow testId="row-lot">
          <div className="flex flex-wrap items-center gap-3">
            <NumberBox value={m.row.inventory} onChange={(x) => m.setPrice({ inventory: x })} suffix={t('unit.units')} width="w-40" ariaLabel={t('qty.lot')} testId="in-inventory" />
            {lot && (
              <p className="m-0 min-w-0 flex-1 font-body text-lg leading-5 text-secondary-text" data-testid="lotLine">
                <span className={inventory !== lot.units ? 'font-button' : undefined}>{t('lot.suggestUnits', { units: fmt(lot.units) })}</span> · {lotBasis(t, lot, m.makingCost)}
              </p>
            )}
          </div>
        </QRow>
        {inventory !== null && inventory > 0 && minRun !== null && inventory < minRun && (
          <Banner tone="info" className="mt-4">
            <span data-testid="belowMinRun">{t('lot.belowMinRun', { units: fmt(inventory), minRun: fmt(minRun) })}</span>
          </Banner>
        )}
      </StepCard>
    </div>
  );
}
