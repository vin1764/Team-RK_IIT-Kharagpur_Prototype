// Instant Cash (reference/html/meesho-instant-cash.html). The snapshot is MUI with hashed
// CSS-in-JS classes, so it is rebuilt here with panel tokens from the computed styles:
// sticky white header (16px 12px), then a white card (min-height 85vh, mt 16px) with the
// illustration, title, subtitle and "I am Interested".
import { notInPrototype, toast } from '../../components/Toast';
import { BusinessApplicationArt, PhoneIcon } from './instant-cash/art';

export default function InstantCash() {
  return (
    <div className="text-black tracking-[-0.1px]">
      <div className="sticky top-(--concept-strip-h) z-30 flex-1 bg-white px-3 py-4">
        <div className="flex flex-row items-center justify-between gap-6">
          <div className="flex flex-1 flex-row items-baseline gap-1">
            <h1 className="m-0 text-4xl leading-7 font-heading text-primary-text">Instant Cash</h1>
            <h6 className="m-0 text-base leading-4 font-button text-primary-text">by Meesho Payments Pvt. Ltd. (MPPL)</h6>
          </div>
          <div className="flex flex-col">
            <button
              type="button"
              className="inline-flex w-full min-w-max h-8 items-center justify-center rounded-sm border border-solid border-secondary-text bg-transparent px-3 cursor-pointer text-lg leading-5 font-button text-brand-primary-text transition-colors hover:bg-brand-secondary-bg"
              onClick={() => notInPrototype('Talk to us')}
            >
              <span className="flex flex-row items-center justify-center gap-2 text-primary-text tracking-normal">
                <PhoneIcon />
                <span className="tracking-[-0.1px]">Talk to us</span>
              </span>
            </button>
          </div>
          <button
            type="button"
            className="inline-flex min-w-max h-6 items-center justify-center rounded-sm border-0 bg-transparent p-0 cursor-pointer text-lg leading-5 font-button text-brand-primary-text tracking-normal"
            onClick={() => notInPrototype('T&C and Privacy Policy')}
          >
            T&amp;C and Privacy Policy
          </button>
        </div>
      </div>
      <div className="mt-4 flex min-h-[85vh] grow flex-col items-center justify-center rounded-sm bg-white">
        <div className="flex w-120 flex-col items-center justify-center text-center">
          <BusinessApplicationArt />
          <h1 className="m-0 mt-5 text-4xl leading-7 font-heading text-primary-text">Looking for a loan to grow your business?</h1>
          <p className="m-0 mt-2 max-w-full text-xl leading-5 font-body text-secondary-text">Let us know, and we will add you in our waiting list</p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex min-w-max h-9 items-center justify-center rounded-sm border-0 bg-brand-primary-bg px-4 cursor-pointer text-xl leading-5 font-button text-white tracking-normal"
              onClick={() => toast("You're on the waiting list")}
            >
              I am Interested
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
