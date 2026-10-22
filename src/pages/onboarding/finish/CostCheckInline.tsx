// FO-5 · the 5-minute cost check, inline on the onboarding finish screen (it used to be its own page reached
// from the outreach link). The product type is the one the maker just told us; the fulfilment is their
// Pickup Address choice (FO-8). Making cost in → fee stack, break-even, take-home at every price, and one
// verdict: "a qualifying price exists" (yes/no only — Benchmark B never shown).
import { useState } from 'react';
import { Card } from '../../../components/ui';
import { costStack, gstAt, qualifyingPriceExists, takeHomeAt, typeFees, type ProductTypeId } from '../../../engine/ui';
import type { PersonaRecord } from '../../../store/onboarding';
import { demandOrNull } from '../signup/guards';
import { Field } from '../signup/Field';
import { FIN } from './copy';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Fee stack mode: the maker's Pickup Address choice (else their record); Pack Point for a type with no self-ship packaging value. */
export function finishMode(choice: 'selfShip' | 'packPoint' | 'waitlist' | null, persona: Pick<PersonaRecord, 'fulfilment'>, type: ProductTypeId): 'selfShip' | 'packPoint' {
  if ((choice ?? persona.fulfilment) === 'packPoint') return 'packPoint';
  return typeFees(type).packaging === null ? 'packPoint' : 'selfShip';
}

/** True when the engine has a fee card for the type (the cost check can run). */
export function hasFeeCard(type: ProductTypeId): boolean {
  try {
    typeFees(type);
    return true;
  } catch {
    return false;
  }
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={strong ? 'flex justify-between font-heading text-xl leading-6' : 'flex justify-between text-lg leading-5'}>
      <span className={strong ? undefined : 'text-secondary-text'}>{label}</span>
      <span>₹{value}</span>
    </div>
  );
}

export function CostCheckInline({
  type,
  mode,
  marginPct,
  making,
  onMaking,
}: {
  type: ProductTypeId;
  mode: 'selfShip' | 'packPoint';
  /** the maker's margin when the type is their own product (persona record), else 0 */
  marginPct: number;
  making: string;
  onMaking: (v: string) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const makingCost = Number(making);
  const ready = making !== '' && makingCost > 0;

  let result = null;
  if (ready) {
    const stack = costStack(type, makingCost, marginPct, mode);
    // A type with no price band seeded: the slider then runs to the list price.
    const band = demandOrNull(type)?.priceBand ?? null;
    const min = stack.breakEven;
    const max = Math.max(min, band?.high ?? min, marginPct > 0 ? stack.listPrice : min);
    // Default: the list price at the maker's margin; without a margin, the low end of the buyers' price band.
    const fallback = marginPct > 0 ? stack.listPrice : (band?.low ?? min);
    const price = clamp(picked ?? fallback, min, max);
    const f = stack.fees;
    result = {
      stack,
      min,
      max,
      price,
      qualifies: qualifyingPriceExists(type, stack.breakEven),
      rows: [
        { label: 'Making cost', value: stack.makingCost },
        f.packPointFee !== undefined ? { label: 'Pack Point fee', value: f.packPointFee } : { label: 'Packaging', value: f.packaging ?? 0 },
        { label: 'Shipping + fixed fee', value: f.shippingAndFixed },
        { label: 'Returns & refusal buffer', value: f.returnsBuffer },
        // Q18: GST is 5% of the selling price, included in it, so this row follows the slider.
        { label: `GST (${Math.round(stack.gstRate * 100)}% of ₹${price})`, value: gstAt(price, stack) },
      ],
    };
  }

  return (
    <section className="rounded bg-white p-6" data-c2m="FO-5" data-c2m-id="FO-5" data-cost-check>
      <h2 className="m-0 font-heading text-2xl leading-6 text-primary-text">{FIN.costTitle}</h2>
      <p className="m-0 mt-1 text-lg leading-5 text-secondary-text">{FIN.costSub(mode)}</p>
      <div className="mt-5 grid grid-cols-[260px_1fr_1fr] items-start gap-4 max-[1023px]:grid-cols-1">
        <div>
          <Field
            label={FIN.makingCost}
            labelBg="bg-white"
            prefix="₹"
            inputMode="numeric"
            autoComplete="off"
            value={making}
            onChange={(e) => {
              onMaking(e.target.value.replace(/\D/g, '').slice(0, 6));
              setPicked(null);
            }}
            data-making-cost
          />
          <p className="m-0 mt-3 text-sm leading-4 text-tertiary-text">{FIN.feesNote(mode)}</p>
        </div>
        {!result ? (
          <Card className="col-span-2 border border-solid border-tertiary-border text-lg leading-5 text-secondary-text max-[1023px]:col-span-1">{FIN.enterCost}</Card>
        ) : (
          <>
            <Card className="border border-solid border-tertiary-border">
              <h3 className="m-0 font-heading text-xl leading-6">{FIN.feeStack}</h3>
              <div className="mt-3 flex flex-col gap-2">
                {result.rows.map((r) => (
                  <Row key={r.label} {...r} />
                ))}
              </div>
              <hr className="m-0 my-3 border-0 border-t border-solid border-tertiary-border" />
              <Row label={FIN.breakEven} value={result.stack.breakEven} strong />
            </Card>
            <div className="flex flex-col gap-4">
              <Card className="border border-solid border-tertiary-border">
                <h3 className="m-0 font-heading text-xl leading-6">{FIN.takeHomeTitle}</h3>
                <input
                  type="range"
                  aria-label="Price"
                  min={result.min}
                  max={result.max}
                  step={1}
                  value={result.price}
                  disabled={result.min === result.max}
                  onChange={(e) => setPicked(Number(e.target.value))}
                  className="mt-4 block w-full cursor-pointer accent-brand-primary-bg"
                />
                <div className="mt-1 flex justify-between text-base leading-4 text-tertiary-text">
                  <span>₹{result.min}</span>
                  <span>₹{result.max}</span>
                </div>
                <p className="m-0 mt-3 font-heading text-xl leading-6" data-take-home>
                  {FIN.takeHomeAt(result.price, takeHomeAt(result.price, result.stack))}
                </p>
              </Card>
              <div className={`rounded-lg border border-solid px-4 py-3 ${result.qualifies ? 'border-success-border bg-success-bg' : 'border-tertiary-border bg-white'}`} data-verdict={result.qualifies ? 'qualifies' : 'no'}>
                <p className={`m-0 font-button text-lg leading-5 ${result.qualifies ? 'text-success-text' : 'text-secondary-text'}`}>{result.qualifies ? FIN.qualifies : FIN.noQualifying}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
