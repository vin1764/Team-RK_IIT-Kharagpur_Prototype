// "Create from photos" frame (LB-4, LB-10): the Add Single Catalog header, then a centred 640px column with
// the 1 Product · 2 Quantity · 3 Price stepper (SingleStepper's look) + EN | हिंदी, the progress line
// "Meesho filled 21 details · you add 14" (counts from bot.ts), the screen, and Back / Next at the bottom.
import type { ReactNode } from 'react';
import { useT } from '../../../../i18n';
import { BOT_FILLED_COUNT, BOT_STEPS, MAKER_COUNT, type BotStep } from '../bot';
import { PinkTag } from '../BulkTemplatePanel';
import { LangToggle } from '../BotStrip';
import { CatalogHeader } from '../CatalogHeader';
import { GREEN_CHECK, LinkButton } from './Bits';

export function BotStepper({ step, done, canOpen, onStep }: { step: BotStep; done: Record<BotStep, boolean>; canOpen?: (s: BotStep) => boolean; onStep?: (s: BotStep) => void }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between rounded bg-white pr-4 pl-1" data-c2m="LB-4" data-c2m-id="LB-4" data-testid="botStepper">
      <div className="flex" role="tablist">
        {BOT_STEPS.map((s, i) => {
          const on = s === step;
          const ok = done[s] && i < BOT_STEPS.indexOf(step);
          const open = !on && !!onStep && (canOpen?.(s) ?? true);
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={!open && !on}
              onClick={() => open && onStep?.(s)}
              className={`flex items-center gap-2 border-0 bg-transparent px-4 py-3 ${on ? 'border-b-2 border-solid border-brand-primary-bg' : ''} ${open ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {ok ? (
                <img src={GREEN_CHECK} alt="" width="24" height="24" className="size-6" />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-secondary-bg">
                  <span className={`font-body text-lg leading-5 ${on ? 'text-brand-primary-text' : 'text-secondary-text'}`}>{i + 1}</span>
                </span>
              )}
              <span className={`font-body text-lg leading-5 ${on ? 'text-brand-primary-text' : 'text-tertiary-text'}`}>{t(`bot.tab.${s}`)}</span>
            </button>
          );
        })}
      </div>
      <LangToggle />
    </div>
  );
}

export function BotLayout({
  step,
  done,
  canOpen,
  onStep,
  onBackHeader,
  onFillDemo,
  footer,
  children,
}: {
  step: BotStep;
  done: Record<BotStep, boolean>;
  canOpen?: (s: BotStep) => boolean;
  onStep?: (s: BotStep) => void;
  onBackHeader: () => void;
  onFillDemo?: () => void;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <main data-show-sidebar="false" className="grow min-h-screen layout-main-dt-responsive">
      <div className="relative max-w-304 min-h-full mx-auto" id="mainWrapper">
        <CatalogHeader title="Add Single Catalog" helper="Learn to upload single catalog?" onBack={onBackHeader} />
        <div className="mx-auto max-w-[40rem] px-0 pt-2.5 pb-10" data-testid="botColumn">
          <BotStepper step={step} done={done} canOpen={canOpen} onStep={onStep} />
          <div className="flex items-center justify-between gap-3 px-1 pt-3" data-c2m="LB-4" data-c2m-id="LB-4" data-testid="botProgress">
            <p className="m-0 flex items-center gap-2 font-body text-lg leading-5 text-secondary-text">
              <span className="font-button text-primary-text">{t('bot.title')}</span>
              <PinkTag>{t('bot.new')}</PinkTag>
              <span>{t('flow.progress', { bot: BOT_FILLED_COUNT, you: MAKER_COUNT })}</span>
            </p>
            {onFillDemo && (
              <LinkButton onClick={onFillDemo} className="shrink-0" testId="fillDemo">
                {t('bot.fillDemo')}
              </LinkButton>
            )}
          </div>
          {children}
          {footer && (
            <div className="mt-2.5 flex items-center justify-between rounded bg-white px-5 py-3" data-testid="botFooter">
              {footer}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
