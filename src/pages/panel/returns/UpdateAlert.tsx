// "Update Alert" popover that the live panel opens under the Return Tracking tab
// (reference/html/meesho-returns.html: 320px wide, 8px below the tab label, left-aligned).
const POPOVER =
  "absolute box-border z-tooltip w-max text-base rounded-lg text-brand-foreground-text shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] animate-fade-in bg-tooltip-bg after:content-[''] after:absolute after:w-0 after:h-0 after:border-solid after:bottom-full after:left-[0.75rem] after:border-[6px] after:border-t-0 after:border-b-tooltip-bg after:border-x-transparent after:border-t-transparent p-0 max-w-xs whitespace-normal text-left max-md:max-w-64";

export function UpdateAlert({ onClose, onTry }: { onClose: () => void; onTry: () => void }) {
  return (
    <div className={POPOVER} role="tooltip" style={{ top: '2.5rem', left: 0 }}>
      <div style={{ backgroundColor: 'var(--black)', borderRadius: '0.5rem', boxShadow: 'rgba(0, 0, 0, 0.3) 0px 0.625rem 1.75rem' }}>
        <div className="p-4">
          <div className="flex items-center relative mb-2">
            <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6" style={{ color: 'var(--white)' }}>
              Update Alert
            </h3>
            <div role="button" tabIndex={0} aria-label="Close" className="flex cursor-pointer ml-auto" onClick={onClose}>
              <img src="/brand/msa/merlin/lined/cross-white.svg" alt="" width="20" height="20" />
            </div>
          </div>
          <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5 whitespace-pre-line" style={{ color: 'var(--secondary-border)' }}>
            We have now introduced new tab to check disposed products.
          </p>
          <button
            className="inline-flex items-center justify-center gap-1 rounded-sm font-button cursor-pointer transition-all duration-200 ease-in-out active:scale-90 text-brand-primary-bg h-9 px-4 text-xl mt-4 bg-white border-none hover:bg-white"
            type="button"
            onClick={onTry}
          >
            Try Now
          </button>
        </div>
      </div>
    </div>
  );
}
