// Shared frame of the 4 onboarding steps, replicated from reference/screens/onb-*.png:
// left form column (#F2F5FA) with the meesho wordmark, the 4-step stepper, the step's form and a
// full-width button at the bottom; right column (#F0F1FB) with a headline, FAQs and support line.
// Measurements are from the screenshots at 125% (device px ÷ 1.25).
import { useState, type ReactNode } from 'react';
import { onboarding } from '../../../app/paths';
import { cx } from '../../../components/ui';
import { useOnboarding } from '../../../store/onboarding';
import { ASIDES, SUPPORT_PHONE, type Aside } from './faq';
import { useGo } from './nav';

const IMG = '/brand/local/onboarding';

// Business Details / Pickup Address icons were only captured in their "done" (green tick) state,
// so their outline icons are drawn here in the same 1.5px line style as the cropped bank/person icons.
const BriefcaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
    <rect x="3.75" y="7.25" width="16.5" height="12" rx="1.5" />
    <path d="M8.75 7.25V5.5c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v1.75M3.75 12.25h16.5" />
  </svg>
);
const PinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
    <path d="M12 20.5s6.25-5.6 6.25-10.5a6.25 6.25 0 10-12.5 0c0 4.9 6.25 10.5 6.25 10.5z" />
    <circle cx="12" cy="10" r="2.25" />
  </svg>
);
const Cropped = ({ name }: { name: string }) => <img src={`${IMG}/${name}.png`} alt="" width="24" height="24" className="size-6" />;

const STEPS = [
  { label: 'Business Details', path: onboarding.businessDetails, icon: () => <BriefcaseIcon /> },
  { label: 'Pickup Address', path: onboarding.pickupAddress, icon: () => <PinIcon /> },
  { label: 'Bank Details', path: onboarding.bankDetails, icon: (on: boolean) => <Cropped name={on ? 'step-bank-indigo' : 'step-bank-grey'} /> },
  { label: 'Supplier Details', path: onboarding.supplierDetails, icon: (on: boolean) => <Cropped name={on ? 'step-person-indigo' : 'step-person-grey'} /> },
] as const;

export type StepIndex = 0 | 1 | 2 | 3;

function Stepper({ current }: { current: StepIndex }) {
  const go = useGo();
  const o = useOnboarding();
  const doneFlags = [o.businessFetched && !!o.businessType, o.pickupSaved && !!o.fulfilment, o.bankVerified, o.supplierSubmitted];
  return (
    <div className="mt-[31px] flex border-0 border-b border-solid border-tertiary-border">
      {STEPS.map((s, i) => {
        const isCurrent = i === current;
        const done = !isCurrent && (i < current || doneFlags[i]);
        return (
          <button
            key={s.label}
            type="button"
            disabled={!done}
            onClick={() => go(s.path)}
            className={cx(
              'relative flex w-1/4 flex-col items-center bg-transparent border-0 p-0 pt-[13px] pb-[13px] font-body text-base leading-4 disabled:cursor-default',
              done && 'cursor-pointer',
              isCurrent ? 'text-brand-primary-text' : 'text-tertiary-text',
            )}
          >
            <span className={cx('flex size-6 items-center justify-center', isCurrent ? 'text-brand-primary-text' : 'text-secondary-text')}>
              {done ? <img src="/brand/msa/merlin/filled/success-green.svg" alt="" width="24" height="24" className="size-6" /> : s.icon(isCurrent)}
            </span>
            <span className="mt-[9px] whitespace-nowrap">{s.label}</span>
            {isCurrent && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-primary-bg" />}
          </button>
        );
      })}
    </div>
  );
}

const Chevron = ({ up }: { up: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className={cx('shrink-0 transition-transform', !up && 'rotate-180')}>
    <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Faq({ items }: { items: Aside['faqs'] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-6">
      {items.map((f, i) => (
        <div key={f.q} className="border-0 border-b border-solid border-tertiary-border">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 bg-transparent border-0 px-4 py-4 text-left cursor-pointer text-xl leading-6 font-button text-primary-text"
            aria-expanded={open === i}
          >
            {f.q}
            <Chevron up={open === i} />
          </button>
          {open === i && (
            <div className="px-4 pb-8 pt-0 text-xl leading-5 font-body text-secondary-text [&_p]:m-0 [&_p+p]:mt-5">
              {f.a ?? <p>Answer not available in this prototype.</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AsideColumn({ aside }: { aside: Aside }) {
  return (
    <div data-onb-right className="min-w-0 flex-1 bg-[#F0F1FB]">
      <aside className="sticky top-[var(--concept-strip-h)] h-[calc(100vh-var(--concept-strip-h)+var(--onb-shift,0px))] overflow-hidden pl-[63px] pr-6">
        <div className="relative h-full w-full max-w-[560px] pt-[118px]">
          <div className="flex items-center gap-4 border-0 border-b border-solid border-tertiary-border pb-9">
            <img src={aside.icon} alt="" width="40" height="40" className="size-10 shrink-0 rounded-full" />
            <p className="m-0 text-xl leading-5 font-heading text-primary-text">{aside.headline}</p>
          </div>
          <h2 className="m-0 mt-[19px] text-3xl leading-6 font-heading text-tertiary-text">Frequently Asked Questions</h2>
          <Faq key={aside.headline} items={aside.faqs} />
          <div className="mt-10 flex items-center gap-3">
            <img src={`${IMG}/faq-headset.png`} alt="" width="36" height="36" className="size-9 shrink-0 rounded-full" />
            <div>
              <p className="m-0 text-xl leading-5 font-heading text-primary-text">Need more assistance?</p>
              <p className="m-0 mt-0.5 text-base leading-5 font-body text-secondary-text">
                Call us on <span className="text-lg font-button">{SUPPORT_PHONE}</span>
              </p>
            </div>
          </div>
          <img src={`${IMG}/shop.png`} alt="" width="132" height="89" className="pointer-events-none absolute bottom-0 right-0 w-[132px]" />
        </div>
      </aside>
    </div>
  );
}

/** The faint dot grid that sits under the bottom button, bottom-left of the form column. */
const Dots = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute -left-[66px] top-[10px] h-[100px] w-[222px]"
    style={{ backgroundImage: 'radial-gradient(circle, #EDF1F7 3.2px, transparent 3.3px)', backgroundSize: '14.4px 14.4px', backgroundPosition: '-4px -4px' }}
  />
);

export function OnboardingLayout({
  step,
  aside,
  footer,
  children,
}: {
  step: StepIndex;
  aside: keyof typeof ASIDES;
  /** the full-width button(s) pinned to the bottom of the form column */
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      data-onb-root
      className="flex min-h-[calc(100vh-var(--concept-strip-h)+var(--onb-shift,0px))] items-stretch -mt-[var(--onb-shift,0px)]"
    >
      <div data-onb-left className="relative flex w-[45%] shrink-0 justify-end bg-secondary-bg pr-[58px] pl-4">
        <div className="flex w-[418px] max-w-full flex-col">
          <img src={`${IMG}/meesho-wordmark.png`} alt="meesho" width="98" height="25" className="mt-[11px] h-[25px] w-[98px] self-start" />
          <Stepper current={step} />
          <div className="flex flex-col">{children}</div>
          <div className="relative mt-auto pt-6 pb-14">
            <div className="relative">
              <Dots />
              <div className="relative flex flex-col gap-3">{footer}</div>
            </div>
          </div>
        </div>
      </div>
      <AsideColumn aside={ASIDES[aside]} />
    </div>
  );
}
