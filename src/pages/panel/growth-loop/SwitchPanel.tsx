// GL-6: "What to make instead" under a SKU whose verdict is Stop (or Switch): open-gap product types
// on the maker's line, largest gap first (engine switchSuggestions via growthAt). "Plan a lot" opens the lot panel
// (LotPlanPanel); a saved plan shows on the suggestion as the green "Lot planned · 80 units · ready 26 Nov" banner
// with "Edit" (src/store/lotPlans.ts). ?lot=<product type> opens the panel on arrival (showcase jumps); closing it
// drops the param. "List it with photos" opens Create from photos with that product type.
import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { paths } from '../../../app/paths';
import { Banner, Button, Pill, cx } from '../../../components/ui';
import { dayToDate, landsDayOf, type GrowthView, type ProductTypeId } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { useDemo } from '../../../store/demo';
import { lotKey, useLotPlans, type StoredLot } from '../../../store/lotPlans';
import { useScriptedListing } from '../../../store/timeline';
import { BOT_QUERY, botTypeFor } from '../catalog/bot';
import { T } from '../manage-pricing/crystal';
import { CONFIDENCE_TONE, LotPlanPanel, type LotMaker } from './LotPlanPanel';
import { Thumb } from './parts';
import { shortDate } from './useGrowth';

/** Query param that opens "Plan a lot" for one suggestion: Inventory ?stock=all_stock&lot=steel-casserole-1-5l. */
export const LOT_PARAM = 'lot';

/** Create from photos for a product type the maker picked here (AddSingleCategory reads `type`). */
export const listWithPhotosUrl = (type: ProductTypeId) => `${paths.addSingleCategory}?${BOT_QUERY}&type=${type}`;

export function SwitchPanel({ suggestions }: { suggestions: GrowthView['switchTo'][string] | undefined }) {
  const t = useT();
  const navigate = useNavigate();
  const day = useDemo((s) => s.day);
  const persona = useDemo((s) => s.persona);
  const listing = useScriptedListing();
  const plans = useLotPlans((s) => s.plans);
  const saveLot = useLotPlans((s) => s.save);
  const [params, setParams] = useSearchParams();
  const asked = params.get(LOT_PARAM);
  const [open, setOpen] = useState<ProductTypeId | null>(suggestions?.some((s) => s.type === asked) ? (asked as ProductTypeId) : null);
  // His own lead time and minimum run (his live listing), as on the restock plan.
  const maker: LotMaker | null = listing ? { leadTimeDays: listing.leadTimeDays, minRun: listing.minRun } : null;

  const close = useCallback(() => {
    setOpen(null);
    if (params.has(LOT_PARAM)) {
      setParams(
        (p) => {
          p.delete(LOT_PARAM);
          return p;
        },
        { replace: true },
      );
    }
  }, [params, setParams]);

  if (!suggestions?.length) return null;
  const save = (type: ProductTypeId, lot: StoredLot) => {
    saveLot(lotKey(persona, type), lot);
    close();
  };

  return (
    <div className="mt-3 rounded-8 border border-solid border-neutral-light bg-neutral-base" data-c2m="GL-6" data-c2m-id="GL-6" data-switch>
      <div className="px-4 pt-4 pb-2">
        <h3 className={T.h3}>{t('gl.switch.title')}</h3>
        <p className={cx(T.bodySm, 'mt-1 text-neutral-tertiary')}>{t('gl.switch.sub')}</p>
      </div>
      <ul className="m-0 p-0 list-none">
        {suggestions.map((s) => {
          const plan = plans[lotKey(persona, s.type)];
          return (
            <li key={s.type} data-suggestion={s.type} className="flex flex-col gap-3 px-4 py-3 border-0 border-t border-solid border-neutral-light">
              <div className="flex items-center gap-3">
                <Thumb />
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className={cx(T.bodyMd, 'font-medium text-neutral-primary')}>{s.name}</p>
                  <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.switch.gap', { n: fmt(s.gapPerWeek.low) })}</p>
                </div>
                <Pill tone={CONFIDENCE_TONE[s.confidence]} bordered className="!text-body-small whitespace-nowrap">
                  {t('gl.switch.confidence', { c: t(`confidence.${s.confidence}`) })}
                </Pill>
                {!plan && (
                  <Button size="sm" variant="outline" onClick={() => setOpen(s.type)} disabled={!maker} data-lot-open={s.type}>
                    {t('gl.switch.plan')}
                  </Button>
                )}
              </div>
              {plan && (
                <div data-c2m="GL-6" data-c2m-id="GL-6" data-lot-planned={s.type}>
                  <Banner
                    tone="success"
                    action={
                      <Button size="sm" variant="outline" onClick={() => setOpen(s.type)} disabled={!maker} data-lot-edit={s.type}>
                        {t('gl.lot.edit')}
                      </Button>
                    }
                  >
                    <span className="font-button">{t('gl.lot.planned')}</span>
                    {' · '}
                    {t('gl.lot.plannedDetail', { n: fmt(plan.units), date: shortDate(dayToDate(landsDayOf(plan))) })}
                  </Banner>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {open && maker && (
        <LotPlanPanel
          key={open}
          type={open}
          day={day}
          maker={maker}
          initial={plans[lotKey(persona, open)] ?? null}
          onClose={close}
          onSave={(lot) => save(open, lot)}
          onList={() => navigate(listWithPhotosUrl(open))}
          canList={!!botTypeFor(open)}
        />
      )}
    </div>
  );
}
