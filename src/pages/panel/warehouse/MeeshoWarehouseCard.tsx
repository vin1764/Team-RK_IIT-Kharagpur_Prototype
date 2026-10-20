// "Join Meesho Warehousing in 4 easy steps!" card (reference/html/meesho-warehouse.html).
// Self-contained so a sibling fulfilment-option card can sit next to it later.
import { Button } from '../../../components/ui';
import { notInPrototype, toast } from '../../../components/Toast';

const STEPS = [
  'Click on "Join Us Now" button below',
  "Complete GST and APOB registration (We'll help you)",
  'Dispatch inventory to the warehouse',
  'Watch your business takeoff on Meesho',
];

const STEP =
  'cursor-default text-tertiary-text bg-transparent border-none gap-1.5 flex text-base font-normal relative flex-1 p-0 focus-visible:outline-1 focus-visible:outline-brand-primary-text focus-visible:rounded-md data-[active=true]:text-brand-primary-text flex-row items-stretch justify-start min-h-8 [&>span:last-child]:whitespace-normal';

export function MeeshoWarehouseCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex justify-between gap-4 bg-white py-7 px-8 rounded-lg border-2 border-solid border-secondary-bg my-4 max-[481px]:flex-col max-[481px]:p-0 max-[481px]:m-4 ${className}`}
    >
      <div className="flex flex-col gap-4 max-[481px]:p-4 max-[481px]:pb-0">
        <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Join Meesho Warehousing in 4 easy steps!</h1>
        <div className="flex justify-center flex-col items-start" role="tablist" aria-orientation="vertical">
          {STEPS.map((s, i) => (
            <button key={s} className={STEP} id={`step-step-${i + 1}`} type="button" role="tab" aria-selected={i === 0} aria-label={`Step ${i + 1}: Step ${i + 1}`} data-active={i === 0} data-has-icon="true" tabIndex={-1}>
              <span className="flex items-center justify-center relative flex-col w-8 min-w-8 self-stretch">
                <span className={`w-0.5 flex-1 bg-success-text ${i === 0 ? 'opacity-0' : ''}`} />
                <div className="absolute flex bg-white">
                  <img src="/brand/msa/merlin/filled/success-green.svg" alt="" width="20" height="20" />
                </div>
                <span className={`w-0.5 flex-1 bg-success-text ${i === STEPS.length - 1 ? 'opacity-0' : ''}`} />
              </span>
              <span className="py-2 px-3 whitespace-nowrap text-left flex items-center">
                <p className="m-0 p-0 text-primary-text font-normal font-body text-xl leading-5">{s}</p>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-6">
          {/* Live button opens an external Google Form. */}
          <Button onClick={() => notInPrototype('The Meesho Warehouse sign-up form')}>Join Us Now</Button>
          <Button variant="outline" onClick={() => toast('Callback requested')}>
            Request Callback
          </Button>
        </div>
      </div>
      <div className="rounded-lg border-t-0 border-t-solid border-t-secondary-bg">
        <div role="button" tabIndex={0} onClick={() => notInPrototype('The Meesho Warehouse video')} />
      </div>
    </div>
  );
}
