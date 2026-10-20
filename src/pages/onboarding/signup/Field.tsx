// Outlined text field with a notched floating label, as on the sign-up page
// (44px tall, 4px radius, secondary-border when filled/floated, #DBDFE7 when idle).
import { useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cx } from '../../../components/ui';

export function Field({
  label,
  prefix,
  alwaysFloat = false,
  labelBg = 'bg-secondary-bg',
  className,
  inputRef,
  value,
  onFocus,
  onBlur,
  placeholder,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  label: string;
  prefix?: ReactNode;
  alwaysFloat?: boolean;
  /** must match the surface the field sits on (the label notches the border) */
  labelBg?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const [focused, setFocused] = useState(false);
  const floated = alwaysFloat || focused || String(value ?? '') !== '';
  return (
    <label
      className={cx(
        'relative flex h-11 items-center rounded-sm border border-solid bg-transparent px-4 cursor-text',
        focused ? 'border-brand-primary-border' : floated ? 'border-secondary-border' : 'border-[#DBDFE7]',
        className,
      )}
    >
      <span
        className={cx(
          'pointer-events-none absolute left-3 px-1 font-body text-tertiary-text transition-all duration-150',
          floated ? cx('-top-[4.6px] text-base leading-3', labelBg) : 'top-1/2 -translate-y-1/2 text-xl leading-5',
          focused && 'text-brand-primary-text',
        )}
      >
        {label}
      </span>
      {prefix && floated && <span className="mr-1 shrink-0 text-xl font-body text-primary-text">{prefix}</span>}
      <input
        ref={inputRef}
        value={value}
        placeholder={floated ? placeholder : undefined}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className="w-full min-w-0 border-none bg-transparent p-0 text-xl font-body text-primary-text outline-none placeholder:text-tertiary-text"
        {...rest}
      />
    </label>
  );
}
