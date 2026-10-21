// Guards for product types whose plan values are only partly seeded (Samar's sneakers, team Q4:
// no demand gap or price band, no self-ship packaging). The engine throws MissingPlanValue for a
// missing value; these helpers turn that into "not shown" instead of a crashed page. They never
// fill a gap with a made-up value.
import { demandForType, likelyShare, typeFees, type ProductTypeId } from '../../../engine/ui';
import type { PersonaRecord } from '../../../store/onboarding';

const isMissing = (e: unknown) => e instanceof Error && e.name === 'MissingPlanValue';

function orNull<T>(f: () => T): T | null {
  try {
    return f();
  } catch (e) {
    if (isMissing(e)) return null;
    throw e;
  }
}

/** The type's demand gap, or null when the team gave none (sneakers). */
export const demandOrNull = (type: ProductTypeId) => orNull(() => demandForType(type));

/** The type's likely share of the gap, or null when it isn't seeded. */
export const likelyShareOrNull = (type: ProductTypeId) => orNull(() => likelyShare(type));

/**
 * Fulfilment mode for a cost check: the persona's own choice (Samar: Pack Point), and Pack Point
 * for a type with no self-ship packaging value, so the stack never needs a missing number.
 */
export function costCheckMode(persona: Pick<PersonaRecord, 'fulfilment'>, type: ProductTypeId): 'selfShip' | 'packPoint' {
  if (persona.fulfilment === 'packPoint') return 'packPoint';
  return typeFees(type).packaging === null ? 'packPoint' : 'selfShip';
}
