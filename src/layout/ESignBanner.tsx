import { notInPrototype } from '../components/Toast';

// Not in any HTML snapshot; measured from reference/screens/home.png (÷ 1.25):
// 12px side inset, 6px above, 54px tall, 32px outlined button 24px from the right.
export function ESignBanner() {
  return (
    <div className="px-3 pt-1.5" data-esign-banner>
      <div className="flex items-center justify-between rounded-md border border-solid border-error-border bg-error-bg py-2 pl-3 pr-6">
        <div className="flex items-start gap-2">
          <img src="/brand/msa/merlin/filled/alert-red.svg" alt="" width="20" height="20" className="size-5 mt-0.5" />
          <div>
            <p className="m-0 p-0 font-body text-lg leading-5 text-primary-text">Your E-Signature is missing!</p>
            <p className="m-0 p-0 font-body text-sm leading-4 text-primary-text">
              E-signature is required for raising invoices / credit notes on your behalf to customers
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => notInPrototype('Add Signature')}
          className="inline-flex items-center justify-center rounded-sm font-button cursor-pointer bg-white text-brand-primary-bg border border-solid border-brand-primary-bg h-8 px-7 text-lg"
        >
          Add Signature
        </button>
      </div>
    </div>
  );
}
