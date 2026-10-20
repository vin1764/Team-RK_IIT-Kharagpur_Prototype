// Sticky white header of the catalog flows: back chevron, page title, red "how to" video link.
// Classes from reference/html/meesho-catalog-add-single-category.html.
import { notInPrototype } from '../../../components/Toast';
import { Button } from '../../../components/ui';

export function CatalogHeader({ title, helper, onBack }: { title: string; helper: string; onBack: () => void }) {
  return (
    <div className="sticky top-[var(--concept-strip-h)] z-10 flex justify-between bg-primary-bg py-3 pr-3 pl-5">
      <div className="-ml-2 flex items-center gap-2">
        <button
          className="inline-flex items-center justify-center gap-1 font-button border-none cursor-pointer text-brand-primary-bg text-xl mt-1.5 h-auto w-auto shrink-0 rounded-none bg-transparent p-0"
          type="button"
          aria-label="Go back"
          onClick={onBack}
        >
          <img src="/brand/msa/merlin/lined/chevron-left-grey.svg" alt="" width="24" height="24" />
        </button>
        <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">{title}</h1>
      </div>
      <button
        className="justify-center font-button border-none cursor-pointer text-brand-primary-bg text-xl flex h-auto w-auto items-center gap-2 rounded-none bg-transparent p-0"
        type="button"
        onClick={() => notInPrototype(helper.replace(/\?$/, ''))}
      >
        <img src="/brand/msa/merlin/filled/training-red.svg" alt="" width="24" height="24" />
        <span className="m-0 p-0 font-semibold font-button text-base leading-4 text-secondary-text">{helper}</span>
      </button>
    </div>
  );
}

/** "Need Help?" pill (snapshot). */
export function NeedHelp({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => notInPrototype('Need Help')}
      className={`mr-1.25 flex cursor-pointer items-center gap-2.5 rounded-lg border border-solid border-brand-secondary-bg bg-white p-1 ${className}`}
    >
      <img src="/brand/msa/merlin/filled/support-blue.svg" alt="" width="24" height="24" />
      <span className="m-0 p-0 font-normal font-body text-lg leading-5 mr-2 text-brand-primary-text">Need Help?</span>
    </button>
  );
}

/** Two-step stepper of Add Single Catalog. Step 1 snapshot classes (MUI css-1q2nhvo / css-1m6ee3j). */
export function SingleStepper({ step }: { step: 1 | 2 }) {
  const item = (n: 1 | 2, label: string) => {
    const active = n === step;
    const done = n < step;
    return (
      <div className={`flex items-center gap-2 py-3 px-4 ${active ? 'border-0 border-b-2 border-solid border-brand-primary-bg' : ''}`}>
        {done ? (
          <img src="/brand/msa/merlin/filled/success-green.svg" alt="" width="24" height="24" className="size-6" />
        ) : (
          <div className={`rounded-full bg-brand-secondary-bg ${step === 2 ? 'size-7 flex items-center justify-center' : 'py-1.25 px-2.5'}`}>
            <p className={`m-0 font-body text-lg leading-5 ${active ? 'text-brand-primary-text' : 'text-secondary-text'}`}>{n}</p>
          </div>
        )}
        <p className={`m-0 font-body text-lg leading-5 ${active ? 'text-brand-primary-text' : 'text-tertiary-text'}`}>{label}</p>
      </div>
    );
  };
  return (
    <div className="flex">
      {item(1, 'Select Category')}
      {item(2, 'Add Product Details')}
    </div>
  );
}

/** Fixed bottom bar with "Discard Catalog" (both category steps). */
export function DiscardBar({ onDiscard, small = false }: { onDiscard: () => void; small?: boolean }) {
  return (
    <div className="fixed bottom-0 left-0 z-10 w-full bg-primary-bg" data-testid="catalogFooter">
      <div className="h-px w-full bg-tertiary-bg" role="separator" />
      <div className={small ? 'pt-3.25 pr-0 pb-2.5 pl-5.5' : 'pt-[1.18rem] pr-6 pb-[0.846rem] pl-6'}>
        <Button variant="outline" size="md" className={small ? 'text-lg' : ''} onClick={onDiscard}>
          Discard Catalog
        </Button>
      </div>
    </div>
  );
}
