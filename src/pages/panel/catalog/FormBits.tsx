// Small form pieces of the details step: checkbox, (i) tooltip, inputs with the panel's look.
import { useState, type ReactNode } from 'react';

/** Indigo square checkbox (Copy input details / Copy price details / Same as Manufacturer). */
export function Checkbox({ checked, onChange, label, className = '' }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; className?: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)} className={`flex cursor-pointer items-start border-0 bg-transparent p-0 text-left ${className}`}>
      <span
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-xs border border-solid ${checked ? 'border-brand-primary-bg bg-brand-primary-bg' : 'border-secondary-text bg-white'}`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6.2l2.3 2.3 4.7-4.9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

/** (i) icon; with text it shows the panel's dark tooltip below, left-anchored (catalog-price-table.png). */
export function Info({ text }: { text: string | true }) {
  const [open, setOpen] = useState(false);
  const icon = <img src="/brand/msa/merlin/lined/info-grey.svg" alt="info" width="16" height="16" className="block size-4 shrink-0" />;
  if (text === true) return icon;
  return (
    <span className="relative inline-flex shrink-0" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className="cursor-pointer">{icon}</span>
      {open && (
        <span className="absolute top-full -left-3 z-tooltip mt-2 w-50 rounded-sm bg-tooltip-bg px-2.5 py-2 text-left font-body text-base leading-[17px] text-brand-foreground-text shadow-[0_4px_20px_0_rgba(0,0,0,0.2)] animate-fade-in">
          <span className="absolute -top-1.5 left-3.5 size-0 border-x-[6px] border-b-[6px] border-t-0 border-solid border-x-transparent border-b-tooltip-bg" />
          {text}
        </span>
      )}
    </span>
  );
}

export const INPUT_BOX =
  'box-border w-full rounded-sm border border-solid bg-white font-body text-xl text-primary-text outline-none placeholder:text-secondary-border focus:border-brand-primary-border';
export const borderFor = (error: boolean) => (error ? 'border-error-text' : 'border-[rgb(196,196,196)]');

export function TextInput({ value, onChange, placeholder, error, className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean; className?: string }) {
  return <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${INPUT_BOX} ${borderFor(!!error)} h-10 px-4 ${className}`} />;
}

export function SelectInput({ value, onChange, options, placeholder = 'Select', error }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; error?: boolean }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_BOX} ${borderFor(!!error)} h-10 cursor-pointer appearance-none pr-12 pl-4 ${value ? '' : 'text-secondary-border'}`}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="text-primary-text">
            {o}
          </option>
        ))}
      </select>
      <img src="/brand/msa/merlin/lined/chevron-down-grey.svg" alt="" width="24" height="24" className="pointer-events-none absolute top-1/2 right-4 size-6 -translate-y-1/2" />
    </div>
  );
}

export function TextArea({ value, onChange, placeholder, maxLength = 1400, error }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; error?: boolean }) {
  return (
    <div className="relative">
      <textarea
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_BOX} ${borderFor(!!error)} block h-27.5 resize-none px-4 pt-2.5 pb-6 leading-5`}
      />
      <span className="pointer-events-none absolute right-2 bottom-1.5 font-body text-xs leading-3 text-tertiary-text">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="m-0 mt-2 font-body text-base leading-4 text-error-text">{children}</p>;
}
