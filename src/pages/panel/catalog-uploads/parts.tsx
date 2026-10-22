// Pieces of the Catalog Uploads page, ported from reference/html/meesho-catalog-uploads.html.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { notInPrototype } from '../../../components/Toast';
import { cx } from '../../../components/ui';
import { tEn } from '../../../i18n';
import { PinkTag } from '../catalog/BulkTemplatePanel';
import { BOT_QUERY } from '../catalog/bot';
import type { QcStatus, UploadRow } from './data';

const BTN =
  'inline-flex items-center justify-center gap-1 rounded-sm font-button cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:touch-none active:scale-90';
export const BTN_PRIMARY = `${BTN} border-none disabled:bg-tertiary-text bg-brand-primary-bg text-brand-foreground-text`;
export const BTN_OUTLINE = `${BTN} bg-transparent text-brand-primary-bg border border-solid border-brand-primary-bg disabled:bg-transparent disabled:text-tertiary-text disabled:border disabled:border-solid disabled:border-tertiary-text`;

// ── Header ──────────────────────────────────────────────────────────────────
export function Header() {
  return (
    <div className="sticky top-0 z-2 flex items-center justify-between bg-white p-3">
      <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7 flex items-center gap-2">Upload Catalog</h1>
      <div className="flex cursor-pointer items-center gap-3.25" data-testid="learnHowToUpload">
        <button type="button" className="flex items-center gap-3.25 bg-transparent border-0 p-0 cursor-pointer" onClick={() => notInPrototype('Learn how to upload catalogs')}>
          <img src="/brand/msa/merlin/filled/training-red.svg" alt="" width="24" height="24" />
          <h6 className="m-0 p-0 text-base font-semibold font-button leading-4 text-secondary-text">Learn how to upload catalogs</h6>
        </button>
        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={() => notInPrototype('Need Help?')}
            className="mr-1.25 flex cursor-pointer items-center gap-2.5 rounded-lg border border-solid border-brand-secondary-bg bg-white p-1"
          >
            <img src="/brand/msa/merlin/filled/support-blue.svg" alt="" width="24" height="24" />
            <p className="m-0 p-0 font-normal font-body text-lg leading-5 mr-2 text-brand-primary-text">Need Help?</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Banner carousel (two slides; the snapshot opens on slide 2, Books) ──────
const SLIDES = [
  {
    img: '/brand/msa/cataloging/product_optimiser_promotion_banner.jpg',
    alt: 'Product Optimiser',
    title: 'Get upto 50% more orders + upto 10% lesser returns',
    body: 'Add/ edit the catalogs and improve the quality. Plus, prevent catalogs from deactivations/ low visibility *T&C',
    cta: 'Improve products here',
  },
  {
    img: '/brand/msa/cataloging/books_category_qc_verification_banner.png',
    alt: 'Books Verification',
    title: 'Books will undergo verification before going live',
    body: 'All Books category catalogs will be verified to ensure quality and trust, with an expected go-live time of approx. 1 week',
  },
];

export function BannerCarousel() {
  const navigate = useNavigate();
  const [active, setActive] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div className="relative w-full overflow-hidden touch-pan-y" data-show-indicators="true">
      <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${active * 100}%)` }}>
        {SLIDES.map((s, i) => (
          <div key={s.alt} className="shrink-0 w-full" data-active={i === active}>
            <div className="relative my-2.5 h-25 flex items-center rounded-lg bg-linear-to-r/srgb from-[#FFF0D1] from-0% via-[#FFE8E1] via-[84.74%] to-[#FFE2EC] to-[122.01%]">
              <img src={s.img} alt={s.alt} className="block rounded-l-sm" />
              <div className="flex w-full items-center justify-between">
                <div className="p-4">
                  <h1 className="m-0 p-0 font-bold font-heading text-4xl leading-7 text-primary-text">{s.title}</h1>
                  <p className="m-0 p-0 font-normal font-body text-xl leading-5 mt-1 text-secondary-text">{s.body}</p>
                </div>
                {s.cta && (
                  <div className="flex items-center p-4">
                    <button type="button" className={`${BTN_PRIMARY} h-9 px-4 text-xl whitespace-nowrap`} onClick={() => navigate(paths.quality)}>
                      {s.cta}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-2 mb-1.25 gap-1 [&>button]:h-1 [&>button]:w-2 [&>button[data-active=true]]:w-3" role="tablist">
        {SLIDES.map((s, i) => (
          <button
            key={s.alt}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Go to slide ${i + 1}`}
            data-active={i === active}
            onClick={() => setActive(i)}
            className="w-6 h-2 rounded-full bg-secondary-bg border-none p-0 cursor-pointer transition-[background-color,width] duration-200 hover:bg-secondary-border data-[active=true]:w-[2.5rem] data-[active=true]:bg-brand-primary-text"
          />
        ))}
      </div>
    </div>
  );
}

// ── "Have unique products to sell?" + Overview ─────────────────────────────
export function AddCatalogActions() {
  const navigate = useNavigate();
  return (
    <div className="flex items-start justify-between bg-white">
      <div className="mt-3 mb-5 flex pl-3">
        <div className="flex flex-col pr-8.25">
          <p className="m-0 p-0 font-normal font-body text-base leading-4 mb-2.25 text-secondary-text">Have unique products to sell? Choose from the options below</p>
          <div className="flex">
            <button type="button" className={`${BTN_PRIMARY} h-9 px-4 text-xl mr-4`} onClick={() => navigate(paths.addBulk)}>
              Add Catalog in Bulk
            </button>
            <button type="button" className={`${BTN_OUTLINE} h-9 px-4 text-xl`} onClick={() => navigate(paths.addSingleCategory)}>
              Add Single Catalog
            </button>
            <button
              type="button"
              data-c2m="LB-3"
              data-c2m-id="LB-3"
              className={`${BTN_OUTLINE} h-9 px-4 text-xl ml-4 gap-2`}
              onClick={() => navigate(`${paths.addSingleCategory}?${BOT_QUERY}`)}
            >
              {tEn('uploads.photos.button')}
              <PinkTag>{tEn('bot.new')}</PinkTag>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, first }: { label: string; value: number; first?: boolean }) {
  return (
    <div className={first ? 'w-44 px-4 py-3' : 'w-44.25 border-0 border-l border-solid border-tertiary-bg px-4 py-3'}>
      <div className="flex flex-col items-start justify-end">
        <p className="m-0 p-0 font-normal font-body text-base leading-4 mb-1 text-tertiary-text">{label}</p>
        <h2 className="m-0 p-0 text-primary-text font-bold font-heading text-3xl leading-6">{value}</h2>
      </div>
    </div>
  );
}

export function Overview({ bulk, single }: { bulk: number; single: number }) {
  return (
    <div className="mb-2.5 bg-white pb-5 pl-3">
      <h5 className="m-0 p-0 text-primary-text text-lg leading-5 font-semibold font-button mb-2">Overview</h5>
      <div className="inline-flex w-fit max-w-[75em] items-center rounded-sm border border-solid border-tertiary-bg text-start">
        <Stat first label="Total Uploads Done" value={bulk + single} />
        <Stat label="Using Bulk Uploads" value={bulk} />
        <Stat label="Using Single Uploads" value={single} />
      </div>
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────
const MAIN_TAB =
  'px-4 cursor-pointer transition-all duration-200 ease-in-out bg-transparent border-0 border-solid whitespace-nowrap [font-family:inherit] hover:text-brand-primary-bg hover:bg-brand-secondary-bg focus-visible:outline-1 focus-visible:outline-brand-primary-bg focus-visible:rounded-md border-b-2 border-b-transparent data-[active=true]:text-brand-primary-bg data-[active=true]:border-b-brand-primary-bg data-[active=true]:font-semibold py-2.5 h-10 text-xl font-body text-secondary-text';
const SUB_TAB =
  'px-4 cursor-pointer duration-200 ease-in-out bg-transparent border-0 border-solid whitespace-nowrap [font-family:inherit] hover:text-brand-primary-bg focus-visible:outline-1 focus-visible:outline-brand-primary-bg focus-visible:rounded-md border-b border-b-transparent data-[active=true]:text-brand-primary-bg data-[active=true]:bg-primary-bg data-[active=true]:border data-[active=false]:border-b rounded-t-lg py-2.5 font-body text-lg leading-5 font-normal text-secondary-text transition-none hover:bg-secondary-bg focus-visible:rounded-t-lg focus-visible:rounded-b-none data-[active=false]:border-b-tertiary-bg data-[active=false]:hover:text-secondary-text data-[active=true]:rounded-t-lg data-[active=true]:border-tertiary-bg data-[active=true]:border-b-primary-bg data-[active=true]:font-normal data-[active=true]:hover:bg-tertiary-bg data-[active=true]:hover:border-b-tertiary-bg';

export function MainTabs({ tabs, active, onSelect }: { tabs: Array<{ id: string; label: string }>; active: string; onSelect: (id: string) => void }) {
  return (
    <div role="tablist" className="flex overflow-scroll max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-0 border-b border-solid border-b-tertiary-border" aria-orientation="horizontal">
      {tabs.map((t) => (
        <button key={t.id} id={`tab-${t.id}`} type="button" role="tab" aria-selected={t.id === active} data-active={t.id === active} className={MAIN_TAB} onClick={() => onSelect(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function SubTabs({ tabs, active, onSelect }: { tabs: Array<{ id: string; label: string }>; active: string; onSelect: (id: string) => void }) {
  return (
    <div className="border-0 border-b border-solid border-tertiary-bg">
      <div className="bg-white pt-3 pl-4">
        <div role="tablist" className="flex overflow-scroll max-w-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b-0" aria-orientation="horizontal">
          {tabs.map((t) => (
            <button key={t.id} id={`tab-${t.id}`} type="button" role="tab" aria-selected={t.id === active} data-active={t.id === active} className={SUB_TAB} onClick={() => onSelect(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Filter by category + search ────────────────────────────────────────────
export function FilterBar({
  categories,
  category,
  onCategory,
  query,
  onQuery,
  placeholder,
}: {
  categories: string[];
  category: string | null;
  onCategory: (c: string | null) => void;
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="flex justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-primary-text">Filter by:</p>
        <div className="z-3 w-37.5" data-testid="bulkUploadFilter" ref={ref}>
          <div className="cursor-pointer relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center rounded-sm cursor-pointer duration-200 ease-in-out disabled:pointer-events-none disabled:touch-none bg-transparent border border-solid disabled:border disabled:border-solid h-8 px-3 text-lg w-full justify-between gap-2 pr-1.75 pl-2.75 border-secondary-border font-body leading-5 font-normal text-secondary-text transition-none disabled:cursor-default disabled:border-tertiary-bg disabled:bg-secondary-bg disabled:text-secondary-border disabled:opacity-100"
            >
              <div className="min-w-0 truncate">{category ?? 'Select Category'}</div>
              <img src="/brand/msa/merlin/lined/chevron-down-grey.svg" alt="" width="20" height="20" className={cx('shrink-0', open && 'rotate-180')} />
            </button>
            {open && (
              <div className="absolute left-0 top-full mt-1 w-max min-w-full rounded-sm bg-white py-1 shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] z-10">
                {[null, ...categories].map((c) => (
                  <button
                    key={c ?? 'all'}
                    type="button"
                    onClick={() => {
                      onCategory(c);
                      setOpen(false);
                    }}
                    className={cx(
                      'block w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left font-body text-lg leading-5 hover:bg-secondary-bg',
                      c === category ? 'text-brand-primary-text' : 'text-primary-text',
                    )}
                  >
                    {c ?? 'All Categories'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-8 w-64">
        <div className="flex flex-col h-8 min-h-8 gap-0">
          <div className="group text-sm flex relative font-normal leading-5 items-center box-border w-full p-0 m-0 text-primary-text border border-solid border-secondary-border rounded-sm transition-[border-color] duration-200 ease-in-out focus-within:border-brand-primary-border hover:border-brand-primary-border h-8 min-h-8 gap-0">
            <input
              className="peer flex-1 min-w-0 bg-transparent border-none [font-family:inherit] transition-all duration-200 ease-in-out rounded-sm outline-none z-1 placeholder:text-secondary-border focus:z-1 h-full min-h-0 py-0 pr-0 pl-4 text-lg leading-5 text-primary-text"
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => onQuery(e.target.value)}
            />
            <button type="button" aria-label={placeholder} className="inline-flex items-center justify-center rounded-sm border-none cursor-pointer mr-3 size-5 bg-transparent p-0">
              <img src="/brand/msa/merlin/lined/search-grey.svg" alt="" width="20" height="20" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QcTip() {
  return (
    <div className="bg-secondary-bg py-2">
      <div className="flex items-center p-2 justify-between bg-info-bg border-info-border border border-solid rounded-lg">
        <div className="flex items-start gap-2.5">
          <img src="/brand/msa/merlin/filled/bulb-yellow.svg" alt="" width="24" height="24" />
          <p className="m-0 p-0 text-primary-text font-normal font-body text-base leading-4 mt-1">
            QC (Quality-Check) error products can now be fixed as they appear. Try to fix QC errors faster to speed up your catalog creation process.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Table ───────────────────────────────────────────────────────────────────
const TH =
  'text-start border-[0.03125rem] border-t-0 border-tertiary-bg border-solid text-sm leading-4 font-semibold font-button py-3 px-3';
const TD = 'border-[0.03125rem] border-tertiary-border border-solid py-3 px-3 border-l-[0.0313rem] border-l-tertiary-border';
const CELL_TEXT = 'm-0 p-0 text-primary-text font-normal font-body text-lg leading-5';

const STATUS_PILL: Record<QcStatus, { cls: string; icon: string }> = {
  'QC Error': { cls: 'bg-error-bg text-error-text border-error-border', icon: '/brand/msa/merlin/filled/alert-red.svg' },
  'QC in Progress': { cls: 'bg-warning-bg text-warning-text border-warning-border', icon: '/brand/msa/merlin/filled/time-yellow.svg' },
  'QC Pass': { cls: 'bg-success-bg text-success-text border-success-border', icon: '/brand/msa/merlin/filled/success-green.svg' },
};

function StatusPill({ status }: { status: QcStatus }) {
  const p = STATUS_PILL[status];
  return (
    <div className={`inline-flex items-center justify-center rounded-full gap-1 border py-0.5 px-2 border-none w-max text-base ${p.cls}`}>
      <img src={p.icon} alt="" width="15" height="15" />
      {status}
    </div>
  );
}

function Actions({ row }: { row: UploadRow }) {
  if (row.status !== 'QC Error') return <p className={CELL_TEXT}>--</p>;
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="flex flex-col gap-2">
        <div className="w-36 cursor-pointer">
          <button type="button" className={`${BTN_PRIMARY} h-8 px-3 w-full min-w-max text-lg`} onClick={() => notInPrototype('Download Error File')}>
            Download Error File
          </button>
        </div>
        <div className="w-36 cursor-pointer">
          <button type="button" className={`${BTN_OUTLINE} h-8 px-3 w-full min-w-max text-lg`} onClick={() => notInPrototype('Upload New File')}>
            Upload New File
          </button>
        </div>
      </div>
    </div>
  );
}

export function UploadsTable({ rows, kind }: { rows: UploadRow[]; kind: 'bulk' | 'single' }) {
  type Col = [string, (r: UploadRow, i: number) => ReactNode];
  const rowsCol: Col = ['Rows', (r) => <p className={CELL_TEXT}>{r.rows ?? '--'}</p>];
  const cols: Col[] = [
    [
      'S.no',
      (_r, i) => (
        <div className="flex items-center justify-start pl-1">
          <p className="m-0 p-0 text-primary-text font-normal font-body text-xl leading-5">{i + 1}</p>
        </div>
      ),
    ],
    [
      'Category',
      (r) => (
        <div className="w-fit">
          <p className={CELL_TEXT}>{r.category}</p>
        </div>
      ),
    ],
    [kind === 'bulk' ? 'File Id' : 'Catalog Id', (r) => <p className={CELL_TEXT}>{r.id}</p>],
    [
      'Created Date',
      (r) => (
        <>
          <p className={CELL_TEXT}>{r.created}</p>
          {r.confirmed && (
            <p className="m-0 mt-1 p-0 font-body text-base leading-4 text-secondary-text" data-c2m="LB-4" data-c2m-id="LB-4" data-testid="reviewedAt">
              {r.confirmed}
            </p>
          )}
        </>
      ),
    ],
    ...(kind === 'bulk' ? [rowsCol] : []),
    [
      'QC Status',
      (r) => (
        <div className="flex flex-col items-start justify-center">
          <StatusPill status={r.status} />
        </div>
      ),
    ],
    ['Actions', (r) => <Actions row={r} />],
  ];
  return (
    <div className="z-1 h-142.5">
      <section className="h-full overflow-auto" aria-label="catalog uploads table">
        <table className="border-collapse w-full border-spacing-0 table-auto">
          <thead>
            <tr className="bg-tertiary-bg sticky top-0 z-3 [&>th]:px-3! [&>th]:text-base!">
              {cols.map(([h], i) => (
                <th key={h} className={cx(TH, i === 0 && 'border-l-0', i === cols.length - 1 && 'border-r-0')} style={i === 0 ? { minWidth: 50 } : undefined}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r.id} className="align-top">
                {cols.map(([h, cell], i) => (
                  <td key={h} className={TD} style={i === 0 ? { minWidth: 50 } : undefined}>
                    {cell(r, ri)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// Not in the HTML snapshot; measured from reference/screens/catalog-uploads.png.
export function NoResults({ kind }: { kind: 'bulk' | 'single' }) {
  const word = kind === 'bulk' ? 'Bulk' : 'Single';
  return (
    <div className="border-0 border-t border-solid border-tertiary-bg flex flex-col items-center pt-10 pb-10 text-center">
      <img src="/brand/msa/merlin/lined/empty-catalog.svg" alt="" width="80" height="80" />
      <p className="m-0 mt-6 p-0 font-button text-xl leading-5 text-primary-text">No Results</p>
      <p className="m-0 mt-1 p-0 w-64 font-body text-sm leading-4 text-secondary-text">
        No {word} catalogs exist. Upload a new catalog using {word} upload button on the top
      </p>
    </div>
  );
}
