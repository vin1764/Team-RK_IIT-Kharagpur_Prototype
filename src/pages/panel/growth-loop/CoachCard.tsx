// GL-3 / GL-4: SKU Health Coach, "this week's one fix". One SKU, one cause, one fix, one tap, in the
// demo language. The trigger that fired stays inside the engine: the maker sees only the click-through
// against similar listings and the fix. Two sizes: the Business Dashboard card (with the SKU's own
// last-7-days funnel) and the compact Home right-rail card that links to it.
// After the week (engine coachFollowUp, src/engine/growth.ts):
//  - "Change main photo" opens the panel (ChangePhotoPanel) and "Apply" stores the new photo (src/store/coachFix.ts);
//  - applied → green "Fix applied · main photo changed on <date> · we'll check again next week", no new fix;
//  - a week after applying → the SKU's next 7 days (views, clicks, orders, conversion), "Click-through up from
//    1.6% to 3.9%", then the next fix or "No fix needed this week";
//  - not applied a week after it was given → the same fix, "Still pending".
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { Banner, Button, Pill, cx } from '../../../components/ui';
import { dayLabel, type CoachCard as Coach, type CoachFollowUp, type GrowthView } from '../../../engine/ui';
import { fmt, useT } from '../../../i18n';
import { dashDate } from '../business-dashboard/dates';
import { T } from '../manage-pricing/crystal';
import { ChangePhotoPanel } from './ChangePhotoPanel';
import { Thumb, Tiles, useSkuImage } from './parts';

/** Business Dashboard, at the top, above Business Overview and its funnel tiles. */
export function DashboardCoachCard({ g }: { g: GrowthView }) {
  const t = useT();
  const [panel, setPanel] = useState(false);
  const c = g.coach;
  const f = g.coachFollowUp;
  const skuId = f?.skuId ?? c?.skuId ?? '';
  const image = useSkuImage(skuId);
  if (!c && !f) return null;
  const stage = f?.stage ?? 'fix';
  const showsFix = !!c && (stage === 'fix' || stage === 'pending' || (stage === 'result' && c.skuId !== f?.skuId));
  const period =
    stage === 'result' && f?.resultFrom && f.resultTo
      ? t('gl.coach.period', { from: dashDate(f.resultFrom), to: dashDate(f.resultTo) })
      : t('gl.coach.period', { from: dashDate(g.weekFrom), to: dashDate(g.weekTo) });
  return (
    <div className="p-4 bg-neutral-base mb-3" data-c2m="GL-3" data-c2m-id="GL-3" data-coach data-coach-stage={stage}>
      <div className="flex flex-row flex-nowrap items-start">
        <div className="flex flex-1 flex-col flex-nowrap">
          <div className="flex items-center gap-2">
            <h2 className={T.h2}>{t('gl.coach.title')}</h2>
            <Pill tone="brand" bordered className="!text-body-small">
              {t('gl.coach.tag')}
            </Pill>
          </div>
          <p className={cx(T.bodySm, 'mt-1 text-neutral-tertiary')}>{period}</p>
        </div>
      </div>
      <div className="rounded-8 border border-solid border-neutral-light p-4 mt-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Thumb src={image} />
          <h3 className={T.h3}>{f?.skuName ?? c?.skuName}</h3>
          {stage === 'pending' && (
            <span className="inline-flex" data-coach-pending>
              <Pill tone="warning" bordered className="!text-body-small">
                {t('gl.coach.pending')}
              </Pill>
            </span>
          )}
        </div>
        {stage === 'applied' && f && <AppliedBanner f={f} />}
        {stage === 'result' && f?.result && <ResultBlock f={f} />}
        {showsFix && c && (
          <>
            {stage !== 'result' && <CoachTiles c={c} />}
            <Banner
              tone="info"
              action={
                <Button size="sm" onClick={() => setPanel(true)} data-coach-action>
                  {t(`gl.coach.action.${c.fix.fix}`)}
                </Button>
              }
            >
              <p className="m-0 p-0 font-button" data-coach-vs>
                {t('gl.coach.vs', { ctr: c.fix.ctrDisplay, similar: c.fix.similarDisplay })}
              </p>
              <p className="m-0 p-0" data-coach-fix>
                {t(`gl.coach.fix.${c.fix.fix}`)}
              </p>
            </Banner>
          </>
        )}
        {stage === 'result' && !c && (
          <p className={cx(T.bodyMd, 'font-medium text-neutral-primary')} data-coach-none>
            {t('gl.coach.noFix')}
          </p>
        )}
      </div>
      {panel && c && <ChangePhotoPanel skuId={c.skuId} skuName={c.skuName} ctrDisplay={c.fix.ctrDisplay} onClose={() => setPanel(false)} />}
    </div>
  );
}

/** Green: the fix is applied; the coach checks again a week later. */
function AppliedBanner({ f }: { f: CoachFollowUp }) {
  const t = useT();
  return (
    <Banner tone="success">
      <p className="m-0 p-0" data-coach-applied>
        {t('gl.coach.applied', { date: dayLabel(f.appliedDay ?? f.givenDay) })}
      </p>
    </Banner>
  );
}

/** A week after the fix: the SKU's next 7 days and how click-through moved. */
function ResultBlock({ f }: { f: CoachFollowUp }) {
  const t = useT();
  const r = f.result!;
  return (
    <>
      <div data-c2m="GL-4" data-c2m-id="GL-4" data-coach-result>
        <Tiles
          tiles={[
            { key: 'views', label: t('gl.coach.views'), value: fmt(r.views) },
            { key: 'clicks', label: t('gl.coach.clicks'), value: fmt(r.clicks), sub: `(${r.ctrAfterDisplay})` },
            { key: 'orders', label: t('gl.coach.orders'), value: fmt(r.orders) },
            { key: 'conversion', label: t('gl.coach.conversion'), value: r.conversionDisplay },
          ]}
        />
      </div>
      <Banner tone={r.ctrUp ? 'success' : 'info'}>
        <p className="m-0 p-0 font-button" data-coach-ctr-change>
          {t(r.ctrUp ? 'gl.coach.ctrUp' : 'gl.coach.ctrChange', { before: r.ctrBeforeDisplay, after: r.ctrAfterDisplay })}
        </p>
        <p className="m-0 p-0">{t('gl.coach.afterFix', { date: dayLabel(f.appliedDay ?? f.givenDay) })}</p>
      </Banner>
    </>
  );
}

/** The coached SKU's own last-7-days funnel (views, clicks, orders, conversion). */
function CoachTiles({ c }: { c: Coach }) {
  const t = useT();
  return (
    <div data-c2m="GL-4" data-c2m-id="GL-4">
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
  const f = g.coachFollowUp;
  const image = useSkuImage(f?.skuId ?? c?.skuId ?? '');
  if (!c && !f) return null;
  const stage = f?.stage ?? 'fix';
  return (
    <div className="flex flex-col p-4 gap-3 bg-white rounded" data-c2m="GL-3" data-c2m-id="GL-3" data-home-coach data-coach-stage={stage}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="m-0 p-0 font-bold font-heading text-xl leading-5 text-primary-text">{t('gl.coach.title')}</h4>
        <img src="/brand/msa/merlin/filled/bulb-yellow.svg" alt="" width="24" height="24" />
      </div>
      <div className="flex items-center gap-2">
        <Thumb src={image} />
        <p className="m-0 p-0 font-semibold font-button text-lg leading-5 text-primary-text">{f?.skuName ?? c?.skuName}</p>
        {stage === 'pending' && (
          <Pill tone="warning" bordered className="!text-body-small">
            {t('gl.coach.pending')}
          </Pill>
        )}
      </div>
      {stage === 'applied' && f ? (
        <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-success-text" data-coach-applied>
          {t('gl.coach.applied', { date: dayLabel(f.appliedDay ?? f.givenDay) })}
        </p>
      ) : stage === 'result' && f?.result ? (
        <>
          <p className="m-0 p-0 font-button text-lg leading-5 text-success-text" data-coach-ctr-change>
            {t(f.result.ctrUp ? 'gl.coach.ctrUp' : 'gl.coach.ctrChange', { before: f.result.ctrBeforeDisplay, after: f.result.ctrAfterDisplay })}
          </p>
          <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text" data-coach-none>
            {c ? t(`gl.coach.fix.${c.fix.fix}`) : t('gl.coach.noFix')}
          </p>
        </>
      ) : c ? (
        <>
          <p className="m-0 p-0 font-button text-lg leading-5 text-primary-text" data-coach-vs>
            {t('gl.coach.vs', { ctr: c.fix.ctrDisplay, similar: c.fix.similarDisplay })}
          </p>
          <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text" data-coach-fix>
            {t(`gl.coach.fix.${c.fix.fix}`)}
          </p>
        </>
      ) : null}
      <div className="flex items-center gap-2 cursor-pointer" role="button" onClick={() => navigate(paths.businessDashboard)}>
        <span className="m-0 p-0 font-semibold font-button text-lg leading-5 text-brand-primary-text">{t('gl.coach.open')}</span>
        <img src="/brand/msa/merlin/lined/chevron-right-blue.svg" alt="" width="16" height="16" />
      </div>
    </div>
  );
}
