// Home: the 3-step strip and the content under it.
// Step tabs + QC content are ported from reference/html/meesho-home.html; the step-1
// "Choose how you would like to upload your catalog" panel isn't in any snapshot and is
// measured from reference/screens/home.png (÷ 1.25).
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { notInPrototype } from '../../../components/Toast';
import { Button, Pill } from '../../../components/ui';
import { tEn } from '../../../i18n';
import { useListingsForPersona } from '../../../store/catalog';
import { useDemo } from '../../../store/demo';
import { PinkTag } from '../catalog/BulkTemplatePanel';
import { BOT_QUERY } from '../catalog/bot';
import { DEMO_IMAGE } from '../catalog/draftStore';

/** start / qc = the two captured states; live = a catalog created from photos is live (LB-8). */
export type HomeState = 'start' | 'qc' | 'live';
type StepStatus = 'done' | 'current' | 'todo';

const STEPS = ['Upload catalogs to get started', 'Catalogs go live on Meesho', 'Get your first order'] as const;

/** Where the seller is in onboarding for each page state (1-based step). */
const STATUS: Record<HomeState, StepStatus[]> = {
  start: ['current', 'todo', 'todo'],
  qc: ['done', 'current', 'todo'],
  live: ['done', 'done', 'current'],
};

function StepTab({ n, label, status, active, onClick }: { n: number; label: string; status: StepStatus; active: boolean; onClick: () => void }) {
  const circleBg = status === 'done' ? 'bg-success-bg' : active ? 'bg-brand-secondary-bg' : 'bg-secondary-bg';
  return (
    <div className="relative flex items-center py-3 px-4 cursor-pointer" role="tab" aria-selected={active} onClick={onClick}>
      <div className={`flex items-center justify-center rounded-full mt-0 mx-auto mb-1 w-7 h-7 ${circleBg}`}>
        {status === 'done' ? (
          <img src="/brand/msa/merlin/filled/tick-green.svg" alt="" width="24" height="24" />
        ) : (
          <span className={`m-0 p-0 font-semibold font-button text-lg leading-5 ${active ? 'text-brand-primary-text' : 'text-secondary-text'}`}>{n}</span>
        )}
      </div>
      <span className={`m-0 p-0 font-semibold font-button text-lg leading-5 ml-2 ${active ? 'text-brand-primary-text' : 'text-primary-border'}`}>{label}</span>
      {active && <div className="absolute w-full h-0.5 bottom-0 left-0 rounded-tl-lg rounded-tr-lg bg-brand-primary-text" />}
    </div>
  );
}

// ── Step 1: choose single vs bulk upload (home.png) ─────────────────────────
function TickRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="8" cy="8" r="5.6" stroke="var(--secondary-text)" strokeWidth="1.1" />
        <path d="M5.9 8.1l1.5 1.5 2.8-2.9" stroke="var(--secondary-text)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">{children}</p>
    </div>
  );
}

function UploadOption({
  title,
  video,
  points,
  button,
  tag,
  thumb,
  c2m,
}: {
  title: string;
  video?: string;
  points: [string, string];
  button: ReactNode;
  tag?: ReactNode;
  /** C2M option: its own thumbnail instead of a video still. */
  thumb?: ReactNode;
  c2m?: string;
}) {
  return (
    <div className="w-60 min-w-0 shrink" data-c2m={c2m} data-c2m-id={c2m}>
      <div className="flex items-center gap-2 border-0 border-l-2 border-solid border-brand-primary-text pl-2.5">
        <span className="m-0 p-0 font-semibold font-button text-xl leading-6 text-black">{title}</span>
        {tag}
      </div>
      {thumb ?? (
        <div className="relative mt-3 cursor-pointer" role="button" aria-label={`Play video: ${title}`} onClick={() => notInPrototype('Video tutorial')}>
          <img src={video} alt="" width="240" height="126" className="block w-60 max-w-full h-auto" />
        </div>
      )}
      <div className="flex flex-col gap-1 mt-3.5">
        {points.map((p) => (
          <TickRow key={p}>{p}</TickRow>
        ))}
      </div>
      <div className="mt-2.5">{button}</div>
    </div>
  );
}

/** Thumbnail of the "Create from photos" option: a phone photo becoming a clean QC cover. */
function PhotosThumb() {
  return (
    <div className="mt-3 flex aspect-[240/126] w-60 max-w-full items-center justify-center gap-3 rounded-sm bg-brand-secondary-bg" aria-hidden="true">
      <img src={DEMO_IMAGE.url} alt="" className="block size-16 rounded-sm object-cover" />
      <img src="/brand/msa/merlin/lined/chevron-right-grey.svg" alt="" width="20" height="20" className="size-5" />
      <img src="/brand/local/catalog/demo-product-bottle-cleaned.png" alt="" className="box-border block size-16 rounded-sm border border-solid border-brand-secondary-border bg-white object-contain" />
    </div>
  );
}

function UploadChoice() {
  const navigate = useNavigate();
  // Plain mode: the third option is hidden (data-c2m-id), so the two captured options keep their captured gap.
  const c2m = useDemo((s) => s.c2m);
  return (
    <div className="mt-0.5 p-6 bg-white">
      <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">Choose how you would like to upload your catalog</h3>
      <div className={`flex items-start mt-5.5 ${c2m ? 'justify-between gap-3' : 'gap-20'}`}>
        <UploadOption
          title="Upload Single Catalog"
          video="/brand/local/home/upload-single-video.png"
          points={['Add one catalog at a time', 'Excel sheet not required']}
          button={<Button onClick={() => navigate(paths.addSingleCategory)}>Add Single Catalog</Button>}
        />
        <UploadOption
          title="Upload Bulk Catalog"
          video="/brand/local/home/upload-bulk-video.png"
          points={['Add multiple catalog at a time', 'Requires excel sheet']}
          button={
            <Button variant="outline" onClick={() => navigate(paths.addBulk)}>
              Add Catalogs in Bulk
            </Button>
          }
        />
        <UploadOption
          c2m="LB-3"
          title={tEn('home.photos.title')}
          tag={<PinkTag>{tEn('bot.new')}</PinkTag>}
          thumb={<PhotosThumb />}
          points={[tEn('home.photos.point1'), tEn('home.photos.point2')]}
          button={
            <Button variant="outline" onClick={() => navigate(`${paths.addSingleCategory}?${BOT_QUERY}`)}>
              {tEn('home.photos.button')}
            </Button>
          }
        />
      </div>
    </div>
  );
}

// ── Step 2 after go-live from photos (LB-8): same box as the QC status, one live row ──
function LiveStatus() {
  const navigate = useNavigate();
  // Real go-live listings of this persona; the scripted listing (presenter jumped ahead) counts as one.
  const n = Math.max(useListingsForPersona().length, 1);
  return (
    <div className="mt-0.5 p-6 bg-white" data-c2m="LB-8" data-c2m-id="LB-8">
      <div className="flex items-start gap-7.5">
        <div className="flex-1 min-w-0 min-h-32.75 rounded bg-secondary-bg px-2 pbs-2.5 pbe-1.25">
          <div className="px-2 mb-1.75 flex items-center">
            <div className="flex-1 min-w-0">
              <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">{tEn('home.live.header')}</p>
            </div>
            <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">{tEn('home.live.status')}</p>
          </div>
          <div className="w-full h-[0.0625rem] border-b border-solid border-b-secondary-border border-l-0" role="separator" aria-orientation="horizontal" />
          <div className="px-0.75">
            <QcRow className="mt-2" label={tEn('home.live.count', { n })} pill={<Pill tone="success">{tEn('home.live.pill')}</Pill>} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2.5">
            <img src="/brand/msa/merlin/filled/success-green.svg" alt="" width="24" height="24" />
            <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6 ml-3">{tEn('home.live.title')}</h3>
          </div>
          <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text mb-3">{tEn('home.live.body')}</p>
          <Button onClick={() => navigate(paths.catalogUploadsSingle)}>{tEn('home.live.button')}</Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: QC status (meesho-home.html) ────────────────────────────────────
function QcRow({ label, pill, className }: { label: string; pill: ReactNode; className: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex-1 min-w-0">
        <span className="m-0 p-0 font-semibold text-tertiary-text font-button text-lg leading-5">{label}</span>
      </div>
      {pill}
    </div>
  );
}

function QcStatus() {
  const navigate = useNavigate();
  return (
    <div className="mt-0.5 p-6 bg-white">
      <div className="flex items-start gap-7.5">
        <div className="flex-1 min-w-0 min-h-32.75 rounded bg-secondary-bg px-2 pbs-2.5 pbe-1.25">
          <div className="px-2 mb-1.75 flex items-center">
            <div className="flex-1 min-w-0">
              <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">No. of uploaded catalogs testing</p>
            </div>
            <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">Status</p>
          </div>
          <div className="w-full h-[0.0625rem] border-b border-solid border-b-secondary-border border-l-0" role="separator" aria-orientation="horizontal" />
          <div className="px-0.75">
            <QcRow
              className="mt-2"
              label="2 Catalogs"
              pill={
                <div className="inline-flex items-center justify-center rounded-full gap-1 bg-error-bg text-error-text border border-error-border py-0.5 px-2 text-sm leading-[1.5] border-none">
                  QC Error
                </div>
              }
            />
            <QcRow
              className="mt-3"
              label="1 Catalogs"
              pill={
                <div className="inline-flex items-center justify-center rounded-full gap-1 bg-warning-bg text-warning-text border border-warning-border py-0.5 px-2 text-sm leading-[1.5] border-none">
                  QC in progress
                </div>
              }
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-secondary-bg">
              <img src="/brand/msa/merlin/filled/alert-red.svg" alt="" width="14" height="14" />
            </div>
            <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6 ml-3">Quality check errors</h3>
          </div>
          <span className="m-0 p-0 font-semibold font-button text-lg leading-5 text-black">We found some issues in your catalog.</span>
          <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text mb-3">
            Fix quality check (QC) errors now to get your catalog live on meesho.
          </p>
          <Button onClick={() => navigate(paths.catalogUploadsBulk)}>Fix QC Error</Button>
        </div>
      </div>
    </div>
  );
}

/** Content captured per step; steps without captured content keep what's showing. */
const CONTENT: Record<HomeState, Partial<Record<number, () => ReactNode>>> = {
  start: { 1: () => <UploadChoice /> },
  qc: { 1: () => <UploadChoice />, 2: () => <QcStatus /> },
  live: { 1: () => <UploadChoice />, 2: () => <LiveStatus /> },
};

export function HomeSteps({ state }: { state: HomeState }) {
  const status = STATUS[state];
  // Step 3 "Get your first order" has no captured content (as on Meesho); the Factory Launch entry
  // (LW-6) is the banner at the top of Home instead.
  const content = CONTENT[state];
  // Open on the current step; when it has no captured content, on the latest step before it that has.
  let initial = status.indexOf('current') + 1;
  while (initial > 1 && !content[initial]) initial--;
  const [active, setActive] = useState(initial);
  const [shown, setShown] = useState(initial);
  const select = (n: number) => {
    setActive(n);
    if (content[n]) setShown(n);
  };
  return (
    <div className="w-2/3 h-full rounded-lg overflow-hidden mr-3 overflow-visible max-[767px]:w-full max-[767px]:mr-0">
      <div className="flex bg-white" role="tablist">
        {STEPS.map((label, i) => (
          <StepTab key={label} n={i + 1} label={label} status={status[i]!} active={active === i + 1} onClick={() => select(i + 1)} />
        ))}
      </div>
      {content[shown]?.()}
    </div>
  );
}
