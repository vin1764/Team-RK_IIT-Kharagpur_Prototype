// "Create from photos" as three short screens (team redesign spec): Add Single Catalog → add-product-details
// ?mode=photos&step=product|quantity|price. One screen at a time, Back / Next at the bottom, Next disabled until the
// screen's maker fields are done; Go live on Price. The step is kept in the draft (rk-draft-v1) across reloads.
// "Switch to full form" (&view=form) opens today's details form on the same draft.
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { paths } from '../../../../app/paths';
import { toast } from '../../../../components/Toast';
import { Button } from '../../../../components/ui';

import { useT } from '../../../../i18n';
import { useCatalog } from '../../../../store/catalog';
import { useDemo } from '../../../../store/demo';
import { BOT_FILLED_COUNT, BOT_QUERY, BOT_STEPS, isBotStep, numberIn, reachableStep, takeHomeShown, type BotStep } from '../bot';
import { draftJump } from '../draftStore';
import { BotLayout } from './BotLayout';
import { CompareFormsModal } from './CompareFormsModal';
import { PriceStep } from './PriceStep';
import { ProductStep } from './ProductStep';
import { QuantityStep } from './QuantityStep';
import { useBotModel } from './useBotModel';

export const botStepUrl = (step: BotStep) => `${paths.addSingleDetails}?${BOT_QUERY}&step=${step}`;
export const botFullFormUrl = `${paths.addSingleDetails}?${BOT_QUERY}&view=form`;

export default function BotFlow() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const m = useBotModel();
  const t = useT();
  const day = useDemo((s) => s.day);
  const personaId = useDemo((s) => s.persona);
  const [compare, setCompare] = useState(false);
  const leaving = useRef(false);
  const d = m.d;

  // URL step wins; else the draft's; never past the first screen whose fields aren't done. The details review gates
  // Next and the stepper tabs (reachWithReview), not the URL: a Packer change on Price keeps him on Price.
  const asked = params.get('step');
  const wanted: BotStep = isBotStep(asked) ? asked : d.botStep;
  const reach = reachableStep(m.stepState);
  const reachWithReview = reachableStep(m.reviewState);
  const step: BotStep = BOT_STEPS.indexOf(wanted) > BOT_STEPS.indexOf(reach) ? reach : wanted;
  const idx = BOT_STEPS.indexOf(step);

  useEffect(() => {
    if (leaving.current || (draftJump.pending && !d.images.length)) return;
    if (params.get('step') !== step) {
      const next = new URLSearchParams(params);
      next.set('step', step);
      setParams(next, { replace: true });
    }
    if (d.botStep !== step) d.setBot({ botStep: step });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  if (leaving.current || (draftJump.pending && !d.images.length)) return null;
  if (!d.images.length || !m.type) return <Navigate to={`${paths.addSingleCategory}?${BOT_QUERY}`} replace />;
  const type = m.type;

  const goTo = (s: BotStep) => {
    const next = new URLSearchParams(params);
    next.set('step', s);
    setParams(next);
  };
  const canOpen = (s: BotStep) => BOT_STEPS.indexOf(s) <= Math.max(BOT_STEPS.indexOf(reachWithReview), idx);

  const leave = (to: string) => {
    leaving.current = true;
    navigate(to);
    d.reset();
  };

  const goLive = () => {
    const { checks, stack, price, inventory, makingCost, margin, values } = m;
    if (!checks.all || !stack || !price || !inventory || makingCost === null || margin === null) return;
    useCatalog.getState().addListing({
      typeId: type,
      name: values.productName ?? '',
      price,
      breakEven: stack.breakEven,
      takeHome: takeHomeShown(price, stack),
      inventory,
      minRun: numberIn(values.minRun) ?? 0,
      leadTimeDays: numberIn(values.leadTimeDays) ?? 0,
      makingCost,
      marginPct: margin,
      fulfilment: m.mode,
      createdDay: day,
      persona: personaId,
      ...(d.botReview ? { reviewedAt: { day: d.botReview.day, time: d.botReview.time } } : {}),
    });
    toast(t('check.toast'));
    leave(paths.catalogUploadsSingle);
  };

  const back = () => (idx === 0 ? navigate(paths.home) : goTo(BOT_STEPS[idx - 1]!));
  // Product's Next: review first (the bot's details), then his own questions.
  const nextBlocked =
    step !== 'product' || m.done.product
      ? null
      : !m.reviewed
        ? t('flow.nextNeedsReview', { n: BOT_FILLED_COUNT })
        : t('flow.nextNeedsFields');
  const footer = (
    <>
      <Button variant="outline" onClick={back} data-testid="botBack">
        {t('flow.back')}
      </Button>
      {step === 'price' ? (
        <Button disabled={!m.checks.all} onClick={goLive} data-testid="goLiveButton" data-c2m="LB-8" data-c2m-id="LB-8">
          {t('check.goLive')}
        </Button>
      ) : (
        // A disabled button gets no hover, so the reason sits on its wrapper (native tooltip).
        <span title={nextBlocked ?? undefined} data-testid="botNextWrap" className="inline-flex">
          <Button disabled={!m.done[step]} onClick={() => goTo(BOT_STEPS[idx + 1]!)} data-testid="botNext">
            {t('flow.next')}
          </Button>
        </span>
      )}
    </>
  );

  return (
    <>
      <BotLayout step={step} done={m.done} canOpen={canOpen} onStep={goTo} onBackHeader={back} onFillDemo={m.fillDemo} footer={footer}>
        {step === 'product' && (
          <ProductStep
            m={m}
            type={type}
            onEditPhotos={() => navigate(`${paths.addSingleCategory}?${BOT_QUERY}`)}
            onChangeCategory={() => navigate(paths.addSingleCategory)}
            onFullForm={() => navigate(`${paths.addSingleDetails}?${BOT_QUERY}&view=form`)}
            onCompare={() => setCompare(true)}
          />
        )}
        {step === 'quantity' && <QuantityStep m={m} />}
        {step === 'price' && <PriceStep m={m} onGoTo={goTo} />}
      </BotLayout>
      {compare && <CompareFormsModal onClose={() => setCompare(false)} />}
    </>
  );
}
