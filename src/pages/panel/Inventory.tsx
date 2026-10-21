// Inventory. Faithful replica of reference/html/meesho-inventory.html in its captured empty state
// (Active tab, All Stock), including the first-visit coach-mark under the Active tab.
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { notInPrototype } from '../../components/Toast';
import { cx } from '../../components/ui';
import { CrystalPage, Dropdown, T } from './manage-pricing/crystal';
import { CoachMark } from './inventory/CoachMark';
import { StatusTabs, StockTabs, type InvTab } from './inventory/StockTabs';
import { SkuList, stockTabRows } from './growth-loop/SkuList';
import { useGrowth } from './growth-loop/useGrowth';
import type { GrowthView } from '../../engine/ui';
import { useDemo } from '../../store/demo';

/** The first-visit coach-mark is a first-visit thing: from demo day D4 the maker has been here before. */
const COACH_MARK_UNTIL_DAY = 3;

// Counts as captured on the live panel (21 Oct 2026). Tooltip copy wasn't captured (ours, neutral).
const STATUS_TABS: InvTab[] = [
  { id: 'active', label: 'Active', count: 0 },
  { id: 'activation_pending', label: 'Activation Pending', count: 1 },
  { id: 'blocked', label: 'Blocked', count: 0 },
  { id: 'paused', label: 'Paused', count: 0, info: 'Catalogs you have paused. They are not shown to buyers.' },
];
const STOCK_TABS: InvTab[] = [
  { id: 'all_stock', label: 'All Stock', count: 0 },
  { id: 'out_of_stock', label: 'Out of Stock', count: 0 },
  { id: 'low_stock', label: 'Low Stock', count: 0, info: 'Products that are running low on stock.' },
];

// Menu options weren't captured: the captured default first, then neutral alternatives.
const CATEGORIES = ['All Categories'];
const SORTS = ['Highest Estimated Orders', 'Lowest Estimated Orders', 'Recently Added'];

const MEDIUM = 'font-[500]'; // this micro-frontend resolves font-medium to 500, not 560

const SELECT_BTN =
  'inline-flex items-center justify-center gap-1 rounded-6 font-default cursor-pointer transition-all duration-200 ease-in-out bg-transparent text-brand-primary outline-transparent hover:bg-brand-light active:outline-offset-2 active:outline-2 active:outline-brand-disabled h-9 text-body-medium py-0 px-3 border border-solid border-neutral-light ' +
  MEDIUM;

function Header() {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between min-h-16 gap-2 text-neutral-primary sticky top-(--concept-strip-h) z-100 bg-neutral-base shadow-none mb-3 border-0 border-b border-solid border-neutral-light p-4">
      <div className="flex gap-1">
        <h1 className={cx(T.h1, 'pl-0')}>Inventory</h1>
      </div>
      <div className="flex gap-4 items-center">
        <div className="flex items-center cursor-pointer gap-2" onClick={() => notInPrototype('The "How it Works?" video')}>
          <img src="/brand/msa/merlin/filled/training-red.svg" alt="" width="16" height="16" />
          <p className={cx(T.bodyMd.replace('font-regular', MEDIUM), 'text-neutral-primary')}>How it Works?</p>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <div className="flex flex-col min-w-79 gap-0 h-9.25">
              <div className="group text-body-xsmall leading-4 flex relative font-normal items-center box-border w-full p-0 m-0 text-neutral-primary border border-solid border-neutral-light rounded-sm transition-[border-color] duration-200 ease-in-out focus-within:border-brand-base hover:border-brand-base min-w-79 gap-0 h-9.25">
                <img src="/brand/msa/merlin/lined/search-grey.svg" alt="" width="20" height="20" className="ml-4" />
                <input
                  className="peer flex-1 bg-transparent border-none leading-5 [font-family:inherit] transition-all duration-200 ease-in-out rounded-sm outline-none min-h-11 px-4 z-1 focus:z-1 pl-2 placeholder:text-neutral-tertiary text-neutral-primary text-body-small"
                  type="text"
                  placeholder="Search by Catalog ID/Style ID/SKU ID"
                />
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(paths.catalogUploadsBulk)}
          className={cx(
            'justify-center rounded-6 font-default border-none cursor-pointer transition-all duration-200 ease-in-out bg-brand-base text-brand-inverse active:bg-brand-pressed hover:bg-brand-hover h-9 px-4 text-body-medium flex items-center gap-2',
            MEDIUM,
          )}
        >
          <img src="/brand/msa/merlin/filled/upload-white.svg" alt="upload" width="16" height="16" />
          Catalog Upload
        </button>
      </div>
    </header>
  );
}

function FilterBar() {
  const [category, setCategory] = useState('Select Category');
  const [sort, setSort] = useState('Highest Estimated Orders');
  const label = (l: string) => <p className={cx(T.bodySm, 'text-neutral-primary')}>{l}</p>;
  return (
    <div className="bg-neutral-base px-4 mb-1">
      <div className="py-3 flex justify-between items-center">
        <div className="flex flex-row items-center gap-3">
          <p className={cx(T.bodySm, 'text-neutral-primary')}>Filter by :</p>
          <Dropdown value={category} options={CATEGORIES} onChange={setCategory} buttonClass={SELECT_BTN} chevron={16} wrapLabel={label} note="No categories with catalogs yet" />
        </div>
        <div className="flex flex-row items-center gap-3">
          <p className={cx(T.bodySm, 'text-neutral-primary')}>Sort catalogs by :</p>
          <div className="w-48">
            <Dropdown value={sort} options={SORTS} onChange={setSort} buttonClass={SELECT_BTN} chevron={16} wrapLabel={label} align="right" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NoCatalogs() {
  return (
    <div className="flex items-center justify-center flex-col h-[calc(100vh-4rem)]">
      <img src="/brand/msa/merlin/lined/empty-catalog.svg" alt="" width="80" height="80" />
      <p className={cx(T.bodyLg.replace('font-regular', MEDIUM), 'text-neutral-primary pt-5')}>No Catalogs</p>
      <p className={cx(T.bodySm, 'text-neutral-secondary w-78.75 text-center')}>
        Upload catalogs through our website on the desktop. Once done, you can view and manage them here.
      </p>
    </div>
  );
}

export default function Inventory() {
  // Null before D28 and in plain mode ("Today vs ours"): the captured empty page.
  const g = useGrowth();
  // ?stock=<tab id> opens that stock tab (showcase jumps, e.g. the verdicts on All Stock).
  const [params] = useSearchParams();
  const asked = params.get('stock');
  const stockParam = asked && STOCK_TABS.some((t) => t.id === asked) ? asked : null;
  // Remount when the growth loop switches on or off (demo day / persona) or ?stock= changes, so the tab follows.
  return <InventoryView key={`${g ? 'growth' : 'captured'}-${stockParam ?? ''}`} g={g} stockParam={stockParam} />;
}

function InventoryView({ g, stockParam }: { g: GrowthView | null; stockParam: string | null }) {
  const day = useDemo((s) => s.day);
  const [status, setStatus] = useState('active');
  // From D28 (growth loop) the page opens on Low Stock, where the restock card is (GL-2).
  const [stock, setStock] = useState(stockParam ?? (g ? 'low_stock' : 'all_stock'));
  // D28+ (Jasmeet): her live SKUs fill Active; the tab counts follow the rows shown (C2M, GL-2/GL-5).
  const rows = g ? stockTabRows(g) : null;
  const statusTabs = rows ? STATUS_TABS.map((t) => ({ ...t, count: t.id === 'active' ? rows.all_stock.length : 0 })) : STATUS_TABS;
  const stockTabs = rows ? STOCK_TABS.map((t) => ({ ...t, count: rows[t.id as keyof typeof rows].length })) : STOCK_TABS;
  const shown = g && rows && status === 'active' ? rows[stock as keyof typeof rows] : [];
  return (
    <CrystalPage className="h-screen flex flex-col">
      <Header />
      <StatusTabs tabs={statusTabs} active={status} onChange={setStatus}>
        {day <= COACH_MARK_UNTIL_DAY && <CoachMark text="Find all your live catalogs here" className="top-11 left-4" />}
      </StatusTabs>
      <StockTabs
        tabs={stockTabs}
        active={stock}
        onChange={setStock}
        action={
          <button
            type="button"
            onClick={() => notInPrototype('Bulk Stock Update')}
            className={cx(
              'rounded-6 font-default border-none cursor-pointer transition-all duration-200 ease-in-out bg-transparent text-brand-primary outline-transparent hover:bg-brand-light active:outline-offset-2 active:outline-2 active:outline-brand-disabled h-9 px-4 text-body-medium inline-flex items-center justify-center gap-2',
              MEDIUM,
            )}
          >
            <img src="/brand/msa/merlin/filled/bulk-upload-blue.svg" alt="" width="16" height="16" className="block shrink-0" />
            Bulk Stock Update
          </button>
        }
      />
      <FilterBar />
      {/* Before D28 every status/stock tab is empty for this seller as captured (the one pending catalog's row wasn't captured). */}
      {g && shown.length ? <SkuList g={g} rows={shown} tab={stock} onTab={setStock} /> : <NoCatalogs />}
    </CrystalPage>
  );
}
