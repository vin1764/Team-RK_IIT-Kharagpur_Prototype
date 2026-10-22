// Manage Pricing (Pricing → Manage Pricing). Faithful replica of reference/html/meesho-manage-pricing.html
// in its captured empty state. Sections are separate components so later phases can add a tab
// (Price position) without touching the rest.
import { useState } from 'react';
import { useParams } from 'react-router';
import { cx } from '../../components/ui';
import { CrystalPage, Dropdown, SearchBox, T, UfoEmpty } from './manage-pricing/crystal';
import { PricingTabs, type PricingTab } from './manage-pricing/PricingTabs';
import { PricePositionTab } from './manage-pricing/PricePositionTab';
import { usePriceHold } from './manage-pricing/priceHold';
import { NewTag } from './promotions/PromoParts';
import { useT } from '../../i18n';

// Counts as captured on the live panel (21 Oct 2026): the demo seller has no live products.
const CAPTURED = { orderGrowth: 0, orderGrowthPct: 0, priceUpdates: 0, losingOrderProducts: 0 };

export const PRICING_TABS: PricingTab[] = [
  { id: 'allproducts', label: 'All Products', count: 0 },
  { id: 'lorders', label: 'Losing Orders', count: 0 },
  { id: 'lviews', label: 'Losing Views', count: 0 },
  { id: 'best', label: 'Best Priced', count: 0 },
];

// Menu options weren't captured: the captured default first, then neutral alternatives.
const PERIODS = ['Last 7 days', 'Last 30 days'];
const CATEGORIES = ['All Categories'];
const SORTS = ['High Estimated Orders', 'Low Estimated Orders', 'Recently Updated'];

const OUTLINE_BTN =
  'inline-flex items-center justify-center rounded-6 font-medium font-default cursor-pointer transition-all duration-200 ease-in-out bg-transparent border border-solid outline-transparent hover:bg-brand-light active:outline-offset-2 active:outline-2 active:outline-brand-disabled px-3 border-neutral-light gap-1 text-body-small leading-4 text-neutral-primary h-8 font-regular';

function PricingHeader() {
  return (
    <header className="flex items-center justify-between min-h-16 gap-2 text-neutral-primary z-100 bg-neutral-base shadow-none tracking-[-0.1px] mb-3 border-0 border-b border-solid border-neutral-light sticky top-(--concept-strip-h) p-4">
      <div className="flex gap-1">
        <h1 className={cx(T.h1, 'pl-0 tracking-[-0.1px]')}>Pricing</h1>
      </div>
      <SearchBox placeholder="Search by Style/SKU ID or Catalog ID" />
    </header>
  );
}

function PricePerformance() {
  const [period, setPeriod] = useState('Last 30 days');
  return (
    <div
      className="flex flex-col border border-solid w-73 border-neutral-light rounded-md p-4 flex-1 gap-4 max-w-[33%]"
      data-testid="ipp-price-performance"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className={cx(T.h3, 'tracking-[-0.1px]')}>Price Performance</h3>
          <div className="min-w-25 flex justify-end">
            <Dropdown
              value={period}
              options={PERIODS}
              onChange={setPeriod}
              align="right"
              chevronSrc="/brand/msa/merlin/lined/chevron-up-blue.svg"
              buttonClass="inline-flex items-center justify-center rounded-6 font-medium font-default border-none cursor-pointer transition-all duration-200 ease-in-out bg-transparent text-brand-primary outline-transparent hover:bg-brand-light gap-1 h-auto text-body-medium leading-5 px-0"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 mr-8">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>Order Growth</p>
            <div className="flex items-center">
              <h3 className={T.h3}>{CAPTURED.orderGrowth}</h3>
              <div className="relative inline-block">
                <div className="flex cursor-default">
                  <img src="/brand/msa/merlin/filled/caret-up-green.svg" alt="caret down" width="16" height="16" />
                  {/* The live panel prints "null%" here when there's no history (a panel bug); we show 0%. */}
                  <p
                    className={cx(T.bodySm, 'h-4.25 text-danger-secondary border-0 border-b border-dashed border-danger-dark data-[is-positive-gain=true]:text-success-secondary')}
                    data-is-positive-gain="true"
                  >
                    {CAPTURED.orderGrowthPct}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-0.25 border-0 border-l border-solid border-l-neutral-light h-full" role="separator" aria-orientation="vertical" />
          <div className="flex flex-col gap-1 ml-8">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>Price Updates</p>
            <h3 className={T.h3}>{CAPTURED.priceUpdates}</h3>
          </div>
        </div>
      </div>
      <div className="w-full border-0 border-b border-b-neutral-light border-dashed h-0" role="separator" aria-orientation="horizontal" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <img src="/brand/msa/merlin/filled/alert-warning.svg" alt="" width="16" height="16" />
          <p className={cx(T.bodyMd, 'text-neutral-primary')}>Losing Order</p>
          <p className={cx(T.bodyMd.replace('font-regular', 'font-bold'), 'text-neutral-primary ml-1')}>{CAPTURED.losingOrderProducts} Products</p>
        </div>
        <p className={cx(T.bodySm, 'text-neutral-secondary')}>Reduce price and increase more orders</p>
      </div>
    </div>
  );
}

function Overview() {
  return (
    <div className="flex bg-neutral-base">
      <div className="flex flex-col w-full p-4 flex-1">
        <h2 className={cx(T.h2, 'mb-4 tracking-[-0.1px]')}>Overview</h2>
        <div className="flex gap-x-4 flex-1">
          <PricePerformance />
        </div>
      </div>
    </div>
  );
}

function FilterBar() {
  const [category, setCategory] = useState('Category');
  const [sort, setSort] = useState('High Estimated Orders');
  return (
    <div className="flex justify-between items-center px-4 bg-neutral-base pb-3 pt-3">
      <div className="flex items-center gap-3">
        <p className={cx(T.bodySm, 'text-neutral-primary')}>Filter by :</p>
        <Dropdown value={category} options={CATEGORIES} onChange={setCategory} buttonClass={OUTLINE_BTN} note="No categories with live products" />
      </div>
      <div className="flex items-center gap-3">
        <p className={cx(T.bodySm, 'text-neutral-primary')}>Sort by :</p>
        <Dropdown value={sort} options={SORTS} onChange={setSort} buttonClass={OUTLINE_BTN} align="right" />
      </div>
    </div>
  );
}

/** C2M PI-2: the fifth tab, only for a seller with a Factory Launch listing (doc p.7). */
export const PRICE_POSITION_TAB = 'price-position';

export default function ManagePricing() {
  const { tab } = useParams();
  const t = useT();
  const hold = usePriceHold();
  const tabs: PricingTab[] = hold
    ? [...PRICING_TABS, { id: PRICE_POSITION_TAB, label: t('pi.tab'), badge: <NewTag className="ml-1" />, c2m: 'PI-2' }]
    : PRICING_TABS;
  const [picked, setActive] = useState(tab ?? 'allproducts');
  const active = tabs.some((x) => x.id === picked) ? picked : 'allproducts';
  return (
    <CrystalPage>
      <PricingHeader />
      <Overview />
      <PricingTabs tabs={tabs} active={active} onChange={setActive} />
      {hold && active === PRICE_POSITION_TAB ? (
        <PricePositionTab v={hold} />
      ) : (
        <>
          <FilterBar />
          {/* Every tab is empty for this seller, as captured. */}
          <UfoEmpty title="No price available" text="No active products live, keep checking." />
        </>
      )}
    </CrystalPage>
  );
}
