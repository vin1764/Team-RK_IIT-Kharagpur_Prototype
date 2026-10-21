// FO-4 · Sign-up right panel for makers arriving from the outreach link (doc p.11).
// FO-5 · Cost-check entry card, or its result once the maker has run it.
// Every number comes from src/engine/ui.ts for the persona's product type.
import { Button } from '../../../components/ui';
import { onboarding } from '../../../app/paths';
import { costStack, productTypeName, qualifyingPriceExists, takeHomeAt } from '../../../engine/ui';
import { costCheckMode, demandOrNull } from './guards';
import { useOnboarding, usePersona } from '../../../store/onboarding';
import { GenericPanel } from './GenericPanel';
import { plural, rupeeRange, useDemoLink } from './nav';

export function Verdict({ qualifies, negative }: { qualifies: boolean; negative: string }) {
  return qualifies ? (
    <p className="m-0 font-button text-lg leading-5 text-success-text">✓ A qualifying price exists for this product</p>
  ) : (
    <p className="m-0 font-button text-lg leading-5 text-secondary-text">{negative}</p>
  );
}

function CostCheckResult({ onContinue }: { onContinue: () => void }) {
  const persona = usePersona();
  const cc = useOnboarding((s) => s.costCheck)!;
  const marginPct = persona.product?.type === cc.type ? persona.product.marginPct : 0;
  const stack = costStack(cc.type, cc.makingCost, marginPct, costCheckMode(persona, cc.type));
  return (
    <>
      <div className="mt-4 rounded-lg border border-solid border-tertiary-border bg-secondary-bg p-4" data-c2m="FO-5">
        <p className="m-0 font-button text-xl leading-5">Cost check · two inputs</p>
        <p className="m-0 mt-1.5 text-lg leading-5 text-secondary-text">
          Product: {productTypeName(cc.type)} · Making cost: ₹{cc.makingCost}
        </p>
        <p className="m-0 mt-2 font-heading text-xl leading-6">
          At ₹{cc.price} you take home ₹{takeHomeAt(cc.price, stack)} per unit
        </p>
        <div className="mt-1.5">
          <Verdict qualifies={qualifyingPriceExists(cc.type, stack.breakEven)} negative="No qualifying price at this cost yet" />
        </div>
      </div>
      <Button className="mt-4 h-11 w-full" onClick={onContinue}>
        Continue to sign up
      </Button>
    </>
  );
}

export function OutreachPanel({ onContinue }: { onContinue: () => void }) {
  const persona = usePersona();
  const done = useOnboarding((s) => s.costCheckDone && s.costCheck !== null);
  const { go } = useDemoLink();

  if (!persona.product)
    return (
      <GenericPanel
        note={
          <p className="m-0 mt-1 text-base leading-4 text-tertiary-text" data-c2m="FO-4">
            Demand teaser shown for makers with a matched product type
          </p>
        }
      />
    );

  const { type } = persona.product;
  // A type with no demand gap seeded: the teaser line is left out, never invented.
  const demand = demandOrNull(type);
  const band = demand?.priceBand ?? null;

  return (
    <div className="mt-[44px] rounded-lg border border-solid border-brand-primary-border bg-white p-5" data-c2m="FO-4">
      <h2 className="m-0 font-heading text-2xl leading-6">For {plural(productTypeName(type))}</h2>
      {demand && (
        <p className="m-0 mt-2 text-xl leading-6">
          About {demand.gapPerWeek.low} orders a week go unserved in your region{band ? ` at ${rupeeRange(band.low, band.high)}` : ''}
        </p>
      )}
      <div className="mt-3 text-lg leading-5">
        <p className="m-0 font-button">Factory Launch Week · manufacturers only</p>
        <p className="m-0 text-secondary-text">No ads, no listing fee</p>
        <p className="m-0 text-tertiary-text">Expected orders are a forecast, not a guarantee</p>
      </div>

      {done ? (
        <CostCheckResult onContinue={onContinue} />
      ) : (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-solid border-tertiary-border bg-secondary-bg p-4" data-c2m="FO-5">
          <p className="m-0 font-button text-xl leading-5">See your take-home in 5 minutes · two inputs</p>
          <Button className="shrink-0" onClick={() => go(onboarding.costCheck)}>
            Check take-home
          </Button>
        </div>
      )}
    </div>
  );
}
