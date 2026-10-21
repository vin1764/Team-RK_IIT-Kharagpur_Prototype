// GL-6: "What to make instead" under a SKU whose verdict is Stop (or Switch): open-gap product types
// on the maker's line, largest gap first (engine switchSuggestions via growthAt). "Plan a lot" is a
// prototype stub.
import { Button, Pill, cx } from '../../../components/ui';
import { notInPrototype } from '../../../components/Toast';
import type { GrowthView } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { T } from '../manage-pricing/crystal';
import { Thumb } from './parts';

const CONFIDENCE_TONE = { High: 'success', Medium: 'warning', Low: 'error' } as const;

export function SwitchPanel({ suggestions }: { suggestions: GrowthView['switchTo'][string] }) {
  const t = useT();
  if (!suggestions?.length) return null;
  return (
    <div className="mt-3 rounded-8 border border-solid border-neutral-light bg-neutral-base" data-c2m="GL-6" data-switch>
      <div className="px-4 pt-4 pb-2">
        <h3 className={T.h3}>{t('gl.switch.title')}</h3>
        <p className={cx(T.bodySm, 'mt-1 text-neutral-tertiary')}>{t('gl.switch.sub')}</p>
      </div>
      <ul className="m-0 p-0 list-none">
        {suggestions.map((s) => (
          <li key={s.type} data-suggestion={s.type} className="flex items-center gap-3 px-4 py-3 border-0 border-t border-solid border-neutral-light">
            <Thumb />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <p className={cx(T.bodyMd, 'font-medium text-neutral-primary')}>{s.name}</p>
              <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.switch.gap', { n: fmt(s.gapPerWeek.low) })}</p>
            </div>
            <Pill tone={CONFIDENCE_TONE[s.confidence]} bordered className="!text-body-small whitespace-nowrap">
              {t('gl.switch.confidence', { c: t(`confidence.${s.confidence}`) })}
            </Pill>
            <Button size="sm" variant="outline" onClick={() => notInPrototype(`${t('gl.switch.plan')}: ${s.name}`)}>
              {t('gl.switch.plan')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
