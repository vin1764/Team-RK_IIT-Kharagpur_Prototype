// Claims: faithful replica of reference/html/meesho-claims.html (no claims raised yet).
// The two video slots were empty <div role="button"> in the snapshot (lazy-loaded players);
// they stay empty and the "watch the video" link opens the not-in-prototype toast.
import type { ReactNode } from 'react';
import { notInPrototype } from '../../components/Toast';
import { FilterSelect } from './orders/FilterSelect';

const PRIMARY =
  'justify-center rounded-sm font-button border-none cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:touch-none disabled:bg-tertiary-text active:scale-90 bg-brand-primary-bg text-brand-foreground-text h-9 px-4 text-xl flex items-center gap-2';

const BENEFITS = ['Cut down on losses due to wrong returns', 'Transparent resolution process', 'Upto 100% Claim Approval Rate*'];

const FEATURES: Array<{ img: string; title: string; body: ReactNode }> = [
  {
    img: 'package.svg',
    title: 'Transparent Barcoded Packaging',
    body: (
      <>
        Using transparent, barcoded packaging helps reduce wrong returns. For more information,{' '}
        <a
          href="#"
          className="no-underline text-brand-primary-text"
          onClick={(e) => {
            e.preventDefault();
            notInPrototype('The packaging video');
          }}
        >
          watch the video here
        </a>
        .
      </>
    ),
  },
  { img: 'success-package.svg', title: 'Extensive Quality Checks', body: 'Thorough quality checks at every step to eliminate fraudulent activities.' },
  { img: 'package-otp.svg', title: 'Secured Ecosystem', body: 'Strengthened trust and safety measures, taking action against suspicious carrier partners or users.' },
  { img: 'rated-package.svg', title: 'Improved Claims Experience', body: 'Double-checking rejected tickets to achieve the best approval rates.' },
];

const raiseClaim = () => notInPrototype('Raise Claim');
const video = () => notInPrototype('The claims video');

const Footnote = ({ className = '' }: { className?: string }) => (
  <p className={`m-0 p-0 text-primary-text font-normal font-body text-lg leading-5 mt-2 ${className}`}>
    <sup>*</sup>Applicable only on genuine claims
  </p>
);

export default function Claims() {
  return (
    <div className="w-full">
      <div className="flex flex-col bg-white min-h-screen">
        <div className="sticky bg-white z-100" style={{ top: 'var(--concept-strip-h)' }}>
          <header className="flex justify-between p-4">
            <div className="flex items-center gap-2">
              <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Claims</h1>
            </div>
          </header>
          <div className="w-full h-[0.0625rem] border-b border-solid border-l-0 border-tertiary-border" role="separator" aria-orientation="horizontal" />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between max-[481px]:flex-col max-[481px]:items-start max-[481px]:gap-2.5">
            <div className="flex gap-3 items-baseline max-[481px]:flex-col max-[481px]:gap-0">
              <div className="flex items-baseline gap-[0.6875rem]">
                <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">Overview</h3>
                <FilterSelect id="overview-dropdown" label="Last 30 Days" look="link" />
              </div>
            </div>
            <button className={PRIMARY} type="button" onClick={raiseClaim}>
              <img src="/brand/msa/merlin/filled/add-white.svg" alt="" width="16" height="16" />
              Raise Claim
            </button>
          </div>
          <div className="mt-4 rounded-lg border border-solid border-tertiary-border">
            <div className="flex justify-between p-8 max-[481px]:p-2.5 max-[481px]:flex-col">
              <div>
                <h1 className="m-0 p-0 font-bold font-heading text-4xl text-[1.6875rem] leading-[1.6875rem] max-[481px]:text-2xl max-[481px]:leading-6">
                  Raising claims is super-easy on Meesho
                </h1>
                <div className="mt-2">
                  {BENEFITS.map((b) => (
                    <div key={b} className="flex items-center py-3 gap-3">
                      <img src="/brand/msa/merlin/filled/success-green.svg" alt="" width="20" height="20" />
                      <p className="m-0 p-0 text-primary-text font-normal font-body text-2xl leading-6 max-[481px]:text-lg max-[481px]:leading-5">{b}</p>
                    </div>
                  ))}
                </div>
                <button className={`${PRIMARY} mt-5`} type="button" onClick={raiseClaim}>
                  <img src="/brand/msa/merlin/filled/add-white.svg" alt="" width="20" height="20" />
                  Raise Claim
                </button>
                <Footnote />
              </div>
              <div className="overflow-hidden rounded-md">
                <div role="button" tabIndex={0} onClick={video} />
              </div>
            </div>
          </div>
        </div>

        <div
          className="w-full h-[0.0625rem] border-b border-solid border-l-0 border-secondary-bg"
          role="separator"
          aria-orientation="horizontal"
          style={{ borderBottomWidth: '32px' }}
        />

        <div className="p-10 px-18 max-md:p-7">
          <div className="flex justify-center py-2">
            <h2 className="m-0 p-0 font-bold font-heading text-3xl leading-6 text-black">Recently Enhanced Features</h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-16 gap-y-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-2">
                <div className="flex items-center justify-center h-17 w-17 rounded-sm bg-secondary-bg">
                  <img src={`/brand/msa/fulfillment/claims/${f.img}`} className="h-14.5 w-15" alt="" />
                </div>
                <div>
                  <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">{f.title}</h3>
                  <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">{f.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg mt-16 gap-4 grid grid-cols-3 p-10 bg-secondary-bg border border-solid border-tertiary-border">
            <div className="flex flex-col justify-between gap-4 col-span-2">
              <div className="flex flex-col justify-center grow bg-brand-secondary-bg py-4 px-16 rounded-md max-md:p-7">
                <div className="relative">
                  <div className="absolute left-2 -top-2">
                    <img src="/brand/msa/merlin/filled/start-quotes-grey.svg" alt="" width="20" height="20" />
                  </div>
                </div>
                {/* Meesho's own published testimonial, kept verbatim from the snapshot. */}
                <div className="ml-8">
                  <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5">
                    Meesho ke transparent packaging aur barcode system se claims process smooth ho gaya hai. Ab claims time pe approve hote hai aur refund bhi mil jata hai!
                  </p>
                  <p className="m-0 p-0 text-primary-text font-normal font-body text-sm leading-4 mt-2">Ankur Tulsian • Anand Sarees(Surat)</p>
                </div>
              </div>
              <div className="text-center">
                <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">Take advantage of these improvements now!</h3>
              </div>
            </div>
            <div className="overflow-hidden rounded-md">
              <div role="button" tabIndex={0} onClick={video} />
            </div>
          </div>
          <Footnote />
        </div>
      </div>
    </div>
  );
}
