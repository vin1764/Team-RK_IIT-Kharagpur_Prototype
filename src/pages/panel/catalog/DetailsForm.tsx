// "Add Product Details" card: sections of fields laid out from FIELDS, two per row, label column on the
// left of each input (catalog-product-details-1/2/3.png, catalog-other-attributes.png).
import { Fragment, type ReactNode } from 'react';
import { mandatoryMessage, SECTIONS, FIELDS, type FieldDef, type SectionId } from './fields';
import { Checkbox, ErrorText, Info, SelectInput, TextArea, TextInput } from './FormBits';

/** `align`: centre on the row (default), on a 40px input (rows holding a textarea), or at a textarea's top. */
export function FieldLabel({ f, align = 'row' }: { f: FieldDef; align?: 'row' | 'input' | 'textarea' }) {
  const a = align === 'textarea' ? 'mt-2.5 items-start' : align === 'input' ? 'min-h-10 items-center' : 'items-center';
  return (
    <div className={`flex justify-end pr-3 ${a}`}>
      <span className="min-w-0 flex-1 text-right font-body text-lg leading-5 text-secondary-text">{f.label}</span>
      {f.mandatory && <span className="ml-1 self-start font-body text-lg leading-4 text-error-text">*</span>}
      {f.info && (
        <span className="ml-1 flex">
          <Info text={f.info} />
        </span>
      )}
    </div>
  );
}

export function FieldControl({ f, value, onChange, error }: { f: FieldDef; value: string; onChange: (v: string) => void; error: boolean }) {
  if (f.kind === 'select') return <SelectInput value={value} onChange={onChange} options={f.options ?? []} placeholder={f.placeholder} error={error} />;
  if (f.kind === 'textarea') return <TextArea value={value} onChange={onChange} placeholder={f.placeholder} maxLength={f.maxLength} error={error} />;
  return <TextInput value={value} onChange={onChange} placeholder={f.placeholder} error={error} />;
}

export interface FormState {
  values: Record<string, string>;
  setValue: (id: string, v: string) => void;
  /** Ids that show the red "Mandatory field" error (after Submit). */
  errors: Set<string>;
  sameAsManufacturer: boolean;
  setSameAsManufacturer: (v: boolean) => void;
}

function FieldGrid({ fields, form }: { fields: FieldDef[]; form: FormState }) {
  const rows: FieldDef[][] = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2));
  return (
    <div className="mt-4 grid grid-cols-[8rem_minmax(0,1fr)_1.5rem_8rem_minmax(0,1fr)]">
      {rows.map((pair, r) => {
        const top = pair.some((f) => f.kind === 'textarea');
        return (
          <Fragment key={r}>
            {pair.map((f, c) => {
              const col = c === 0 ? 1 : 4;
              const error = form.errors.has(f.id);
              let extra: ReactNode = null;
              if (f.id === 'packerName')
                extra = (
                  <Checkbox
                    className="mt-3"
                    checked={form.sameAsManufacturer}
                    onChange={form.setSameAsManufacturer}
                    label={<span className="ml-2.5 font-body text-lg leading-5 text-secondary-text">Same as Manufacturer Details</span>}
                  />
                );
              return (
                <Fragment key={f.id}>
                  <div style={{ gridRow: r * 2 + 1, gridColumn: col }} className={top ? 'self-start' : 'self-center'}>
                    <FieldLabel f={f} align={!top ? 'row' : f.kind === 'textarea' ? 'textarea' : 'input'} />
                  </div>
                  <div style={{ gridRow: r * 2 + 1, gridColumn: col + 1 }} className={top ? 'self-start' : 'self-center'} data-field={f.id}>
                    <FieldControl f={f} value={form.values[f.id] ?? ''} onChange={(v) => form.setValue(f.id, v)} error={error} />
                  </div>
                  {(extra || error) && (
                    <div style={{ gridRow: r * 2 + 2, gridColumn: col + 1 }} className="pb-8">
                      {extra}
                      {error && <ErrorText>{mandatoryMessage(f.label)}</ErrorText>}
                    </div>
                  )}
                </Fragment>
              );
            })}
            {/* spacer row: 34px between rows, more when a field carries a checkbox or error */}
            <div style={{ gridRow: r * 2 + 2, gridColumn: '1 / -1' }} className="pointer-events-none h-9" />
          </Fragment>
        );
      })}
    </div>
  );
}

export function SectionHeader({ title, first }: { title: string; first?: boolean }) {
  return <div className={`${first ? 'mt-7' : 'mt-2.5'} border-0 border-b border-solid border-tertiary-border pb-3 font-button text-xl leading-5 text-secondary-text`}>{title}</div>;
}

/** All sections; `afterSection` lets the page insert the price table under "Product, Size and Inventory". */
export function DetailsForm({ form, afterSection }: { form: FormState; afterSection?: Partial<Record<SectionId, ReactNode>> }) {
  return (
    <>
      {SECTIONS.map((s, i) => (
        <section key={s.id}>
          <SectionHeader title={s.title} first={i === 0} />
          <FieldGrid fields={FIELDS.filter((f) => f.section === s.id)} form={form} />
          {afterSection?.[s.id]}
        </section>
      ))}
    </>
  );
}

