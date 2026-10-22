// FO-5 · the 5-minute cost check, inline on the onboarding finish screen (it used to be its own page reached
// from the outreach link), for every seller. He decides his own take-home: his cost per unit (making cost if he makes
// it, buying cost if he buys it) and what he wants to earn per unit (₹, or % of that cost), both empty until he types. Then the fee stack with his shipping choice from Pickup
// Address (FO-8) → break-even, and "Your price ₹X · you earn ₹Y per unit". Whether that price qualifies for Factory
// Launch comes only from "Check price": the bot's rationed check (3 a day per product, shared with the bot's Price
// screen through store/priceChecks.ts; rules in panel/catalog/launchCheck.ts). Benchmark B is never shown.
// The arithmetic: ./costCheck.ts → engine costStackAtTakeHome.
import { Banner, Button, Card, cx } from '../../../components/ui';
import { fmt, tEn as t } from '../../../i18n';
import { typeFees, type ProductTypeId } from '../../../engine/ui';
import { usePriceCheckEntry } from '../../../store/priceChecks';
import type { PersonaRecord } from '../../../store/onboarding';
import { launchCheckView } from '../../panel/catalog/launchCheck';
import { Field } from '../signup/Field';
import { DemoFill } from '../stepper/fields';
import { FIN } from './copy';
import { cleanPct, cleanRupees, costCheckResult, switchUnit, type EarnUnit } from './costCheck';

/** Fee stack mode: the maker's Pickup Address choice (else their record); Pack Point for a type with no self-ship packaging value. */
export function finishMode(choice: 'selfShip' | 'packPoint' | 'waitlist' | null, persona: Pick<PersonaRecord, 'fulfilment'>, type: ProductTypeId): 'selfShip' | 'packPoint' {
  if ((choice ?? persona.fulfilment) === 'packPoint') return 'packPoint';
  return typeFees(type).packaging === null ? 'packPoint' : 'selfShip';
}

/** True when the engine has a fee card for the type (the cost check can run). */
export function hasFeeCard(type: ProductTypeId): boolean {
  try {
    typeFees(type);
    return true;
  } catch {
    return false;
  }
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={strong ? 'flex justify-between font-heading text-xl leading-6' : 'flex justify-between text-lg leading-5'}>
      <span className={strong ? undefined : 'text-secondary-text'}>{label}</span>
      <span>₹{fmt(value)}</span>
    </div>
  );
}

/** The ₹ / % switch, in the bot's EN / हिंदी pill style. */
function UnitSwitch({ unit, onUnit }: { unit: EarnUnit; onUnit: (u: EarnUnit) => void }) {
  return (
    <div className="flex shrink-0 items-center rounded-full border border-solid border-secondary-border bg-white p-0.5" role="group" aria-label={t('cost.unit')} data-earn-unit={unit}>
      {(['rupee', 'pct'] as const).map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={unit === u}
          onClick={() => onUnit(u)}
          className={cx('cursor-pointer rounded-full border-0 px-3 py-1 font-button text-lg leading-5', unit === u ? 'bg-brand-secondary-bg text-brand-primary-text' : 'bg-transparent text-secondary-text')}
          data-unit={u}
        >
          {u === 'rupee' ? '₹' : '%'}
        </button>
      ))}
    </div>
  );
}

export interface CostInputs {
  making: string;
  earning: string;
  unit: EarnUnit;
}

export function CostCheckInline({
  type,
  mode,
  value,
  onChange,
  onDemoFill,
}: {
  type: ProductTypeId;
  mode: 'selfShip' | 'packPoint';
  value: CostInputs;
  onChange: (v: CostInputs) => void;
  /** "Fill demo values" (the persona's own product only) */
  onDemoFill?: () => void;
}) {
  const { making, earning, unit } = value;
  const result = costCheckResult({ type, mode, making, earning, unit });
  const { entry, day, check } = usePriceCheckEntry(type);
  const v = launchCheckView({ type, price: result?.price ?? null, stack: result?.stack ?? null, entry, day, botOwned: false });

  const s = result?.stack;
  const rate = s ? fmt(Math.round(s.gstRate * 100)) : '';
  const rows = s
    ? [
        { label: t('cost.row.making'), value: s.makingCost },
        s.fees.packPointFee !== undefined ? { label: t('cost.row.packPointFee'), value: s.fees.packPointFee } : { label: t('cost.row.packaging'), value: s.fees.packaging ?? 0 },
        { label: t('cost.row.shipping'), value: s.fees.shippingAndFixed },
        { label: t('cost.row.returns'), value: s.fees.returnsBuffer },
        // Q18: GST is 5% of the selling price, included in it: the GST inside his price.
        { label: t('cost.row.gst', { rate, price: fmt(s.listPrice) }), value: s.fees.gst },
      ]
    : [];

  const left = v.checksLeft === 0 ? t('launch.none') : v.checksLeft === 1 ? t('launch.leftOne') : t('launch.left', { n: fmt(v.checksLeft) });
  let status;
  if (v.state === 'qualifies') status = <Banner tone="success">{t('cost.launch.qualifies')}</Banner>;
  else if (v.state === 'aboveCap') status = <Banner tone="info">{t('cost.launch.notEligible')}</Banner>;
  else if (v.state === 'belowCost') status = <Banner tone="error">{t('launch.loss', { loss: fmt(v.loss ?? 0) })}</Banner>;
  else
    status = (
      <div className="flex items-center gap-2.5 rounded-lg bg-secondary-bg px-3 py-2.5">
        <img src="/brand/msa/merlin/lined/info-grey.svg" alt="" width="20" height="20" className="size-5 shrink-0" />
        <p className="m-0 flex-1 font-body text-lg leading-5 text-primary-text">{t('cost.launch.stale')}</p>
        <Button size="sm" variant="outline" className="shrink-0" disabled={!v.canCheck} onClick={() => result && check(result.price, result.stack.breakEven)} data-cost-check-price>
          {t('launch.check')}
        </Button>
      </div>
    );

  return (
    <section className="rounded bg-white p-6" data-c2m="FO-5" data-c2m-id="FO-5" data-cost-check data-cost-state={result ? 'filled' : 'empty'}>
      <h2 className="m-0 font-heading text-2xl leading-6 text-primary-text">{FIN.costTitle}</h2>
      <p className="m-0 mt-1 text-lg leading-5 text-secondary-text">{FIN.costSub(mode)}</p>
      <div className="mt-5 grid grid-cols-[300px_1fr_1fr] items-start gap-4 max-[1023px]:grid-cols-1">
        <div className="flex flex-col gap-4">
          <div>
            <Field
              label={t('cost.yourCost')}
              labelBg="bg-white"
              prefix="₹"
              inputMode="numeric"
              autoComplete="off"
              value={making}
              onChange={(e) => onChange({ ...value, making: cleanRupees(e.target.value) })}
              data-making-cost
            />
            <p className="m-0 mt-1 text-sm leading-4 text-tertiary-text">{t('cost.yourCost.hint')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Field
              className="min-w-0 flex-1"
              label={t('cost.earning')}
              labelBg="bg-white"
              alwaysFloat
              prefix={unit === 'rupee' && earning !== '' ? '₹' : undefined}
              placeholder={t(unit === 'rupee' ? 'cost.earning.placeholder.rupee' : 'cost.earning.placeholder.pct')}
              inputMode={unit === 'rupee' ? 'numeric' : 'decimal'}
              autoComplete="off"
              value={earning}
              onChange={(e) => onChange({ ...value, earning: unit === 'rupee' ? cleanRupees(e.target.value) : cleanPct(e.target.value) })}
              data-earning
            />
            {unit === 'pct' && earning !== '' && <span className="text-xl text-primary-text">%</span>}
            <UnitSwitch unit={unit} onUnit={(u) => u !== unit && onChange({ making, unit: u, earning: switchUnit(making, earning, u) })} />
          </div>
          <p className="m-0 text-sm leading-4 text-tertiary-text" data-fees-note={mode}>
            {t(mode === 'packPoint' ? 'cost.feesNote.packPoint' : 'cost.feesNote.selfShip')}
          </p>
          {onDemoFill && <DemoFill onClick={onDemoFill}>{t('bot.fillDemo')}</DemoFill>}
        </div>
        {!result || !s ? (
          <Card className="col-span-2 border border-solid border-tertiary-border text-lg leading-5 text-secondary-text max-[1023px]:col-span-1">{t('cost.enter')}</Card>
        ) : (
          <>
            <Card className="border border-solid border-tertiary-border">
              <h3 className="m-0 font-heading text-xl leading-6">{FIN.feeStack}</h3>
              <div className="mt-3 flex flex-col gap-2" data-fee-stack>
                {rows.map((r) => (
                  <Row key={r.label} {...r} />
                ))}
              </div>
              <hr className="m-0 my-3 border-0 border-t border-solid border-tertiary-border" />
              <div data-break-even={s.breakEven}>
                <Row label={FIN.breakEven} value={s.breakEven} strong />
              </div>
            </Card>
            <Card className="border border-solid border-tertiary-border">
              <h3 className="m-0 font-heading text-xl leading-6">{t('cost.priceTitle')}</h3>
              <p className="m-0 mt-3 font-heading text-xl leading-6 text-primary-text" data-your-price={result.price} data-earn={result.takeHome}>
                {t('cost.yourPrice', { price: fmt(result.price), take: fmt(result.takeHome) })}
              </p>
              <p className="m-0 mt-1 text-base leading-4 text-tertiary-text">{t('cost.priceHow', { rate })}</p>
              <div className="mt-4" data-cost-launch={v.state}>
                {status}
                {v.state !== 'belowCost' && (
                  <p className="m-0 mt-1.5 font-body text-base leading-4 text-secondary-text" data-checks-left={v.checksLeft}>
                    {left}
                  </p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}
