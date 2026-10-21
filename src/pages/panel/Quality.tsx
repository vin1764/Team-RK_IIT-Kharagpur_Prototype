// Product Quality (/cataloging/demo/product-optimiser), ported from reference/html/meesho-quality.html.
// Every number is as captured: no ratings yet, so no score, and nothing in any tab.
import { useState } from 'react';
import { notInPrototype } from '../../components/Toast';
import { ListingScoreCard } from './factory-launch/ListingScoreCard';
import { InfoIcon, TEXT_BTN } from './quality/parts';

const RATINGS = { lowStar: 0, total: 0 };

const BANDS = [
  { name: 'Green', range: '0 - 15%', views: '1.6X VIEWS', bar: 'bg-success-border rounded-l-2xl', tip: 'Quality score 0 - 15%: products get 1.6X views' },
  { name: 'Yellow', range: '15 - 22%', views: '1X VIEWS', bar: 'bg-[#FFD78A]', tip: 'Quality score 15 - 22%: products get 1X views' },
  { name: 'Red', range: '22 - 25%', views: '0.6X VIEWS', bar: 'bg-error-border', tip: 'Quality score 22 - 25%: products get 0.6X views' },
  { name: 'Blocked', range: 'More than 25%', views: 'NO VIEWS', bar: 'bg-[#FFAFAC] rounded-r-2xl', tip: 'Quality score more than 25%: products get no views' },
];

const TABS = [
  { id: 'blocking', label: 'Blocking Soon', count: 0 },
  { id: 'pending', label: 'Action Pending', count: 0 },
  { id: 'fixed', label: 'Fixed', count: 0 },
];

const TAB_CLS =
  'py-3 text-lg cursor-pointer transition-all duration-200 ease-in-out text-primary-text bg-transparent border-0 border-solid whitespace-nowrap [font-family:inherit] focus-visible:outline-1 focus-visible:outline-brand-primary-bg focus-visible:rounded-md border-b-2 border-b-transparent data-[active=true]:border-b-brand-primary-bg data-[active=true]:font-semibold pt-2.5 pb-2 px-3 leading-5 min-w-22.5 font-body data-[active=true]:font-button hover:!bg-secondary-bg hover:!text-primary-text data-[active=true]:!text-brand-primary-text data-[active=true]:hover:!text-brand-primary-text';

const TH =
  'text-start border-[0.03125rem] border-t-0 border-secondary-border border-solid';

const COLUMNS = [
  { w: 300, title: 'Product Details and Quality Score' },
  { w: 289, title: 'Top Customer Feedback', sub: 'from 1 & 2 star ratings' },
  { w: 336, title: 'Product Listing Improvements' },
  { w: 128, title: 'Action' },
];

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex gap-1">
      <p className="m-0 p-0 font-normal font-body text-xl leading-5 text-secondary-text">{label}</p>
      {value !== undefined && <h4 className="m-0 p-0 text-primary-text font-bold font-heading text-xl leading-5">{value}</h4>}
    </div>
  );
}
const Dot = () => <p className="m-0 p-0 font-normal font-body text-xl leading-5 text-secondary-border">•</p>;

export default function Quality() {
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const score = RATINGS.total ? `${Math.round((100 * RATINGS.lowStar) / RATINGS.total)}%` : 'N/A';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-500 flex justify-between box-border p-4 bg-primary-bg">
        <div className="flex items-center justify-between">
          <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Product Quality</h1>
        </div>
        <button type="button" className={`${TEXT_BTN} justify-center h-auto flex items-center gap-2 p-0`} onClick={() => notInPrototype('Learn about Quality')}>
          <img src="/brand/msa/merlin/filled/youtube.svg" alt="" width="24" height="24" className="h-6 w-6" />
          <p className="m-0 p-0 text-primary-text font-normal font-body text-xl leading-5">Learn about Quality</p>
        </button>
      </div>

      <div className="flex flex-col gap-2 my-2 p-4 bg-primary-bg">
        {/* Info strip */}
        <div className="flex h-auto items-center gap-2 p-2 rounded-md flex-wrap border border-solid border-success-text bg-success-bg">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/brand/msa/merlin/filled/info-grey.svg" alt="" width="20" height="20" />
            <h5 className="m-0 p-0 text-primary-text text-lg leading-5 font-semibold font-button">Quality score updated. Based on ratings from</h5>
          </div>
          <div className="box-content inline-flex items-center justify-center gap-1 h-5 px-2 py-0.5 rounded-xl whitespace-nowrap shrink-0 border-0 bg-success-text text-white text-base font-medium">
            <img src="/brand/msa/merlin/filled/reduce-rto-and-returns-shield.svg" alt="" width="20" height="20" className="h-5 w-5" />
            <h5 className="m-0 p-0 text-lg leading-5 font-semibold font-button text-white">Trusted and verified customers</h5>
          </div>
        </div>

        {/* C2M LW-8: listing score for a launched listing, from the first live day */}
        <ListingScoreCard />

        <div className="relative flex h-full justify-between gap-2">
          {/* Quality Score */}
          <div className="flex-3 flex flex-col gap-6 rounded-lg border border-solid border-tertiary-border p-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">Quality Score</h3>
                <InfoIcon
                  label="What is quality score?"
                  text="Quality score is the share of your ratings that are 1 or 2 stars."
                  btnClass="h-auto mt-2 mb-1.5 flex items-center justify-center py-0 pl-0 pr-2"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Stat label="1 and 2 star ratings" value={RATINGS.lowStar} />
                <Dot />
                <Stat label="Total Ratings" value={RATINGS.total} />
                <Dot />
                <Stat label={`Quality Score = ${score}`} />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center mt-2">
              <img src="/brand/msa/merlin/filled/empty-state.svg" alt="" width="46" height="40" className="h-10" data-testid="empty-state-icon" />
              <div className="flex flex-col items-center justify-center mt-2">
                <span className="m-0 p-0 font-semibold font-button text-xl leading-5 text-primary-text">No score available</span>
                <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text">Since you don’t have enough ratings.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 py-2 mx-4 mb-0 mt-0">
              <div className="flex flex-1 gap-px rounded-lg">
                {BANDS.map((b) => (
                  <div key={b.name} className={`relative flex flex-1 items-center justify-center py-1 ${b.bar}`}>
                    <p className="m-0 p-0 font-body text-xs leading-4 font-semibold text-secondary-text">{b.views}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-1 gap-px">
                {BANDS.map((b) => (
                  <div key={b.name} className="flex flex-1 flex-col items-center justify-center gap-1">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <span className="m-0 p-0 font-semibold font-button text-xl leading-5 text-primary-text">{b.name}</span>
                      <InfoIcon label={`What ${b.name} means`} text={b.tip} btnClass="h-auto mt-1.5 mb-1.5 flex items-center justify-center py-0 pr-0 pl-1" />
                    </div>
                    <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text">{b.range}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Customer Feedback */}
          <div className="flex-2 p-4 rounded-lg bg-primary-bg border border-solid border-tertiary-border">
            <div className="flex flex-col h-full">
              <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">Top Customer Feedback</h3>
              <div className="flex flex-col items-center justify-center p-1 text-center h-full">
                <div className="mb-3">
                  <img src="/brand/msa/merlin/lined/sign-board.svg" alt="" width="32" height="32" className="inline align-baseline h-8 w-8" />
                </div>
                <span className="m-0 p-0 font-semibold font-button text-xl leading-5 text-primary-text">No feedback available</span>
                <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text w-7/10">Great work! Continue listing good quality products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Recommendations */}
      <div className="flex flex-col sticky top-0 z-1000 bg-primary-bg">
        <div className="flex items-center justify-between bg-primary-bg pt-4 pr-4 pb-2 pl-4">
          <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">Quality Recommendations</h3>
          <div className="relative">
            <div className="box-content flex-col flex h-8 w-58 items-center justify-center gap-0 rounded-[0.3125rem] px-3">
              <div className="group text-sm relative font-normal leading-5 box-content p-0 m-0 text-primary-text border border-solid border-secondary-border transition-[border-color] duration-200 ease-in-out focus-within:border-brand-primary-border hover:border-brand-primary-border flex h-8 w-58 items-center justify-center gap-0 rounded-[0.3125rem] px-3">
                <img src="/brand/msa/merlin/lined/search-grey.svg" alt="" width="20" height="20" className="h-5 w-4.25 shrink-0" />
                <input
                  className="peer border-none [font-family:inherit] transition-all duration-200 ease-in-out rounded-sm z-1 focus:z-1 h-5 min-h-5 min-w-0 flex-1 border-0 bg-transparent p-2 text-lg leading-5 text-primary-text caret-brand-primary-text outline-none placeholder:text-primary-text/42"
                  type="text"
                  placeholder="Search By Style / SKU / Catalog ID"
                  aria-label="Search by style, SKU or catalog ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-primary-bg border-0 border-b border-solid border-tertiary-border">
          <div role="tablist" className="flex overflow-scroll max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b-0" aria-orientation="horizontal">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} data-active={tab === t.id} className={TAB_CLS} onClick={() => setTab(t.id)}>
                {t.label} ({t.count})
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1 px-3">
            <button type="button" className={`${TEXT_BTN} inline-flex items-center justify-center h-auto p-0 font-semibold`} onClick={() => notInPrototype('View Blocked Products')}>
              View Blocked Products
            </button>
            <InfoIcon label="What blocked products means" text="Products with a quality score of more than 25% are blocked and get no views." btnClass="h-auto flex items-center justify-center p-0" />
          </div>
        </div>
        <div className="bg-primary-bg py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5 mr-2.5">Sort by :</p>
              <div className="inline-block relative w-max cursor-not-allowed" id="sort_by">
                <button
                  type="button"
                  disabled
                  aria-expanded="false"
                  className="font-button transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:touch-none disabled:text-tertiary-text px-3 text-lg flex p-0 h-8 w-full select-none items-center justify-between gap-0 rounded-sm border border-solid pl-2.75 pr-1.75 text-left cursor-not-allowed border-tertiary-border !bg-secondary-bg text-secondary-border"
                >
                  <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-border">Relevance</p>
                  <span className="m-0 p-0 font-semibold text-tertiary-text font-button text-base leading-4 flex py-1.25 pl-2">
                    <img src="/brand/msa/merlin/lined/chevron-up-disabled.svg" alt="" width="24" height="24" className="rotate-180 h-5 w-5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <table aria-label="sticky table" className="w-full table-auto border-separate border-spacing-0 bg-primary-bg">
        <thead>
          <tr className="z-3 sticky bg-tertiary-bg" style={{ top: 146 }}>
            {COLUMNS.map((c, i) => (
              <th key={c.title} className={`${TH} ${i === 0 ? 'border-l-0' : ''} ${i === COLUMNS.length - 1 ? 'border-r-0' : ''}`} style={{ width: c.w }}>
                <div className="p-3">
                  {c.sub ? (
                    <>
                      <div className="flex gap-1 mb-1">
                        <span className="m-0 p-0 font-semibold font-button text-base leading-4 text-primary-text">{c.title}</span>
                        <InfoIcon
                          label="What top customer feedback means"
                          text="The most common feedback in your 1 & 2 star ratings."
                          btnClass="flex w-3 h-3 items-center justify-center mt-0.5 p-0"
                          size={12}
                        />
                      </div>
                      <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text">{c.sub}</p>
                    </>
                  ) : (
                    <span className="m-0 p-0 font-semibold font-button text-base leading-4 block text-primary-text">{c.title}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody />
      </table>
      <div className="h-px w-full" />
      <div className="flex flex-auto flex-col items-center justify-center h-full mt-5">
        <img src="/brand/msa/merlin/lined/empty-box.svg" alt="" width="105" height="81" className="w-26.25 h-20.25" />
        <div className="text-center mt-5">
          <span className="m-0 p-0 font-semibold font-button text-xl leading-5 text-primary-text">No products as of now</span>
          <p className="m-0 p-0 font-normal font-body text-sm leading-4 text-secondary-text mt-1">Products that have poor quality or listing issues will appear here.</p>
        </div>
      </div>
    </div>
  );
}
