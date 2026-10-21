// "Create from photos" strip (LB-4, LB-10): the bot's three screens as tabs that scroll to the matching
// part of Add Single Catalog, and the EN | हिंदी toggle. Tab styling = SingleStepper's.
import { useDemo } from '../../../store/demo';
import { useT } from '../../../i18n';
import { PinkTag } from './BulkTemplatePanel';

export type BotTab = 'product' | 'quantity' | 'price';
const TABS: BotTab[] = ['product', 'quantity', 'price'];

/** Anchor each tab scrolls to (data-bot-anchor on the page). */
const scrollTo = (tab: BotTab) =>
  document.querySelector(`[data-bot-anchor="${tab}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });

export function LangToggle() {
  const { lang, setLang } = useDemo();
  const t = useT();
  return (
    <div className="flex items-center rounded-full border border-solid border-secondary-border bg-white p-0.5" role="group" aria-label={t('bot.lang')} data-c2m="LB-10">
      {(['en', 'hi'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`cursor-pointer rounded-full border-0 px-3 py-1 font-button text-lg leading-5 ${lang === l ? 'bg-brand-secondary-bg text-brand-primary-text' : 'bg-transparent text-secondary-text'}`}
        >
          {l === 'en' ? 'EN' : 'हिंदी'}
        </button>
      ))}
    </div>
  );
}

export function BotStrip({ active, done = [], onTab }: { active: BotTab; done?: BotTab[]; onTab?: (t: BotTab) => void }) {
  const t = useT();
  return (
    <div className="mt-2.5 flex items-center justify-between bg-white pr-4 pl-5" data-c2m="LB-4" data-testid="botStrip">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-button text-xl leading-5 text-primary-text">{t('bot.title')}</span>
          <PinkTag>{t('bot.new')}</PinkTag>
        </div>
        <div className="flex" role="tablist">
          {TABS.map((tab, i) => {
            const on = tab === active;
            const isDone = done.includes(tab) && !on;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => (onTab ? onTab(tab) : scrollTo(tab))}
                className={`flex cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-3 ${on ? 'border-b-2 border-solid border-brand-primary-bg' : ''}`}
              >
                {isDone ? (
                  <img src="/brand/msa/merlin/filled/success-green.svg" alt="" width="24" height="24" className="size-6" />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-secondary-bg">
                    <span className={`font-body text-lg leading-5 ${on ? 'text-brand-primary-text' : 'text-secondary-text'}`}>{i + 1}</span>
                  </span>
                )}
                <span className={`font-body text-lg leading-5 ${on ? 'text-brand-primary-text' : 'text-tertiary-text'}`}>{t(`bot.tab.${tab}`)}</span>
              </button>
            );
          })}
        </div>
      </div>
      <LangToggle />
    </div>
  );
}

export { scrollTo as scrollToBotTab };
