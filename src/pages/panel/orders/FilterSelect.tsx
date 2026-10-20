// The fulfillment micro-frontend's dropdown trigger (Orders / Returns / Claims), ported
// class-for-class from reference/html. Two looks: "boxed" (grey-bordered filter, e.g.
// "SLA Status") and "link" (borderless blue, e.g. "Last 1 Month").
import { notInPrototype } from '../../../components/Toast';

const BTN =
  'inline-flex items-center justify-center gap-1 rounded-sm font-button cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:touch-none active:scale-90 bg-transparent text-brand-primary-bg border border-solid border-brand-primary-bg disabled:bg-transparent disabled:text-tertiary-text disabled:border disabled:border-solid disabled:border-tertiary-text px-4 text-xl h-auto min-h-9';

const LOOK = {
  boxed: {
    button: { padding: '0px 0.4375rem 0px 0.6875rem', border: '1px solid var(--color-secondary-border)', backgroundColor: 'var(--color-primary-bg)' },
    text: 'var(--color-secondary-text)',
    chevron: '/brand/msa/merlin/lined/chevron-up-grey.svg',
  },
  link: {
    button: { padding: '0px', borderWidth: 'medium', borderStyle: 'none', borderColor: 'currentcolor', borderImage: 'none', backgroundColor: 'transparent' },
    text: 'var(--color-brand-primary-text)',
    chevron: '/brand/msa/merlin/lined/chevron-up-blue.svg',
  },
} as const;

export function FilterSelect({ id, label, width, look = 'boxed' }: { id: string; label: string; width?: number; look?: keyof typeof LOOK }) {
  const l = LOOK[look];
  const w = width ? `${width}px` : 'auto';
  return (
    <div id={id} style={{ width: w }}>
      <div className="relative inline-block" data-with-arrow="false">
        <button className={BTN} type="button" style={{ minWidth: w, ...l.button }} onClick={() => notInPrototype(`The "${label}" menu`)}>
          <div className="flex w-full gap-2 items-center justify-between">
            <p className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5" style={{ color: l.text }}>
              {label}
            </p>
            <img src={l.chevron} alt="" width="20" height="20" className="rotate-180" />
          </div>
        </button>
      </div>
    </div>
  );
}

/** "Filter by :" row label. */
export function FilterLabel() {
  return <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text flex-none">Filter by :</p>;
}

/** The empty state shared by Orders and Returns. */
export function FulfillmentEmpty({ img, title, body }: { img: string; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center box-border">
      <img src={img} alt="" width="140" height="105" />
      <span className="m-0 p-0 font-semibold font-button text-xl leading-5 text-center text-secondary-text mt-5 mb-1">{title}</span>
      <p className="m-0 p-0 font-normal font-body text-sm leading-4 text-center text-primary-text">{body}</p>
    </div>
  );
}
