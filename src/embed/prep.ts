// Showcase frame: what a "Jump to what's new" item sets up before it lands (contract `Prep`, src/showcase/types.ts).
// Each step calls the app's own functions (the same ones the Reset demo button, the photo modal and
// "Fill demo values" call), so a prepared screen is exactly what a presenter would reach by clicking.
import { typicalForType } from '../engine/ui';
import { botTypeFor, confirmReview, demoValues, SCRIPTED_REVIEW_TIME } from '../pages/panel/catalog/bot';
import { DEMO_IMAGE, resetDraft, useDraft } from '../pages/panel/catalog/draftStore';
import { applyPhotos } from '../pages/panel/catalog/photos';
import { resetCatalog } from '../store/catalog';
import { useDemo, type Persona } from '../store/demo';
import { PERSONAS, useOnboarding } from '../store/onboarding';
import { resetPriceChecks } from '../store/priceChecks';
import { resetPriceEdits } from '../store/priceEdits';
import { resetRestockPlans } from '../store/restockPlan';
import { resetLotPlans } from '../store/lotPlans';
import { resetLaunch } from '../store/timeline';
import { LAUNCH } from '../pages/panel/factory-launch/launch';
import { resetLaunchBanner } from '../store/launchBanner';
import { resetMakerProduct } from '../store/makerProduct';
import type { Prep } from '../showcase/types';

/** Query param FactoryLaunchPanel reads to open the commit modal on the maker's own order-book row. */
export const COMMIT_PARAM = 'commit';

/** Everything the Reset demo button clears except the demo store (persona/day/lang/c2m). */
export function resetInteractive() {
  useOnboarding.getState().reset();
  resetCatalog();
  resetDraft();
  resetLaunch();
  resetPriceEdits();
  resetPriceChecks();
  resetRestockPlans();
  resetLotPlans();
  resetMakerProduct();
  resetLaunchBanner();
}

/** Onboarding resets on a persona switch, so the fulfilment choice only carries over for the same persona. */
const fulfilmentFor = (persona: Persona) => (useDemo.getState().persona === persona ? useOnboarding.getState().fulfilment : null);

/** A fresh bot draft: the demo photo added and the bot's pre-fill run (Product screen; maker fields empty). */
function botPhotos(persona: Persona): boolean {
  const record = PERSONAS[persona];
  const type = record.product?.type;
  if (!type || !botTypeFor(type)) return false;
  resetDraft();
  return applyPhotos([DEMO_IMAGE], type, record, fulfilmentFor(persona));
}

/**
 * botPhotos + every demo value ("Fill demo values") + Pack of 1 confirmed + the bot's details confirmed (a jump past
 * the Product screen, so the review is done; D3 at the scripted time): Quantity and Price are reachable.
 */
function botFilled(persona: Persona) {
  if (!botPhotos(persona)) return;
  const record = PERSONAS[persona];
  const type = record.product!.type;
  const d = useDraft.getState();
  const { mrp, ...values } = demoValues(type, record, typicalForType(type));
  d.setValues(values);
  const size = useDraft.getState().values.size;
  if (mrp && size) d.setPrice(size, { mrp });
  d.setBot({ netQtyConfirmed: true });
  const s = useDraft.getState();
  s.setBot({ botReview: confirmReview(s.values, s.botFilled, LAUNCH.listingDay, SCRIPTED_REVIEW_TIME) });
}

/** Runs the prep steps in a sensible order and returns the route to open (with ?commit=1 for 'commitModal'). */
export function runPrep(prep: Prep[] | undefined, persona: Persona, to: string): string {
  const steps = new Set(prep ?? []);
  if (steps.has('clean')) resetInteractive();
  if (steps.has('botFilled')) botFilled(persona);
  else if (steps.has('botPhotos')) botPhotos(persona);
  if (!steps.has('commitModal')) return to;
  const [path, query = ''] = to.split('?') as [string, string?];
  const q = new URLSearchParams(query);
  q.set(COMMIT_PARAM, '1');
  return `${path}?${q.toString()}`;
}

