// Right-hand panel of Add Single Catalog once a leaf is picked (catalog-select-category-water-bottles.png).
import { Banner } from '../../../components/ui';
import { nodeAt } from './categories';

export function Breadcrumb({ path }: { path: string[] }) {
  return <p className="m-0 font-body text-lg leading-5 text-secondary-text">{path.join(' / ')}</p>;
}

export function SampleImage({ path, className = '' }: { path: string[]; className?: string }) {
  const sample = nodeAt(path)?.sample;
  // No sample photo was captured for most leaves; the panel then simply shows none.
  if (!sample) return null;
  return <img src={sample.src} alt="" width={sample.w} height={sample.h} className={`mx-auto block ${className}`} style={{ width: sample.w, height: sample.h }} />;
}

export function CategoryPreview({ path, onAddImages }: { path: string[]; onAddImages: () => void }) {
  return (
    <div className="ml-6.5 bg-primary-bg" data-testid="categoryPreview">
      <div className="bg-tertiary-bg px-10 py-3 text-center">
        <Breadcrumb path={path} />
      </div>
      <div className="flex flex-col items-center border-0 border-b border-solid border-tertiary-border pt-7 pb-6">
        <SampleImage path={path} />
        <p className="m-0 font-button text-xl leading-5 text-secondary-text">Please provide only front image for each product</p>
        <button
          type="button"
          onClick={onAddImages}
          className="mt-5.5 inline-flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-sm border-none bg-brand-primary-bg px-5 font-button text-xl text-brand-foreground-text transition-all active:scale-90"
        >
          <img src="/brand/msa/merlin/filled/upload-white.svg" alt="" width="12" height="15" className="block" />
          Add Product Images
        </button>
      </div>
      <div className="px-3 py-3.5">
        <Banner tone="info">Follow guidelines to reduce quality check failure</Banner>
      </div>
    </div>
  );
}
