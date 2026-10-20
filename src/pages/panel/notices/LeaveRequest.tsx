// "Important" leave-request card on the notice board. Markup and classes from
// reference/html/meesho-notices.html. The live date pickers open a calendar dialog we have
// no capture of, so the field opens the browser's own date picker instead; the reason
// options weren't captured either (neutral placeholders below). Submitting goes nowhere.
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from '../../../components/Toast';
import { Button } from '../../../components/ui';

/** Not captured from the live panel: neutral stand-ins. */
const REASONS = ['Personal reasons', 'Festival / holiday', 'Stock unavailable', 'Other'];

const FIELDSET =
  'absolute border border-solid border-secondary-border inset-0 m-0 px-2 rounded-sm overflow-hidden group-focus-within:border-brand-primary-bg group-hover:border-brand-primary-bg group-data-[error=true]:border-error-text group-data-[error=true]:group-focus-within:border-error-text group-data-[error=true]:group-hover:border-error-text';
const LABEL_BASE =
  'text-xl absolute font-medium font-body text-tertiary-text whitespace-nowrap overflow-hidden text-ellipsis h-5 max-w-[80%] items-center transition-all duration-200 ease-out z-1';
const LABEL_FLOAT_FOCUS =
  'group-focus-within:px-1 group-focus-within:bg-transparent group-focus-within:-translate-y-5 group-focus-within:translate-x-2 group-focus-within:text-sm group-focus-within:text-brand-primary-text';

/** yyyy-mm-dd (native date input) → DD/MM/YYYY (panel format). */
const toPanelDate = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '');

function DateField({ label, value, onChange, min }: { label: string; value: string; onChange: (iso: string) => void; min?: string }) {
  const id = useId();
  const native = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = native.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };
  return (
    <div className="mb-7.5 w-full max-w-full">
      <div className="flex flex-col gap-1 relative w-full max-w-full pe-0">
        {/* The real picker: invisible, under the field so the browser anchors its calendar there. */}
        <input
          ref={native}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute left-0 bottom-0 w-full h-px opacity-0 pointer-events-none"
        />
        <div className="flex flex-col gap-1 w-full max-w-full pe-0">
          <div className="group text-sm flex relative font-normal leading-5 items-center rounded-sm box-border gap-2.5 p-0 m-0 text-primary-text w-full max-w-full pe-0" data-error="false">
            <input
              className="peer flex-1 bg-transparent border-none text-lg [font-family:inherit] transition-all duration-200 ease-in-out rounded-sm outline-none min-h-[2.75rem] px-4 z-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-bg focus:z-1 placeholder:text-transparent focus:placeholder:text-secondary-border [&:not(:placeholder-shown)]:placeholder:text-secondary-border cursor-pointer"
              type="text"
              id={id}
              placeholder="DD/MM/YYYY"
              readOnly
              aria-haspopup="dialog"
              title={label}
              value={toPanelDate(value)}
              onClick={open}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
            />
            <img src="/brand/msa/merlin/lined/calendar.svg" alt="" width="24" height="24" className="mr-2.5 cursor-pointer" onClick={open} />
            <fieldset aria-hidden="true" className={FIELDSET}>
              <legend className="w-0 h-0 overflow-hidden text-transparent p-0 m-0 group-has-[input:not(:placeholder-shown)]:w-max group-has-[input:not(:placeholder-shown)]:px-1 group-has-[textarea:not(:placeholder-shown)]:w-max group-has-[textarea:not(:placeholder-shown)]:px-1 group-focus-within:w-max group-focus-within:px-1">
                {label}{' '}
              </legend>
            </fieldset>
            <label
              className={`${LABEL_BASE} cursor-text px-4 peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:bg-transparent peer-[:not(:placeholder-shown)]:-translate-y-5 peer-[:not(:placeholder-shown)]:translate-x-2 peer-[:not(:placeholder-shown)]:text-sm ${LABEL_FLOAT_FOCUS}`}
              htmlFor={id}
            >
              {label}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReasonSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const label = 'Reason for Opting Leave';
  const filled = value !== '';
  return (
    <div className="w-full max-w-full" ref={root}>
      <div className="flex flex-col items-start gap-1 relative w-full max-w-full [&>button]:w-full" data-isfloating="true" data-withlabel="true">
        <input type="hidden" id={id} value={value} readOnly />
        <div className="group text-sm flex relative font-normal leading-5 items-center rounded-sm box-border gap-2.5 p-0 m-0 text-primary-text w-full max-w-full [&>button]:w-full">
          <button
            ref={button}
            type="button"
            className={`peer flex-1 bg-transparent border-none text-lg [font-family:inherit] outline-none min-h-[2.75rem] px-4 z-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-bg placeholder:text-secondary-border focus:z-1 relative font-normal leading-5 flex justify-between items-center rounded-md m-0 cursor-pointer transition-[border-color] duration-200 ease-in-out overflow-hidden text-ellipsis whitespace-nowrap ${filled ? 'text-primary-text' : 'text-transparent group-focus-within:text-secondary-border'}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {filled ? value : label}
            <img
              src="/brand/msa/merlin/chevron.svg"
              alt="chevron-down"
              width="16"
              height="16"
              className={`w-[1rem] h-[1rem] transition-transform duration-200 ease-in-out shrink-0 ${open ? '' : 'rotate-180'}`}
            />
          </button>
          <fieldset aria-hidden="true" className={FIELDSET}>
            <legend className={`w-0 h-0 overflow-hidden text-transparent p-0 m-0 group-focus-within:w-max group-focus-within:px-1 ${filled ? 'w-max px-1' : ''}`}>
              {label}{' '}
            </legend>
          </fieldset>
          <label
            className={`${LABEL_BASE} cursor-pointer ${filled ? 'px-1 bg-transparent -translate-y-5 translate-x-2 text-sm' : 'px-4'} ${LABEL_FLOAT_FOCUS}`}
            htmlFor={id}
            onClick={() => {
              button.current?.focus();
              setOpen((o) => !o);
            }}
          >
            {label}
          </label>
          {open && (
            <ul role="listbox" className="absolute left-0 right-0 top-full z-modal mt-1 rounded-sm bg-white py-1 shadow-[0_4px_20px_0_rgba(0,0,0,0.2)]">
              {REASONS.map((r) => (
                <li
                  key={r}
                  role="option"
                  aria-selected={r === value}
                  className={`px-4 py-2.5 text-lg leading-5 font-body cursor-pointer hover:bg-secondary-bg ${r === value ? 'text-brand-primary-text' : 'text-primary-text'}`}
                  onClick={() => {
                    onChange(r);
                    setOpen(false);
                  }}
                >
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function LeaveRequest() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const ready = start !== '' && end !== '' && reason !== '';
  return (
    <div className="flex flex-col right-0 h-fit bg-white p-4 box-border w-1/3 shrink-0 rounded-lg">
      <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6 mb-2">Important</h3>
      <p className="m-0 p-0 font-normal font-body text-lg leading-5 mb-7.5 text-secondary-text">
        This is to capture your leave request responses. Your response will help us to update our users on delay and subsequently help in managing your
        pick-ups through our logistic partners. If you're not able to operate for certain days due to any reason, we recommend you to opt for a minimum
        number of days leaves; long leaves may/will result in throttle down your daily order inflow.
      </p>
      <DateField
        label="Start Date"
        value={start}
        onChange={(v) => {
          setStart(v);
          if (end && v > end) setEnd('');
        }}
      />
      <DateField label="End Date" value={end} onChange={setEnd} min={start || undefined} />
      <ReasonSelect value={reason} onChange={setReason} />
      <Button
        className="w-fit mt-5"
        disabled={!ready}
        onClick={() => {
          toast('Leave request noted (prototype: nothing was sent)');
          setStart('');
          setEnd('');
          setReason('');
        }}
      >
        Request For Leave
      </Button>
    </div>
  );
}
