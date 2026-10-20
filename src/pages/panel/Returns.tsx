// Return/RTO Orders: faithful replica of reference/html/meesho-returns.html (Overview tab,
// captured empty). Return Tracking / Claim Tracking weren't captured, so they show the
// same empty state under the same header.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { notInPrototype } from '../../components/Toast';
import { paths } from '../../app/paths';
import { FilterLabel, FilterSelect, FulfillmentEmpty } from './orders/FilterSelect';
import { UpdateAlert } from './returns/UpdateAlert';

const TABS = [
  { slug: 'overview', id: 'tab-overview', label: 'Overview' },
  { slug: 'return-tracking', id: 'tab-returnTracking', label: 'Return Tracking' },
  { slug: 'claim-tracking', id: 'tab-claims', label: 'Claim Tracking' },
];

const TAB =
  'py-3 px-4 text-lg cursor-pointer transition-all duration-200 ease-in-out text-primary-text bg-transparent border-0 border-solid whitespace-nowrap [font-family:inherit] hover:text-brand-primary-bg hover:bg-brand-secondary-bg focus-visible:outline-1 focus-visible:outline-brand-primary-bg focus-visible:rounded-md border-b-2 border-b-transparent data-[active=true]:border-b-brand-primary-bg data-[active=true]:font-semibold data-[active=true]:text-brand-primary-text';

const TOOLTIP =
  "absolute box-border z-tooltip w-max py-1 px-2 text-base rounded-lg text-brand-foreground-text shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] animate-fade-in bg-tooltip-bg after:content-[''] after:absolute after:w-0 after:h-0 after:border-solid after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-t-0 after:border-b-tooltip-bg after:border-x-transparent after:border-t-transparent";

export default function Returns() {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const active = TABS.some((t) => t.slug === tab) ? tab : 'overview';
  const [alertOpen, setAlertOpen] = useState(true);
  const [tipOpen, setTipOpen] = useState(true);

  return (
    <div className="bg-white">
      <div className="sticky z-6" style={{ top: 'var(--concept-strip-h)' }}>
        <header className="flex justify-between bg-white py-3 px-4">
          <div className="flex items-center gap-2">
            <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Return/RTO Orders</h1>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => {
                setTipOpen(false);
                notInPrototype('The returns tutorial videos');
              }}
            >
              <img src="/brand/msa/merlin/filled/youtube.svg" alt="" width="16" height="16" />
              <div className="relative inline-block">
                <h5 className="m-0 p-0 text-primary-text text-lg leading-5 font-semibold font-button pl-2">How it works?</h5>
                {tipOpen && (
                  <div className={TOOLTIP} role="tooltip" style={{ top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }}>
                    Click here to see updated tutorial videos
                  </div>
                )}
              </div>
            </div>
            <div style={{ width: '300px' }}>
              <div className="flex flex-col gap-1">
                <div className="group text-sm flex relative font-normal leading-5 items-center box-border w-full gap-2.5 p-0 m-0 text-primary-text border border-solid border-secondary-border rounded-sm transition-[border-color] duration-200 ease-in-out focus-within:border-brand-primary-border hover:border-brand-primary-border">
                  <input
                    className="peer flex-1 bg-transparent border-none text-lg [font-family:inherit] transition-all duration-200 ease-in-out rounded-sm outline-none min-h-[2.75rem] px-4 z-1 placeholder:text-secondary-border focus:z-1"
                    type="text"
                    placeholder="Search by Order ID, SKU or AWB Number"
                  />
                  <img src="/brand/msa/merlin/lined/search-light-grey.svg" alt="" width="20" height="20" className="mr-4" />
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="sticky z-5 bg-white" style={{ top: 'calc(var(--concept-strip-h) + 70px)' }}>
        <div className="flex items-center justify-between bg-white">
          <div role="tablist" className="max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-b-tertiary-border flex items-center w-full overflow-visible" aria-orientation="horizontal">
            {TABS.map((t) => (
              <div key={t.slug} className="relative flex">
                <button className={TAB} id={t.id} type="button" role="tab" aria-selected={t.slug === active} data-active={t.slug === active} onClick={() => navigate(paths.returnsTab(t.slug))}>
                  <div className="flex items-center gap-1">
                    <p className="m-0 p-0 font-normal font-body text-xl leading-5 text-inherit">{t.label}</p>
                  </div>
                </button>
                {t.slug === 'return-tracking' && alertOpen && (
                  <UpdateAlert
                    onClose={() => setAlertOpen(false)}
                    onTry={() => {
                      setAlertOpen(false);
                      notInPrototype('The disposed products tab');
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div role="tabpanel">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="whitespace-nowrap">
                <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6 mr-1 max-md:mr-0">Summary</h3>
              </div>
              <FilterSelect id="overview-dropdown" label="Last 1 Month" look="link" />
            </div>
            <div className="flex items-center cursor-pointer gap-1 rounded-md py-2 px-3" onClick={() => notInPrototype('View Trend')}>
              <img src="/brand/msa/merlin/filled/trending-blue.svg" alt="" width="24" height="24" />
              <span className="m-0 p-0 font-semibold font-button text-xl leading-5 ml-1 text-brand-primary-bg">View Trend</span>
            </div>
          </div>
        </div>
        <div className="px-4" />
        <div className="flex items-center px-4 py-2">
          <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6 mr-1">Product Performance</h3>
          <p className="m-0 p-0 font-normal font-body text-base leading-4 text-tertiary-text" />
        </div>
        <div className="px-4" />
        <div className="flex items-center justify-between mx-4">
          <div className="flex items-center gap-3 pt-2">
            <FilterLabel />
            <div><FilterSelect id="category" label="Category" width={110} /></div>
            <div><FilterSelect id="performance" label="Performance" width={121} /></div>
          </div>
          <div className="flex ml-auto mt-2">
            <div className="flex items-center -mt-6">
              <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text mr-2 my-2">Sort by :</p>
              <FilterSelect id="sort_criteria" label="Most Recent Order" width={240} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center box-border pb-16 max-md:pb-8">
        <div className="flex items-center justify-center w-full bg-white" style={{ height: 'auto' }}>
          <FulfillmentEmpty img="/brand/msa/crystal/system/fill/no_returns_yet.svg" title="No data as of now." />
        </div>
      </div>
    </div>
  );
}
