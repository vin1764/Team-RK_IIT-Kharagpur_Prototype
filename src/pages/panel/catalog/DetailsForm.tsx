// "Add Product Details" card: sections of fields laid out from FIELDS, two per row, label column on the
// left of each input (catalog-product-details-1/2/3.png, catalog-other-attributes.png).
import { Fragment, type ReactNode } from 'react';
import { mandatoryMessage, SECTIONS, FIELDS, type FieldDef, type SectionId } from './fields';
import { Pill } from '../../../components/ui';
import { Checkbox, ErrorText, Info, SelectInput, TextArea, TextInput } from './FormBits';

/** `align`: centre on the row (default), on a 40px input (rows holding a textarea), or at a textarea's top.
 *  `caption` (bot mode only) sits under the label: "Filled by bot" or "you enter". */
export function FieldLabel({ f, align = 'row', caption }: { f: FieldDef; align?: 'row' | 'input' | 'textarea'; caption?: ReactNode }) {
  const a = align === 'textarea' ? 'mt-2.5 items-start' : align === 'input' ? 'min-h-10 items-center' : 'items-center';
  const row = (
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
  if (!caption) return row;
  return (
    <div>
      {row}
      <div className="mt-1 flex justify-end pr-3">{caption}</div>
    </div>
  );
}

export function FieldControl({ f, value, onChange, error }: { f: FieldDef; value: string; onChange: (v: string) => void; error: boolean }) {
  if (f.kind === 'select') {
    // A value set by the bot or "Fill demo values" (e.g. 320 g) may not be in the placeholder list.
    const options = f.options ?? [];
    return <SelectInput value={value} onChange={onChange} options={value && !options.includes(value) ? [...options, value] : options} placeholder={f.placeholder} error={error} />;
  }
  if (f.kind === 'textarea') return <TextArea value={value} onChange={onChange} placeholder={f.placeholder} maxLength={f.maxLength} error={error} />;
  return <TextInput value={value} onChange={onChange} placeholder={f.placeholder} error={error} />;
}

/** Tint of a bot-filled control (panel tokens only): lavender border and background. */
const BOT_TINT =
  '[&_input]:border-brand-secondary-border [&_input]:bg-brand-secondary-bg [&_select]:border-brand-secondary-border [&_select]:bg-brand-secondary-bg [&_textarea]:border-brand-secondary-border [&_textarea]:bg-brand-secondary-bg';

/** "Create from photos" view of the form (LB-4): translated labels, bot / maker tags, unit pickers. */
export interface BotView {
  /** The field as the bot screens show it (label, placeholder and tooltip in the demo language). */
  view: (f: FieldDef) => FieldDef;
  /** Ids currently filled by the bot. */
  filled: Set<string>;
  /** Ids the maker enters ("you enter"). */
  youEnter: Set<string>;
  tagBot: string;
  tagYou: string;
  sameAsManufacturerLabel: string;
  /** Extra content under a field (Net Quantity confirm, retail-pack toggle). */
  extra?: (id: string) => ReactNode;
  sectionTitle: (id: SectionId, fallback: string) => string;
  sectionRight?: (id: SectionId) => ReactNode;
}

export function BotTag({ children }: { children: ReactNode }) {
  return (
    <Pill tone="brand" className="leading-4 whitespace-nowrap" >
      <span data-c2m="LB-4" data-c2m-id="LB-4">{children}</span>
    </Pill>
  );
}
export function YouTag({ children }: { children: ReactNode }) {
  return (
    <span data-c2m="LB-4" data-c2m-id="LB-4" className="font-body text-sm leading-4 whitespace-nowrap text-tertiary-text">
      {children}
    </span>
  );
}

export interface FormState {
  values: Record<string, string>;
  setValue: (id: string, v: string) => void;
  /** Ids that show the red "Mandatory field" error (after Submit). */
  errors: Set<string>;
  sameAsManufacturer: boolean;
  setSameAsManufacturer: (v: boolean) => void;
  /** Present in "Create from photos" mode only. */
  bot?: BotView;
}

export function FieldGrid({ fields: all, form }: { fields: FieldDef[]; form: FormState }) {
  const bot = form.bot;
  // Bot mode folds Product / Volume / Weight units in as pickers beside their measurement fields (doc p.16).
  const units = bot ? all.filter((f) => f.unitFor) : [];
  const fields = bot ? all.filter((f) => !f.unitFor).map(bot.view) : all;
  const rows: FieldDef[][] = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2));
  const seenUnit = new Set<string>();
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
                    label={<span className="ml-2.5 font-body text-lg leading-5 text-secondary-text">{bot?.sameAsManufacturerLabel ?? 'Same as Manufacturer Details'}</span>}
                  />
                );
              const botExtra = bot?.extra?.(f.id);
              if (botExtra) extra = <>{botExtra}{extra}</>;
              const isBot = !!bot?.filled.has(f.id);
              const isYou = !!bot?.youEnter.has(f.id);
              const caption = isBot ? <BotTag>{bot!.tagBot}</BotTag> : isYou ? <YouTag>{bot!.tagYou}</YouTag> : undefined;
              const unit = units.find((u) => u.unitFor!.split(',').includes(f.id));
              const control = <FieldControl f={f} value={form.values[f.id] ?? ''} onChange={(v) => form.setValue(f.id, v)} error={error} />;
              let unitPicker: ReactNode = null;
              if (unit && bot) {
                const u = bot.view(unit);
                const first = !seenUnit.has(u.id);
                seenUnit.add(u.id);
                const uBot = bot.filled.has(u.id);
                unitPicker = (
                  <div
                    className={`w-24 shrink-0 ${uBot ? BOT_TINT : ''}`}
                    title={`${u.label}${uBot ? ` · ${bot.tagBot}` : ''}`}
                    aria-label={u.label}
                    data-field={first ? u.id : undefined}
                    data-bot-filled={first && uBot ? 'true' : undefined}
                    data-c2m="LB-4"
                    data-c2m-id="LB-4"
                  >
                    <FieldControl f={u} value={form.values[u.id] ?? ''} onChange={(v) => form.setValue(u.id, v)} error={form.errors.has(u.id)} />
                  </div>
                );
              }
              return (
                <Fragment key={f.id}>
                  <div style={{ gridRow: r * 2 + 1, gridColumn: col }} className={top ? 'self-start' : 'self-center'}>
                    <FieldLabel f={f} align={!top ? 'row' : f.kind === 'textarea' ? 'textarea' : 'input'} caption={caption} />
                  </div>
                  <div
                    style={{ gridRow: r * 2 + 1, gridColumn: col + 1 }}
                    className={`${top ? 'self-start' : 'self-center'} ${isBot ? BOT_TINT : ''}`}
                    data-field={f.id}
                    data-bot-filled={isBot ? 'true' : undefined}
                    data-you-enter={isYou ? 'true' : undefined}
                  >
                    {unitPicker ? (
                      <div className="flex gap-2">
                        <div className="min-w-0 flex-1">{control}</div>
                        {unitPicker}
                      </div>
                    ) : (
                      control
                    )}
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

export function SectionHeader({ title, first, right }: { title: string; first?: boolean; right?: ReactNode }) {
  return (
    <div className={`${first ? 'mt-7' : 'mt-2.5'} border-0 border-b border-solid border-tertiary-border pb-3 font-button text-xl leading-5 text-secondary-text`}>
      {right ? (
        <div className="flex items-center justify-between gap-3">
          {title}
          {right}
        </div>
      ) : (
        title
      )}
    </div>
  );
}

/** All sections; `afterSection` lets the page insert the price table under "Product, Size and Inventory". */
export function DetailsForm({ form, afterSection }: { form: FormState; afterSection?: Partial<Record<SectionId, ReactNode>> }) {
  return (
    <>
      {SECTIONS.map((s, i) => (
        <section key={s.id} data-section={s.id}>
          <SectionHeader title={form.bot ? form.bot.sectionTitle(s.id, s.title) : s.title} first={i === 0} right={form.bot?.sectionRight?.(s.id)} />
          <FieldGrid fields={FIELDS.filter((f) => f.section === s.id)} form={form} />
          {afterSection?.[s.id]}
        </section>
      ))}
    </>
  );
}

