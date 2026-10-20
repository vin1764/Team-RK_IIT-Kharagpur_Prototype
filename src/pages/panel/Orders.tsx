// Orders: faithful replica of reference/html/meesho-orders.html (captured empty, "Pending (0)").
// The live panel only gave us the Pending tab; every tab shows the same empty state.
import { useNavigate, useParams } from 'react-router';
import { Button } from '../../components/ui';
import { notInPrototype } from '../../components/Toast';
import { paths } from '../../app/paths';
import { FilterLabel, FilterSelect, FulfillmentEmpty } from './orders/FilterSelect';

const TABS = [
  { slug: 'on-hold', label: 'On Hold' },
  { slug: 'pending', label: 'Pending (0)' },
  { slug: 'ready-to-ship', label: 'Ready to Ship' },
  { slug: 'shipped', label: 'Shipped' },
  { slug: 'cancelled', label: 'Cancelled' },
];

const TAB =
  'px-4 cursor-pointer transition-all duration-200 ease-in-out bg-transparent border-0 border-solid whitespace-nowrap [font-family:inherit] hover:text-brand-primary-bg hover:bg-brand-secondary-bg focus-visible:outline-1 focus-visible:outline-brand-primary-bg focus-visible:rounded-md border-b-2 border-b-transparent data-[active=true]:border-b-brand-primary-bg data-[active=true]:font-semibold font-body text-xl font-semibold text-secondary-text data-[active=true]:text-brand-primary-text py-2.5 leading-normal';

const Separator = () => (
  <div className="w-full border-b border-b-secondary-border border-l-0 h-2 bg-secondary-bg border-none" role="separator" aria-orientation="horizontal" />
);

export default function Orders() {
  const { tab = 'pending' } = useParams();
  const navigate = useNavigate();
  const active = TABS.some((t) => t.slug === tab) ? tab : 'pending';

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky" style={{ top: 'var(--concept-strip-h)', zIndex: 6 }}>
        <header className="flex items-center justify-between py-2.5 px-4 gap-2.5 text-primary-text shadow-md sticky top-0 z-100 min-h-[unset] bg-white" role="heading" aria-level={1}>
          <div className="flex items-center gap-2 pl-2">
            <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Orders</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center cursor-pointer gap-2" role="button" tabIndex={0} onClick={() => notInPrototype('The orders tutorial video')}>
              <img src="/brand/msa/merlin/filled/training-red.svg" alt="how it works" width="20" height="20" />
              <h5 className="m-0 p-0 text-primary-text text-lg leading-5 font-semibold font-button">Learn how to process your orders?</h5>
            </div>
            <div className="text-center">
              <div className="relative inline-block" data-with-arrow="false">
                <div
                  className="flex justify-between items-center gap-2 px-3 border border-secondary-border rounded-none md:rounded-sm bg-brand-primary-bg cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => notInPrototype('Download Orders Data')}
                >
                  <div className="flex items-center my-[0.3125rem]">
                    <img src="/brand/msa/merlin/lined/bulk-upload-white.svg" alt="" width="16" height="16" />
                    <div className="flex flex-col ml-2.5 md:flex-row md:items-center md:gap-1 md:ml-1">
                      <div className="flex">
                        <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5" style={{ color: 'var(--color-white)' }}>
                          Download Orders Data
                        </p>
                      </div>
                      <p className="m-0 p-0 font-normal font-body text-sm leading-4 text-success-text" />
                    </div>
                  </div>
                  <img src="/brand/msa/merlin/lined/chevron-up-white.svg" alt="" width="20" height="20" className="rotate-180" />
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <Separator />
      <div className="relative flex overflow-hidden bg-info-bg items-stretch h-26.5">
        <div className="absolute h-full flex items-center justify-center w-27.5 bg-info-bg shrink-0">
          <img src="/brand/msa/merlin/filled/label-box.svg" alt="" width="100" height="70" />
        </div>
        <div className="flex flex-col justify-center w-full ml-27.5 px-3 py-2">
          <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">❌ Label download failed? ✅ Meesho will retry automatically</h1>
          <div className="flex w-full justify-between mt-1.5">
            <div>
              {/* Live markup nests a <p> in a <p>; spans keep the same inline layout as the live render. */}
              <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5 flex items-center gap-1">
                We will
                <span className="m-0 p-0 font-body text-lg leading-5 font-bold text-primary-text">notify you once it's ready for download</span>
              </p>
              <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5 flex items-center gap-1">
                Don't worry! Your orders will
                <span className="m-0 p-0 font-body text-lg leading-5 font-bold text-primary-text">not be blocked or lose visibility</span>
              </p>
            </div>
            <div className="flex justify-end text-secondary-text text-xs font-bold font-body -rotate-90 items-end leading-normal">*T&amp;Cs apply</div>
          </div>
        </div>
      </div>

      <Separator />
      <div className="flex items-center justify-between bg-primary-bg py-3 px-4">
        <div className="flex items-center">
          <img className="mr-3.5" src="/brand/msa/fulfillment/branded_packet.svg" alt="" />
          <p className="text-primary-text text-xl font-bold font-heading leading-normal my-[1em]">
            As per Meesho packaging policy, all sellers must use Transparent Barcoded Packaging for their products on the platform.
          </p>
        </div>
        <div className="flex items-center shrink-0">
          <Button variant="outline" size="sm" onClick={() => notInPrototype('Buy Barcoded Packets')}>
            Buy Barcoded Packets
          </Button>
          <Button variant="outline" size="sm" className="ml-2" onClick={() => notInPrototype('Scan Barcoded Packets')}>
            Scan Barcoded Packets
          </Button>
        </div>
      </div>
      <Separator />
      <Separator />

      <div className="sticky" style={{ top: 'calc(var(--concept-strip-h) + 60px)', zIndex: 10 }}>
        <div className="flex items-center bg-white justify-between border-b border-solid border-tertiary-border">
          <div role="tablist" className="flex overflow-scroll max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b-tertiary-border border-b-0" aria-orientation="horizontal">
            {TABS.map((t, i) => (
              <button
                key={t.slug}
                className={TAB}
                id={`tab-${i}`}
                type="button"
                role="tab"
                aria-selected={t.slug === active}
                data-active={t.slug === active}
                onClick={() => navigate(paths.ordersTab(t.slug))}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white" role="tabpanel">
        <div className="flex items-center justify-between mx-4">
          <div className="flex items-center gap-3 pt-2">
            <FilterLabel />
            <div><FilterSelect id="sla_status" label="SLA Status" width={140} /></div>
            <div><FilterSelect id="dispatch_date" label="Dispatch Date" width={140} /></div>
            <div><FilterSelect id="order_date" label="Order Date" width={140} /></div>
          </div>
          <div className="flex ml-auto mt-2">
            <div className="flex">
              <div className="flex flex-col gap-1 rounded-md">
                <div className="group text-sm flex relative font-normal leading-5 items-center box-border w-full gap-2.5 p-0 m-0 text-primary-text border border-solid border-secondary-border transition-[border-color] duration-200 ease-in-out focus-within:border-brand-primary-border hover:border-brand-primary-border rounded-md">
                  <div className="relative inline-block z-5" data-with-arrow="false">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 bg-none border-0 border-solid border-r border-r-secondary-border cursor-pointer text-primary-text z-10 whitespace-nowrap h-[2.625rem] group-focus-within:border-r-brand-primary-border group-hover:border-r-brand-primary-border"
                      onClick={() => notInPrototype('The search-type menu')}
                    >
                      SKU ID
                      <img src="/brand/msa/merlin/lined/chevron-down-grey.svg" alt="" width="16" height="16" />
                    </button>
                  </div>
                  <input
                    className="peer flex-1 bg-transparent border-none text-lg [font-family:inherit] transition-all duration-200 ease-in-out rounded-sm outline-none min-h-[2.75rem] z-1 placeholder:text-secondary-border focus:z-1 px-3"
                    type="text"
                    aria-label="Search orders"
                  />
                  <img src="/brand/msa/merlin/lined/search-light-grey.svg" alt="" width="20" height="20" className="cursor-pointer mr-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center mt-3 box-border pb-16 bg-secondary-bg" style={{ height: 'calc(-168px + 100vh)' }}>
          <div className="flex items-center justify-center w-full bg-white" style={{ height: '100%' }}>
            <FulfillmentEmpty img="/brand/msa/crystal/system/line/empty-order.svg" title="No orders yet" body="But keep checking this section from time to time." />
          </div>
        </div>
      </div>
    </div>
  );
}
