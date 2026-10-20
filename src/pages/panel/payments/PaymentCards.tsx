// Payments overview cards, ported from reference/html/meesho-payments.html (captured empty).
import { forwardRef } from 'react';
import { notInPrototype } from '../../../components/Toast';

const H3 = 'm-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6';
const H5 = 'm-0 p-0 text-primary-text text-lg leading-5 font-semibold font-button';
const LINK = 'm-0 p-0 font-semibold font-button text-lg leading-5 text-brand-primary-text cursor-pointer';
const SUB = 'm-0 p-0 font-normal font-body text-base leading-4 mt-1';

/** Upcoming / Completed Payments: icon + title, range pill, empty illustration. */
export const SummaryCard = forwardRef<
  HTMLDivElement,
  { kind: 'UPCOMING_PAYMENTS' | 'PREVIOUS_PAYMENTS'; icon: string; iconAlt: string; title: string; range: string; emptyTitle: string; emptyBody: string }
>(function SummaryCard({ kind, icon, iconAlt, title, range, emptyTitle, emptyBody }, ref) {
  return (
    <div className="p-2 w-1/2 min-h-40.75 box-border">
      <div ref={ref} className={`bg-white rounded-lg min-h-112.5 h-full items-center justify-start flex flex-col box-border overview-v2-${kind}`}>
        <div className="p-4 mb-0.5 flex w-full justify-between box-border">
          <div className="flex gap-x-2 items-center">
            <img src={icon} alt={iconAlt} width="24" height="24" />
            <div className="flex flex-col items-start justify-center min-h-10.5">
              <h3 className={`${H3} mr-1.5`}>{title}</h3>
              <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-tertiary-text" />
            </div>
          </div>
          <div role="button" tabIndex={0}>
            <button
              type="button"
              className="flex items-center gap-1 border border-solid border-primary-border rounded-lg bg-transparent px-2 py-1 cursor-pointer text-primary-text whitespace-nowrap"
              onClick={() => notInPrototype(`${title} details`)}
            >
              <div className="flex items-center gap-2">
                <span className="m-0 p-0 font-semibold font-button text-lg leading-5 text-primary-text">{range}</span>
                <img src="/brand/msa/merlin/lined/chevron-right-grey.svg" alt="chevron right" width="16" height="16" />
              </div>
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-95.75 max-w-70 mx-auto text-center gap-4 px-12.5 py-0">
          <img src="/brand/msa/merlin/lined/empty-payment.svg" alt="No payments" width="105" height="53" />
          <div className="flex flex-col items-center justify-center gap-2">
            <h4 className="m-0 p-0 text-primary-text font-bold font-heading text-xl leading-5">{emptyTitle}</h4>
            <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">{emptyBody}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export function UnscheduledCard() {
  return (
    <div className="flex justify-between items-center m-2 w-full rounded-lg relative pr-4 bg-white overflow-hidden overview-v2-UNSCHEDULED_PAYMENTS">
      <div className="flex flex-row gap-2 items-center">
        <img src="/brand/msa/payouts/waiting-truck-illustration.svg" alt="Unscheduled Payments" width="100" height="58" />
        <div>
          <h4 className="m-0 p-0 text-primary-text font-bold font-heading text-xl leading-5">Unscheduled Payments</h4>
          <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5">
            Payments expected from your shipped orders. Once delivered, we will automatically move it to your upcoming payments.
          </p>
        </div>
      </div>
      <button
        className="inline-flex items-center justify-center gap-1 rounded-sm font-button cursor-pointer transition-all duration-200 ease-in-out active:scale-90 h-9 px-4 text-xl border border-solid bg-white text-primary-text border-primary-border"
        type="button"
        onClick={() => notInPrototype('Unscheduled Payments details')}
      >
        View Details
      </button>
    </div>
  );
}

export function PaymentsOverTime() {
  return (
    <div id="overview_graph_id" className="m-2 w-full rounded-lg relative">
      <div className="max-h-81 p-4 bg-white rounded-t-lg">
        <h3 className={H3}>Payments over time</h3>
        <div className="flex items-center my-2 mb-0.5">
          <div className="rounded-xs mr-1 w-3 h-3" style={{ background: 'rgb(116, 167, 254)' }} />
          <p className="m-0 p-0 font-normal font-body text-base leading-4 text-tertiary-text mr-4">Payments to Date</p>
          <div className="rounded-xs mr-1 w-3 h-3" style={{ background: 'rgb(195, 201, 212)' }} />
          <p className="m-0 p-0 font-normal font-body text-base leading-4 text-tertiary-text mr-4">Outstanding Payment</p>
        </div>
        <div className="relative w-full h-57.5">
          <div className="flex flex-col items-center justify-center h-full">
            <img src="/brand/msa/crystal/system/line/no-trend.svg" alt="No trends" className="w-17.5 h-14.5" />
            <h5 className={`${H5} mt-2`}>No Trend to Show</h5>
            <p className={`${SUB} text-secondary-text text-center w-49.5`}>There is no sufficient data to show the results in the selected timeframe.</p>
          </div>
        </div>
      </div>
      <div className="bg-secondary-bg px-4 py-2 rounded-b-lg">
        <p className="m-0 p-0 font-normal font-body text-sm leading-4 text-secondary-text">The graph shows daily view of your 30 days payments</p>
      </div>
    </div>
  );
}

const Info = ({ extra = '' }: { extra?: string }) => (
  <div className="relative inline-block">
    <div className={`flex mt-0.5 ml-0.75 ${extra}`}>
      <img src="/brand/msa/merlin/lined/info-grey.svg" alt="info" width="12" height="12" />
    </div>
  </div>
);

function CardHead({ title, info, details }: { title: string; info?: boolean; details?: boolean }) {
  return (
    <div className="flex justify-between">
      <div className="flex">
        <h5 className={H5}>{title}</h5>
        {info && <Info extra="mt-0.75" />}
      </div>
      {details && (
        <span className={LINK} role="button" tabIndex={0} onClick={() => notInPrototype(`${title} details`)}>
          View Details
        </span>
      )}
    </div>
  );
}

function BarRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex items-center py-2.5 pb-0.25">
        <div className="flex-1">
          <p className="m-0 p-0 font-normal font-body text-xs leading-4 text-secondary-text">{label}</p>
        </div>
        <div className="flex items-center gap-1">
          <p className="m-0 p-0 font-normal font-body text-xs leading-4 text-secondary-text">{value}</p>
          <Info />
        </div>
      </div>
      <div className="flex w-full">
        <div className="relative block" style={{ width: '100%' }}>
          <div className="h-3" style={{ background: 'rgb(242, 245, 250)' }} />
        </div>
      </div>
    </>
  );
}

const SMALL = 'p-4 rounded-lg bg-white flex-1 min-h-39.5';
const H6 = 'm-0 p-0 text-primary-text leading-4 font-semibold font-button text-base';

export function CompensationCard() {
  return (
    <div className={SMALL}>
      <CardHead title="Compensation & Recoveries" info details />
      <p className={`${SUB} text-tertiary-text`}>No data to show</p>
      <BarRow label="Compensations" value="₹0" />
      <BarRow label="Recoveries" value="₹0" />
      <div className="flex items-center pt-2.5">
        <div className="flex-1">
          <h6 className={H6}>Total</h6>
        </div>
        <h6 className={H6}>₹0</h6>
      </div>
    </div>
  );
}

export function AdsCostCard() {
  return (
    <div className={SMALL}>
      <CardHead title="Ads Cost" info details />
      <p className={`${SUB} text-tertiary-text`}>You have not spent on Ads in the last 30 days</p>
      <div className="flex flex-col items-center justify-center grow pt-5">
        <img src="/brand/msa/merlin/lined/growth-gain.svg" alt="Growth" width="62" height="53" />
        <h5 className={`${H5} mt-1`}>Boost order growth using Ads</h5>
        <div className="flex mt-0.5">
          <p className="m-0 p-0 font-normal font-body text-sm leading-4 text-secondary-text">More than 2 Lac sellers have run Ads to grow their business,</p>
          <span className="m-0 p-0 font-semibold font-button text-base leading-4 text-brand-primary-text cursor-pointer" role="button" tabIndex={0} onClick={() => notInPrototype('Ads')}>
            Try Ads
          </span>
        </div>
      </div>
    </div>
  );
}

function LinkRow({ title, body, last }: { title: string; body: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 py-4 cursor-pointer ${last ? '' : 'border-0 border-b border-solid border-tertiary-border'}`}
      role="button"
      tabIndex={0}
      onClick={() => notInPrototype(title)}
    >
      <div className="flex-1">
        <h5 className={H5}>{title}</h5>
        <p className={`${SUB} text-secondary-text`}>{body}</p>
      </div>
      <img src="/brand/msa/merlin/lined/chevron-right-blue.svg" alt="chevron right" width="20" height="20" />
    </div>
  );
}

export function OtherLinksCard() {
  return (
    <div className={SMALL}>
      <CardHead title="Other Links" />
      <LinkRow title="Referral Payments" body="No referral payments to show." />
      <LinkRow title="Have a query?" body="Raise a ticket for your payment related matters" last />
    </div>
  );
}
