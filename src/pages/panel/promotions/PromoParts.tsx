// Shared pieces of the Promotions pages, ported class-for-class from
// reference/html/meesho-promotions.html, meesho-sale-opt-in.html and meesho-offer-opt-in.html.
// Tokens the panel has but tokens.css doesn't (discovery-base, neutral-inverse, tracking-free/relaxed)
// are written as their resolved values.
import { useState, type Ref } from 'react';
import { notInPrototype } from '../../../components/Toast';
import { STATUSES, type PromoTab, type Status } from './tabs';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/** Sticky offsets: the panel's top-0 / top-16 / top-27.5, pushed down by the concept strip. */
const TOP_0 = 'top-(--concept-strip-h)';
const TOP_16 = 'top-[calc(var(--concept-strip-h)+4rem)]';
const TOP_27_5 = 'top-[calc(var(--concept-strip-h)+6.875rem)]';

// ── Season banner (animated GIF on the festive background) ──────────────────
export function SeasonBanner() {
  return (
    <div className="bg-neutral-base p-4 mb-2 empty:hidden">
      <button
        className="items-center gap-1 font-medium font-default border-none cursor-pointer duration-200 ease-in-out disabled:cursor-not-allowed disabled:pointer-events-none disabled:touch-none outline-transparent disabled:bg-transparent disabled:text-neutral-tertiary hover:bg-brand-light active:outline-offset-2 active:outline-2 active:outline-brand-disabled isolate flex aspect-6.5/1 h-full w-full justify-start rounded-8 bg-cover bg-center bg-no-repeat p-0 text-inherit transition-none"
        type="button"
        aria-label="Open sale participation"
        style={{ backgroundImage: 'url(/brand/local/promotions/season-banner-bg.jpg)' }}
        onClick={() => notInPrototype('Sale participation')}
      >
        <div className="flex h-full items-center pl-6">
          <img
            src="/brand/mimg/images/marketing/1792482396681.gif"
            alt="Banner Image"
            className="m-3 h-auto object-contain"
            style={{ width: '9.625rem', marginLeft: '2.5rem' }}
          />
        </div>
      </button>
    </div>
  );
}

// ── Sticky page title with the help (?) button ──────────────────────────────
export function PromoHeader({ title }: { title: string }) {
  return (
    <div className={cx('sticky z-11 flex items-center justify-between bg-neutral-base p-4 max-md:py-3 border-b border-b-neutral-light mb-3', TOP_0)}>
      <div className="flex items-center gap-4 max-md:gap-2">
        <h1 className="m-0 p-0 text-neutral-primary text-heading-large leading-8 font-bold max-md:text-heading-medium max-md:leading-7">{title}</h1>
      </div>
      <div className="flex items-center gap-2" />
      <button
        className="inline-flex items-center justify-center gap-1 rounded-6 font-medium font-default border-none cursor-pointer transition-all duration-200 ease-in-out bg-transparent text-brand-primary outline-transparent hover:bg-brand-light active:outline-offset-2 active:outline-2 active:outline-brand-disabled text-body-small h-fit min-w-0 p-0"
        type="button"
        aria-label="Contact support"
        onClick={() => notInPrototype('Contact support')}
      >
        <img src="/brand/msa/merlin/lined/help.svg" alt="" width="24" height="24" className="size-4" />
      </button>
    </div>
  );
}

// ── "NEW" tag ───────────────────────────────────────────────────────────────
export function NewTag({ className }: { className?: string }) {
  return (
    <div className={cx('w-fit rounded bg-(--discovery-500) px-2 py-0', className)}>
      <p className="m-0 p-0 text-body-xsmall leading-4 font-regular text-white">NEW</p>
    </div>
  );
}

// ── Top tab bar (Sale Events / Deals / Flash Events …) ──────────────────────
const TAB_BTN =
  'py-2 px-3 cursor-pointer transition-all duration-200 ease-in-out text-neutral-primary bg-transparent border-0 border-solid whitespace-nowrap shrink-0 font-[inherit] hover:text-brand-primary hover:bg-brand-light focus-visible:outline-1 focus-visible:outline-brand-base focus-visible:rounded-6 border-b-2 border-b-transparent data-[active=true]:text-brand-primary data-[active=true]:border-b-brand-base data-[active=true]:font-medium';

export function PromoTabBar({
  tabs,
  active,
  onChange,
  anchorRef,
  anchorTab,
}: {
  tabs: PromoTab[];
  active: PromoTab;
  onChange: (t: PromoTab) => void;
  /** Ref for the label wrapper of `anchorTab` (the Mega Combo popover points at it). */
  anchorRef?: Ref<HTMLDivElement>;
  anchorTab?: string;
}) {
  return (
    <div className={cx('bg-neutral-base sticky z-10 max-md:top-13', TOP_16)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex overflow-scroll max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-b-neutral-light text-body-medium leading-5 gap-2 px-4 pt-2"
      >
        {tabs.map((t, i) => {
          const on = t.value === active.value;
          const label = (
            <span>
              <span className="flex items-center">
                {t.label}
                {t.isNew && <NewTag className="ml-2" />}
              </span>
            </span>
          );
          return (
            <button
              key={t.value}
              className={TAB_BTN}
              id={`tab-${t.value}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`tabpanel-${i}`}
              data-active={on}
              data-c2m={t.c2m}
              data-c2m-id={t.c2m}
              onClick={() => onChange(t)}
            >
              {anchorTab === t.value ? (
                <div className="relative inline-block" ref={anchorRef}>
                  {label}
                </div>
              ) : (
                label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Upcoming / Live / Expired ───────────────────────────────────────────────
const STATUS_BTN =
  'py-2 px-3 cursor-pointer transition-all duration-200 ease-in-out text-neutral-primary bg-transparent border-solid whitespace-nowrap shrink-0 font-[inherit] hover:text-brand-primary hover:bg-brand-light focus-visible:outline-1 focus-visible:outline-brand-base focus-visible:rounded-6 border border-transparent rounded-t-6 data-[active=true]:text-brand-primary data-[active=true]:bg-neutral-base data-[active=true]:font-medium data-[active=true]:border-neutral-light data-[active=false]:border-b-neutral-light data-[active=true]:border-b-transparent';

export function StatusTabs({ active, onChange }: { active: Status; onChange: (s: Status) => void }) {
  return (
    <div className="flex bg-neutral-base pt-3 border-t border-t-neutral-light">
      <div className="w-4 border-b border-neutral-light" />
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex overflow-scroll max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b-0 text-body-small leading-4"
      >
        {STATUSES.map((s, i) => {
          const on = s.value === active.value;
          return (
            <button
              key={s.value}
              className={STATUS_BTN}
              id={`tab-${s.value}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`tabpanel-${i}`}
              data-active={on}
              onClick={() => onChange(s)}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 border-b border-neutral-light" />
    </div>
  );
}

// ── Event-list header image + status tabs (sticky block) ────────────────────
export function EventListHeader({ status, onStatus }: { status: Status; onStatus: (s: Status) => void }) {
  return (
    <div className={cx('sticky z-10 w-full bg-neutral-base max-md:top-24.5', TOP_27_5)}>
      <div className="bg-neutral-base px-4 py-3">
        <img src="/brand/mimg/images/marketing/1770033003587.webp" alt="event-list-header" className="block w-full rounded-8 h-28.5" />
      </div>
      <StatusTabs active={status} onChange={onStatus} />
    </div>
  );
}

// ── Empty list ──────────────────────────────────────────────────────────────
export function EventsEmpty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="max-w-full">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="p-5">
          <img src="/brand/ms/supplier-new/no-events.png" alt="empty content icon" className="block size-30" />
        </div>
        <h3 className="m-0 p-0 text-neutral-primary text-heading-small leading-6 font-bold">{title}</h3>
        <p className="m-0 p-0 text-body-medium leading-5 font-regular max-w-75 text-center text-neutral-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

/** Captured copy: "No upcoming sale events yet / Once we schedule a new sale event, it will appear here". */
export function eventsEmptyCopy(noun: string, statusWord: string) {
  return {
    title: `No ${statusWord} ${noun} events yet`,
    subtitle: `Once we schedule a new ${noun} event, it will appear here`,
  };
}

// ── Deals carousel (Mega Offers / Daily Deals) ──────────────────────────────
const DEAL_SLIDES = [
  { src: '/brand/mimg/images/marketing/1788766202065.webp', alt: 'Mega Offers - prime slots, limited stock, ROI-backed growth program' },
  { src: '/brand/mimg/images/marketing/1788766172908.webp', alt: 'Daily Deals - top slots, up to 10 days a month, max buyer reach' },
];

export function DealsCarousel() {
  // The snapshot was captured on slide 2 (Daily Deals).
  const [idx, setIdx] = useState(1);
  return (
    <div className="bg-neutral-base p-4">
      <div className="w-full overflow-hidden rounded-8">
        <div className="relative w-full overflow-hidden touch-pan-y" data-show-indicators="true">
          <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {DEAL_SLIDES.map((s, i) => (
              <div key={s.src} className="shrink-0 w-full" data-active={i === idx}>
                <img src={s.src} alt={s.alt} className="block w-full rounded-8 object-cover" />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1 absolute z-1 -mt-3 left-[50%] transform-[translateX(-50%)]" role="tablist">
            {DEAL_SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                className="w-6 h-2 rounded-full bg-neutral-page border-none p-0 cursor-pointer transition-[background-color,width] duration-200 hover:bg-neutral-hover data-[active=true]:w-10 data-[active=true]:bg-brand-base"
                role="tab"
                aria-selected={i === idx}
                aria-label={`Go to slide ${i + 1}`}
                data-active={i === idx}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
