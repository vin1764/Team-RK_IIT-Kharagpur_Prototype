// Screen 2 · Quantity (LB-5, doc p.15): the maker's factory (minimum run, lead time) and the first lot. The bot
// suggests ≈ 2 weeks of sales (or his minimum run when that is larger); the reasoning sits behind the (i) next to
// "First lot · 150 suggested". Any number goes, with a soft warning below his own minimum run. No market totals here.
import { Banner } from '../../../../components/ui';
import { fmt, useT } from '../../../../i18n';
import { lotTip, numberIn } from '../bot';
import { NumberBox, QField, QRow, StepCard } from './Bits';
import type { BotModel } from './useBotModel';

export function QuantityStep({ m }: { m: BotModel }) {
  const t = useT();
  const v = m.values;
  const lot = m.lot;
  const inventory = m.inventory;
  const minRun = numberIn(v.minRun);
  return (
    <div data-testid="botStep-quantity">
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
      <StepCard c2m="LB-5" testId="lotCard">
        <QRow testId="row-lot">
          <QField label={lot ? t('qty.lotSuggested', { units: fmt(lot.units) }) : t('qty.lot')} info={lot ? lotTip(t, lot, m.makingCost, fmt) : undefined} infoTestId="lotInfo">
            <NumberBox value={m.row.inventory} onChange={(x) => m.setPrice({ inventory: x })} suffix={t('unit.units')} width="w-40" ariaLabel={t('qty.lot')} testId="in-inventory" />
          </QField>
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
