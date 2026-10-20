// Pricing → Reduce RTO & Returns. Faithful replica of reference/html/meesho-reduce-rto-returns.html
// (captured on the "Discounts Applied" tab, empty). The "%" chips are blank on the live panel
// for this seller and are kept blank here.
import { useNavigate, useParams } from 'react-router';
import { paths } from '../../app/paths';
import { cx } from '../../components/ui';
import { CrystalPage, SearchBox, T, UfoEmpty } from './manage-pricing/crystal';

// As captured on the live panel (21 Oct 2026). Rates are blank ("%"), counts 0 of 1 product.
const CAPTURED = {
  rto: { codRto: '', prepaidRto: '', withDiscount: 0, total: 1 },
  returns: { allReturns: '', withWdrp: '', withDiscount: 0, total: 1 },
  addDiscount: 0,
  applied: 0,
};

function Header() {
  const navigate = useNavigate();
  return (
    <div className="sticky z-7 top-(--concept-strip-h) mb-3 border-0 border-b border-solid border-neutral-light">
      <div className="flex justify-between items-center px-4 bg-neutral-base">
        <div className="flex items-center pt-4 pb-2">
          <p className={cx('m-0 text-body-small leading-4 cursor-pointer hover:text-brand-primary')} onClick={() => navigate(paths.managePricing)}>
            Pricing
          </p>
          <img src="/brand/msa/merlin/chevron.svg" alt="" width="24" height="24" className="text-neutral-tertiary w-6 h-4 rotate-90" />
          <p className="m-0 text-body-small leading-4 text-neutral-tertiary cursor-default">Reduce RTO &amp; Returns</p>
        </div>
      </div>
      <div className="flex gap-2 mb-0 bg-neutral-base border-0 border-b border-solid px-4 items-center pb-4 pt-0 border-neutral-light">
        <div className="cursor-pointer h-7" onClick={() => navigate(paths.managePricing)} role="button" aria-label="Back">
          <img src="/brand/msa/merlin/lined/chevron-up-grey.svg" alt="" width="28" height="28" className="-rotate-90 origin-center" />
        </div>
        <div className="flex justify-between flex-1 items-baseline">
          <h1 className={T.h1}>Reduce RTO &amp; Returns</h1>
          <SearchBox placeholder="Search by Subcategory" />
        </div>
      </div>
    </div>
  );
}

function RateChip({ value, tone }: { value: string; tone: 'info' | 'success' }) {
  return tone === 'info' ? (
    <div className="py-1 rounded-[0.3125rem] flex items-center px-2 bg-information-light">
      <p className={cx(T.bodySm.replace('font-regular', 'font-medium'), 'text-neutral-primary')}>{value}%</p>
    </div>
  ) : (
    <div className="py-1 rounded-[0.3125rem] bg-success-light flex items-center w-max px-2">
      <p className={cx(T.bodySm.replace('font-regular', 'font-medium'), 'text-success-secondary')}>{value}%</p>
    </div>
  );
}

function DiscountCard({
  icon,
  title,
  before,
  after,
  progressLabel,
  done,
  total,
  tip,
}: {
  icon: string;
  title: string;
  before: { label: string; value: string };
  after: { label: string; value: string };
  progressLabel: string;
  done: number;
  total: number;
  tip: string;
}) {
  const pct = total ? (100 * done) / total : 0;
  return (
    <div className="flex flex-col rounded-lg border border-solid px-4 pt-4 pb-4 gap-4 border-neutral-light flex-1">
      <div className="flex gap-1 items-start">
        <img src={icon} alt="" width="30" height="30" />
        <h3 className={T.h3}>{title}</h3>
      </div>
      <div className="flex flex-row px-0 gap-6">
        <div className="flex gap-2 flex-initial">
          <div className="flex flex-col gap-2 min-w-0">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{before.label}</p>
            <div className="flex items-center gap-2">
              <RateChip value={before.value} tone="info" />
              <div className="flex items-center h-4">
                <div className="border-0 border-b border-dashed border-neutral-light w-3.5" />
                <div className="rounded-xs bg-neutral-page px-2">
                  <p className={cx(T.bodySm, 'text-neutral-secondary')}>vs</p>
                </div>
                <div className="border-0 border-b border-dashed border-neutral-light w-3.5" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{after.label}</p>
            <RateChip value={after.value} tone="success" />
          </div>
        </div>
        <div className="h-12 border-0 border-r border-neutral-light border-solid" />
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex flex-col gap-1">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{progressLabel}</p>
            <p className={cx(T.bodyLg.replace('font-regular', 'font-medium'), 'text-neutral-primary')}>
              {done} / {total}
            </p>
          </div>
          <div className="w-43.5">
            <div className="overflow-hidden rounded-sm bg-neutral-hover">
              <div className="rounded-[0.078125rem] h-1 bg-success-base" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex border-0 border-t border-dashed items-start gap-1 pt-4 px-0 border-neutral-light">
        <img src="/brand/msa/merlin/filled/success-new.svg" alt="" width="16" height="16" />
        <p className={cx(T.bodySm, 'text-neutral-primary')}>{tip}</p>
      </div>
    </div>
  );
}

function DiscountCards() {
  const { rto, returns } = CAPTURED;
  return (
    <>
      <div className="flex bg-neutral-base p-4 flex-row gap-4">
        <DiscountCard
          icon="/brand/msa/merlin/filled/reduce-rto.svg"
          title="Reduce RTO by Prepaid Discount"
          before={{ label: 'COD RTO', value: rto.codRto }}
          after={{ label: 'Prepaid RTO', value: rto.prepaidRto }}
          progressLabel="Products with Prepaid Discount"
          done={rto.withDiscount}
          total={rto.total}
          tip="Convert COD to prepaid, get more prepaid orders & Reduce RTO risk"
        />
        <DiscountCard
          icon="/brand/msa/merlin/filled/reduce-returns.svg"
          title="Reduce Returns by Wrong/Defective Return Price"
          before={{ label: 'All Returns', value: returns.allReturns }}
          after={{ label: 'With WDRP', value: returns.withWdrp }}
          progressLabel="Products with WDRP"
          done={returns.withDiscount}
          total={returns.total}
          tip="Add WDRP avoid unwanted returns. Only get genuine ones"
        />
      </div>
      <div className="bg-neutral-base flex flex-col gap-4 pb-4 px-4">
        <div className="flex items-center py-2 justify-between text-neutral-primary border border-solid px-4 bg-information-light border-information-light gap-2 rounded-4">
          <div className="flex items-start gap-2">
            <img src="/brand/msa/merlin/filled/bulb-info.svg" alt="" width="20" height="20" />
            <p className={cx(T.bodyMd, 'text-information-secondary')}>Sellers who apply both discounts see fewer RTOs and returns.</p>
          </div>
        </div>
      </div>
    </>
  );
}

const TABS = [
  { id: 'add-discount', label: 'Add Discount', count: CAPTURED.addDiscount, to: paths.reduceRtoAdd },
  { id: 'discounts-applied', label: 'Discounts Applied', count: CAPTURED.applied, to: paths.reduceRto },
];

function DiscountTabs({ active }: { active: string }) {
  const navigate = useNavigate();
  return (
    <div className="sticky z-5 bg-neutral-base border-0 border-t border-solid border-neutral-light pb-3 mt-3 top-[calc(var(--concept-strip-h)+5.625rem)] px-0 pt-0">
      <div
        role="tablist"
        className="flex max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-body-medium leading-5 gap-2 border-0 border-b border-solid border-neutral-light px-4 pt-2"
        aria-orientation="horizontal"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            data-active={t.id === active}
            onClick={() => navigate(t.to)}
            className="cursor-pointer transition-all duration-200 ease-in-out bg-transparent border-0 border-solid whitespace-nowrap shrink-0 font-[inherit] text-neutral-primary hover:text-brand-primary hover:bg-brand-light focus-visible:outline-1 focus-visible:outline-brand-base focus-visible:rounded-6 border-b-2 border-b-transparent data-[active=true]:text-brand-primary data-[active=true]:border-b-brand-base data-[active=true]:font-medium text-body-medium leading-5 py-2 border-x border-x-transparent px-3"
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReduceRto() {
  const { tab } = useParams();
  const active = tab === 'add-discount' ? 'add-discount' : 'discounts-applied';
  return (
    <CrystalPage>
      <Header />
      <DiscountCards />
      <DiscountTabs active={active} />
      {/* Only the Discounts Applied tab was captured; Add Discount (0) has nothing to list either. */}
      <UfoEmpty
        heading="h2"
        testId="rrar-empty-state"
        title="No Discounts Created Yet"
        text="Add Prepaid & WDRP discounts to get more prepaid orders and reduce unwanted returns."
      />
    </CrystalPage>
  );
}
