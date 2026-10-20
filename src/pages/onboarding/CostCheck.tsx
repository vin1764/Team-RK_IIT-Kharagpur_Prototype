// FO-5 · 5-minute cost check (new page, in the sign-up page's own layout).
// Two inputs (product type, making cost) → fee stack, break-even, take-home at every price,
// and one verdict: "a qualifying price exists" (yes/no only — Benchmark B never shown).
import { useState } from 'react';
import { onboarding } from '../../app/paths';
import { Button, Card } from '../../components/ui';
import { costStack, demandForType, qualifyingPriceExists, takeHomeAt, type ProductTypeId } from '../../engine/ui';
import { useDemo } from '../../store/demo';
import { useOnboarding, usePersona } from '../../store/onboarding';
import { Field } from './signup/Field';
import { useDemoLink } from './signup/nav';
import { Verdict } from './signup/OutreachPanel';
import { ProductTypeSelect } from './signup/ProductTypeSelect';
import { SplitLayout } from './signup/SplitLayout';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={strong ? 'flex justify-between font-heading text-xl leading-6' : 'flex justify-between text-lg leading-5'}>
      <span className={strong ? undefined : 'text-secondary-text'}>{label}</span>
      <span>₹{value}</span>
    </div>
  );
}

function CostCheckPage() {
  const persona = usePersona();
  const saved = useOnboarding((s) => s.costCheck);
  const set = useOnboarding((s) => s.set);
  const { go } = useDemoLink();

  const [type, setType] = useState<ProductTypeId | null>(saved?.type ?? persona.product?.type ?? null);
  const [making, setMaking] = useState<string>(String(saved?.makingCost ?? persona.product?.makingCost ?? ''));
  const [picked, setPicked] = useState<number | null>(saved?.price ?? null);

  const makingCost = Number(making);
  const ready = type !== null && making !== '' && makingCost > 0;

  let result = null;
  if (ready) {
    const marginPct = persona.product?.type === type ? persona.product.marginPct : 0;
    const stack = costStack(type, makingCost, marginPct, 'selfShip');
    const band = demandForType(type).priceBand;
    const min = stack.breakEven;
    const max = Math.max(min, band?.high ?? min);
    // Default: the persona's list price (break-even + take-home at their margin); without a margin, the low end of the buyers' price band.
    const fallback = marginPct > 0 ? stack.listPrice : (band?.low ?? min);
    const price = clamp(picked ?? fallback, min, max);
    const qualifies = qualifyingPriceExists(type, stack.breakEven);
    const f = stack.fees;
    result = { stack, min, max, price, qualifies, rows: [
      { label: 'Making cost', value: stack.makingCost },
      { label: 'Packaging', value: f.packaging ?? 0 },
      { label: 'Shipping + fixed fee', value: f.shippingAndFixed },
      { label: 'Returns & refusal buffer', value: f.returnsBuffer },
      { label: 'GST', value: f.gst },
    ] };
  }

  const left = (
    <>
      <h1 className="m-0 mt-[37px] font-heading text-4xl leading-7">See your take-home in 5 minutes</h1>
      <p className="m-0 mt-[3.6px] text-xl leading-5 text-tertiary-text">Cost check · two inputs</p>
      <ProductTypeSelect
        className="mt-[27.4px]"
        value={type}
        onChange={(t) => {
          setType(t);
          setPicked(null);
        }}
      />
      <Field
        label="Making cost per unit"
        className="mt-[28.8px]"
        prefix="₹"
        inputMode="numeric"
        autoComplete="off"
        value={making}
        onChange={(e) => {
          setMaking(e.target.value.replace(/\D/g, '').slice(0, 6));
          setPicked(null);
        }}
      />
    </>
  );

  const footer = (
    <div className="pb-[59px]" data-c2m="FO-5">
      <Button
        className="h-11 w-full"
        disabled={!result}
        onClick={() => {
          if (!result || !type) return;
          set({ costCheckDone: true, costCheck: { type, makingCost, price: result.price } });
          go(onboarding.signupFromOutreach);
        }}
      >
        Continue to sign up
      </Button>
      <p className="m-0 mt-[18px] text-center text-sm leading-4 text-tertiary-text">
        Fees are Meesho's fee card for this product type; storage and Pack Point fees aren't included.
      </p>
    </div>
  );

  const right = (
    <div className="mt-[44px]" data-c2m="FO-5">
      {!result ? (
        <Card className="text-lg leading-5 text-secondary-text">Pick a product type and enter your making cost to see your take-home.</Card>
      ) : (
        <>
          <Card>
            <h2 className="m-0 font-heading text-2xl leading-6">Fee stack per order</h2>
            <div className="mt-3 flex flex-col gap-2">
              {result.rows.map((r) => (
                <Row key={r.label} {...r} />
              ))}
            </div>
            <hr className="m-0 my-3 border-0 border-t border-solid border-tertiary-border" />
            <Row label="Break-even" value={result.stack.breakEven} strong />
          </Card>

          <Card className="mt-4">
            <h2 className="m-0 font-heading text-2xl leading-6">Take-home at every price</h2>
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
            <p className="m-0 mt-3 font-heading text-xl leading-6">
              At ₹{result.price} you take home ₹{takeHomeAt(result.price, result.stack)} per unit
            </p>
          </Card>

          <div className={`mt-4 rounded-lg border border-solid px-4 py-3 ${result.qualifies ? 'border-success-border bg-success-bg' : 'border-tertiary-border bg-white'}`}>
            <Verdict qualifies={result.qualifies} negative="No qualifying price at this making cost" />
          </div>
        </>
      )}
    </div>
  );

  return <SplitLayout left={left} leftFooter={footer} right={right} />;
}

/** Re-mounts on persona switch so the inputs start from the new persona's records. */
export default function CostCheck() {
  const persona = useDemo((s) => s.persona);
  return <CostCheckPage key={persona} />;
}
