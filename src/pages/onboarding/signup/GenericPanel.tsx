// Sign-up right panel as on the live page: "Grow your business faster…" stats and
// "All you need to sell on Meesho is:". Copy is Meesho's own (replicated).
import type { ReactNode } from 'react';

const IMG = '/brand/local/signup';

const STATS = [
  { icon: 'stat-suppliers.png', title: '11 lakh+', sub: 'Suppliers are selling commission-free' },
  { icon: 'stat-pincodes.png', title: '19000+', sub: 'Pincodes supported for delivery' },
  { icon: 'stat-customers.png', title: 'Crore of', sub: 'Customers buy across India' },
  { icon: 'stat-categories.png', title: '700 +', sub: 'Categories to sell' },
];

function Stat({ icon, title, sub }: (typeof STATS)[number]) {
  return (
    <div className="flex items-start gap-[15.2px]">
      <img src={`${IMG}/${icon}`} alt="" width="40" height="40" className="mt-[2.4px] size-10 shrink-0" />
      <div>
        <p className="m-0 font-button text-xl leading-6">{title}</p>
        <p className="m-0 mt-[1.8px] font-body text-lg leading-5 text-secondary-text">{sub}</p>
      </div>
    </div>
  );
}

export function GrowStats({ note }: { note?: ReactNode }) {
  return (
    <>
      <h2 className="m-0 mt-[44px] font-heading text-2xl leading-6">Grow your business faster by selling on Meesho</h2>
      {note}
      <div className="mt-[22.4px] grid grid-cols-2 gap-y-[30.4px]">
        {STATS.map((s) => (
          <Stat key={s.title} {...s} />
        ))}
      </div>
    </>
  );
}

const Check = () => <img src={`${IMG}/check-circle.png`} alt="" width="20" height="20" className="relative -top-[2.4px] size-5 shrink-0" />;

export function AllYouNeed({ className }: { className?: string }) {
  return (
    <div className={className}>
      <h2 className="m-0 font-heading text-2xl leading-6">All you need to sell on Meesho is:</h2>
      <div className="mt-[26.8px] flex items-center gap-[20px]">
        <Check />
        <span className="text-xl leading-5 text-secondary-text">Tax Details</span>
        <img src={`${IMG}/info.png`} alt="info" width="16" height="16" className="-ml-[17.4px] size-4" />
      </div>
      <ul className="m-0 mt-[14.4px] list-disc pl-[35.4px] text-xl leading-5 text-secondary-text marker:text-black">
        <li className="pl-[8px]">
          <span className="inline-flex items-center gap-[4px]">
            Enrolment ID/UIN
            <span className="ml-[1px] inline-flex h-[22.4px] items-center rounded-full border border-solid border-brand-primary-border px-2 text-sm text-brand-primary-text">For Non-GST sellers</span>
            <span className="relative -top-[1.6px] inline-flex h-4 items-center rounded-sm bg-dark-pink px-[7px] text-xs font-button text-white">New!</span>
          </span>
        </li>
        <li className="mt-[21px] pl-[8px]">
          <span className="inline-flex items-center gap-[14px]">
            GSTIN
            <span className="text-base text-primary-text">Regular &amp; Composition GST sellers</span>
          </span>
        </li>
      </ul>
      <div className="mt-[26.8px] flex items-center gap-[20px]">
        <Check />
        <span className="text-xl leading-5 text-secondary-text">Bank Account</span>
      </div>
    </div>
  );
}

export function GenericPanel({ note }: { note?: ReactNode }) {
  return (
    <>
      <GrowStats note={note} />
      <hr className="m-0 mt-[40.8px] border-0 border-t border-solid border-secondary-border" />
      <AllYouNeed className="mt-[37.6px]" />
    </>
  );
}
