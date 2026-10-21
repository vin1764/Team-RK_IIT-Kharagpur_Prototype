// GL-3 / GL-4: SKU Health Coach, "this week's one fix". One SKU, one cause, one fix, one tap, in the
// demo language. The trigger that fired stays inside the engine: the maker sees only the click-through
// against similar listings and the fix. Two sizes: the Business Dashboard card (with the SKU's own
// last-7-days funnel) and the compact Home right-rail card that links to it.
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { Banner, Button, Pill, cx } from '../../../components/ui';
import { notInPrototype } from '../../../components/Toast';
import type { CoachCard as Coach, GrowthView } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { dashDate } from '../business-dashboard/dates';
import { T } from '../manage-pricing/crystal';
import { THUMBS, Thumb, Tiles } from './parts';

/** Business Dashboard, at the top, above Business Overview and its funnel tiles. */
export function DashboardCoachCard({ g }: { g: GrowthView }) {
  const t = useT();
  const c = g.coach;
  if (!c) return null;
  const action = t(`gl.coach.action.${c.fix.fix}`);
  return (
    <div className="p-4 bg-neutral-base mb-3" data-c2m="GL-3" data-coach>
      <div className="flex flex-row flex-nowrap items-start">
        <div className="flex flex-1 flex-col flex-nowrap">
          <div className="flex items-center gap-2">
            <h2 className={T.h2}>{t('gl.coach.title')}</h2>
            <Pill tone="brand" bordered className="!text-body-small">
              {t('gl.coach.tag')}
            </Pill>
          </div>
          <p className={cx(T.bodySm, 'mt-1 text-neutral-tertiary')}>{t('gl.coach.period', { from: dashDate(g.weekFrom), to: dashDate(g.weekTo) })}</p>
        </div>
      </div>
      <div className="rounded-8 border border-solid border-neutral-light p-4 mt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Thumb src={THUMBS[c.skuId]} />
          <h3 className={T.h3}>{c.skuName}</h3>
        </div>
        <CoachTiles c={c} />
        <Banner
          tone="info"
          action={
            <Button size="sm" onClick={() => notInPrototype(action)}>
              {action}
            </Button>
          }
        >
          <p className="m-0 p-0 font-semibold" data-coach-vs>
            {t('gl.coach.vs', { ctr: c.fix.ctrDisplay, similar: c.fix.similarDisplay })}
          </p>
          <p className="m-0 p-0" data-coach-fix>
            {t(`gl.coach.fix.${c.fix.fix}`)}
          </p>
        </Banner>
      </div>
    </div>
  );
}

/** The coached SKU's own last-7-days funnel (views, clicks, orders, conversion). */
function CoachTiles({ c }: { c: Coach }) {
  const t = useT();
  return (
    <div data-c2m="GL-4">
      <Tiles
        tiles={[
          { key: 'views', label: t('gl.coach.views'), value: fmt(c.views) },
          { key: 'clicks', label: t('gl.coach.clicks'), value: fmt(c.clicks), sub: `(${c.fix.ctrDisplay})` },
          { key: 'orders', label: t('gl.coach.orders'), value: fmt(c.orders) },
          { key: 'conversion', label: t('gl.coach.conversion'), value: c.conversionDisplay },
        ]}
      />
    </div>
  );
}

/** Home right rail: compact "This week's one fix", linking to the Business Dashboard card. */
export function HomeCoachCard({ g }: { g: GrowthView }) {
  const t = useT();
  const navigate = useNavigate();
  const c = g.coach;
  if (!c) return null;
  return (
    <div className="flex flex-col p-4 gap-3 bg-white rounded" data-c2m="GL-3" data-home-coach>
      <div className="flex items-center justify-between gap-2">
        <h4 className="m-0 p-0 font-bold font-heading text-xl leading-5 text-primary-text">{t('gl.coach.title')}</h4>
        <img src="/brand/msa/merlin/filled/bulb-yellow.svg" alt="" width="24" height="24" />
      </div>
      <div className="flex items-center gap-2">
        <Thumb src={THUMBS[c.skuId]} />
        <p className="m-0 p-0 font-semibold font-button text-lg leading-5 text-primary-text">{c.skuName}</p>
      </div>
      <p className="m-0 p-0 font-semibold font-body text-lg leading-5 text-primary-text" data-coach-vs>
        {t('gl.coach.vs', { ctr: c.fix.ctrDisplay, similar: c.fix.similarDisplay })}
      </p>
      <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text" data-coach-fix>
        {t(`gl.coach.fix.${c.fix.fix}`)}
      </p>
      <div className="flex items-center gap-2 cursor-pointer" role="button" onClick={() => navigate(paths.businessDashboard)}>
        <span className="m-0 p-0 font-semibold font-button text-lg leading-5 text-brand-primary-text">{t('gl.coach.open')}</span>
        <img src="/brand/msa/merlin/lined/chevron-right-blue.svg" alt="" width="16" height="16" />
      </div>
    </div>
  );
}
