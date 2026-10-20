// Payments: faithful replica of reference/html/meesho-payments.html (captured with no payouts,
// ₹0 everywhere, and the first-visit "upcoming 3 payments" tour open).
import { useRef, useState } from 'react';
import { notInPrototype } from '../../components/Toast';
import { AdsCostCard, CompensationCard, OtherLinksCard, PaymentsOverTime, SummaryCard, UnscheduledCard } from './payments/PaymentCards';
import { PaymentsTour } from './payments/PaymentsTour';

export default function Payments() {
  const upcoming = useRef<HTMLDivElement>(null);
  const [tour, setTour] = useState(true);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky" style={{ top: 'var(--concept-strip-h)', zIndex: 4 }}>
        <div className="bg-white">
          <div className="flex">
            <div className="grow">
              <header className="flex items-center justify-between py-2.5 px-4 min-h-[4rem] bg-inherit gap-2.5 text-primary-text shadow-none" role="heading" aria-level={1}>
                <div className="flex items-center">
                  <div className="flex flex-row gap-2 items-end pl-2 pb-2">
                    <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Payments</h1>
                  </div>
                </div>
                <div className="flex relative">
                  <div className="relative inline-block" data-with-arrow="true">
                    <div className="flex items-center bg-brand-primary-bg rounded-sm cursor-pointer px-2.25" role="button" tabIndex={0} onClick={() => notInPrototype('Payment downloads')}>
                      <div className="flex items-center h-7 my-1.25">
                        <img src="/brand/msa/merlin/lined/bulk-upload-white.svg" alt="download" width="18" height="18" />
                        <div className="ml-2.5">
                          <span className="m-0 p-0 font-semibold font-button text-xl leading-5 text-white">Download</span>
                        </div>
                      </div>
                      <img src="/brand/msa/merlin/lined/chevron-down-white.svg" alt="" width="20" height="20" className="ml-1 transition-transform duration-200" />
                    </div>
                  </div>
                  <div className="bg-error-text border border-solid border-white absolute -top-px -right-px box-border rounded-full w-2.5 h-2.5" />
                </div>
              </header>
            </div>
            <div className="pr-4 flex items-center">
              <div className="flex items-stretch border border-solid border-secondary-border rounded">
                <div className="relative inline-block" data-with-arrow="true">
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between h-full w-43.5 px-2 border-0 border-r border-solid border-secondary-border cursor-pointer rounded-l"
                    onClick={() => notInPrototype('The search-type menu')}
                  >
                    <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text truncate">Order / Sub Order No.</p>
                    <img src="/brand/msa/merlin/lined/chevron-down-grey.svg" alt="" width="16" height="16" className="transition-transform duration-200" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-1 border-0 rounded-none h-full">
                    <div className="group text-sm flex relative font-normal leading-5 items-center box-border w-full gap-2.5 p-0 m-0 text-primary-text border-solid border-secondary-border transition-[border-color] duration-200 ease-in-out border-0 rounded-none h-full">
                      <input
                        className="peer flex-1 bg-transparent border-none text-lg [font-family:inherit] transition-all duration-200 ease-in-out rounded-sm outline-none min-h-[2.75rem] px-4 z-1 placeholder:text-secondary-border focus:z-1"
                        type="text"
                        id="filter-text-input"
                        aria-label="Order / Sub Order No."
                        autoComplete="off"
                      />
                      <div role="button" tabIndex={0} className="flex items-center px-2 cursor-pointer">
                        <img src="/brand/msa/merlin/lined/search-grey.svg" alt="search" width="20" height="20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grow flex flex-col bg-secondary-bg">
        <div className="flex max-w-full box-border flex-wrap bg-secondary-bg p-2">
          <SummaryCard
            ref={upcoming}
            kind="UPCOMING_PAYMENTS"
            icon="/brand/msa/merlin/filled/time-yellow.svg"
            iconAlt="pending"
            title="Upcoming Payments"
            range="Next 7 days (₹0.0)"
            emptyTitle="No upcoming payments to show"
            emptyBody="Your upcoming payouts will appear here once orders are delivered"
          />
          <SummaryCard
            kind="PREVIOUS_PAYMENTS"
            icon="/brand/msa/merlin/filled/success-green.svg"
            iconAlt="success"
            title="Completed Payments"
            range="Last 30 days (₹0.0)"
            emptyTitle="No completed payments to show"
            emptyBody="Once orders are delivered and payments cleared, payment information will appear here."
          />
          <UnscheduledCard />
          <PaymentsOverTime />
          <div className="flex justify-between flex-1 mx-2 mb-4 mt-2 gap-3">
            <CompensationCard />
            <AdsCostCard />
            <OtherLinksCard />
          </div>
        </div>
      </div>

      {tour && <PaymentsTour target={upcoming} onDone={() => setTour(false)} />}
    </div>
  );
}
