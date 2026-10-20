// Right-hand panel of Bulk Catalog Upload once a leaf is picked (bulk-upload-category*.png):
// upload a filled template, or generate a prefilled one from front images, or download an empty one.
import { useState, type ReactNode } from 'react';
import { notInPrototype, toast } from '../../../components/Toast';
import { Breadcrumb, SampleImage } from './CategoryPreview';
import { useFilePicker } from './ImageTiles';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function PinkTag({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-xs bg-dark-pink px-1.5 font-body text-sm leading-4 text-white">{children}</span>;
}

/** "Introducing Prefilled Templates" coach-mark, shown on load and dismissed with "Got it". */
function PrefilledPopover({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute top-1/2 right-[calc(100%+1.125rem)] z-20 w-106.5 -translate-y-1/2 rounded-lg bg-white p-6 shadow-[0_4px_24px_0_rgba(0,0,0,0.22)]"
      role="dialog"
      aria-label="Introducing Prefilled Templates"
    >
      {/* arrow pointing at the "Generate Prefilled Template" card */}
      <span className="absolute top-1/2 -right-4 size-0 -translate-y-1/2 border-y-[12px] border-l-[16px] border-solid border-y-transparent border-l-white" />
      <PinkTag>NEW</PinkTag>
      <p className="m-0 mt-2 font-heading text-2xl leading-6 text-primary-text">Introducing Prefilled Templates</p>
      <img src="/brand/local/catalog/prefilled-templates.png" alt="" width="380" height="160" className="mt-3.5 block h-40 w-full object-cover" />
      <ol className="m-0 mt-3 list-none p-0 font-body text-lg leading-5 text-primary-text">
        <li className="flex gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary-bg text-sm">1</span>
          <span>
            Add <b className="font-button">Front images</b> of your product
          </span>
        </li>
        <li className="mt-2 flex gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary-bg text-sm">2</span>
          <span>Get a pre-filled template, quickly add variants, review and enjoy faster catalog bulk uploads</span>
        </li>
      </ol>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-sm border border-solid border-brand-primary-bg bg-white px-4 font-button text-xl text-brand-primary-bg active:scale-90 transition-all"
      >
        Got it
      </button>
    </div>
  );
}

export function BulkTemplatePanel({ path, onGenerate }: { path: string[]; onGenerate: () => void }) {
  const leaf = path[path.length - 1]!;
  const [coach, setCoach] = useState(true);
  const upload = useFilePicker((files) => files?.[0] && toast(`${files[0].name} selected · template upload isn't part of this prototype`), XLSX, false);
  return (
    <div className="relative ml-6.5 bg-primary-bg pb-12" data-testid="bulkTemplatePanel">
      <div className="relative bg-tertiary-bg py-3.5 pr-10 pl-12.5">
        <span className="absolute top-3.5 -left-2 size-0 border-y-8 border-r-8 border-solid border-y-transparent border-r-tertiary-bg" />
        <Breadcrumb path={path} />
      </div>
      <div className="flex flex-col items-center px-9">
        <SampleImage path={path} className="mt-9" />
        <p className="m-0 mt-8 font-body text-lg leading-5 text-primary-text">Already have your {leaf} template filled ?</p>
        <button
          type="button"
          onClick={upload.open}
          className="mt-2.5 flex h-20.5 w-48.5 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-brand-secondary-border bg-secondary-bg font-button text-lg leading-5 text-brand-primary-text"
        >
          <img src="/brand/msa/merlin/filled/add-blue.svg" alt="" width="20" height="20" className="block size-5" />
          Upload Template File
        </button>
        {upload.input}
        <div className="mt-8 h-px w-full bg-tertiary-bg" />
        <p className="m-0 mt-6 font-body text-lg leading-5 text-primary-text">Don't have {leaf} template?</p>
        <div className="relative mt-3 w-[calc(100%+0.5rem)]">
          {coach && <PrefilledPopover onClose={() => setCoach(false)} />}
          <button
            type="button"
            onClick={onGenerate}
            className="block w-full cursor-pointer rounded-lg border border-solid border-tertiary-border bg-white px-3.5 py-3 text-left"
          >
            <span className="flex items-center gap-2">
              <span className="font-heading text-xl leading-5 text-primary-text">Generate Prefilled Template</span>
              <PinkTag>RECOMMENDED</PinkTag>
            </span>
            <span className="mt-1 block font-body text-base leading-4 text-secondary-text">Upload product front images and generate your prefilled template</span>
          </button>
        </div>
        <p className="m-0 mt-8 font-body text-lg leading-5 text-tertiary-text">Or</p>
        <button
          type="button"
          onClick={() => notInPrototype('Download Empty Template')}
          className="mt-6 inline-flex h-9 cursor-pointer items-center justify-center rounded-sm border border-solid border-tertiary-border bg-white px-4 font-button text-xl text-primary-text active:scale-90 transition-all"
        >
          Download Empty Template
        </button>
      </div>
    </div>
  );
}
