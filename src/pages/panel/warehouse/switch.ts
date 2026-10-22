// PP-3 · Warehouse "Switch to Pack Point · <city>" / "Switch back to self-ship": the confirm panel's numbers.
// For each live listing, at its current price: take-home today and after the switch (engine costStack in the target
// mode → takeHomeAt), and the Factory Launch status after the switch (checkListingPrice → "Qualifies" / "Not eligible
// at this price"; the cap itself never leaves the engine). A product with no self-ship packaging value in the seed
// (Samar's sneakers) can't be priced for self-ship: its row says so instead of inventing a packaging cost.
import { checkListingPrice, costStack, takeHomeAt, typeFees, type ProductTypeId } from '../../../engine/ui';
import type { ShipMode, ShipSwitch } from '../../../store/fulfilmentSwitch';

export interface SwitchListing {
  key: string;
  id: string;
  name: string;
  typeId: ProductTypeId;
  price: number;
  makingCost: number;
  marginPct: number;
  /** how it ships today (after any earlier switch) */
  mode: ShipMode;
}

export interface SwitchRow extends SwitchListing {
  takeHomeNow: number | null;
  /** null when the target mode can't be priced for this product */
  takeHomeAfter: number | null;
  /** Factory Launch status after the switch; null when it can't be checked (no stack, or no comparables for the type) */
  statusAfter: 'qualifies' | 'notEligible' | null;
}

/** The seed has a self-ship packaging value for this type (else self-ship can't be priced). */
export const canSelfShip = (type: ProductTypeId) => typeFees(type).packaging !== null;

function takeHome(l: SwitchListing, mode: ShipMode, makersPooled: number): { takeHome: number; breakEven: number } | null {
  if (mode === 'selfShip' && !canSelfShip(l.typeId)) return null;
  const s = costStack(l.typeId, l.makingCost, l.marginPct, mode, makersPooled);
  return { takeHome: Math.round(takeHomeAt(l.price, s)), breakEven: s.breakEven };
}

export function switchRows(listings: SwitchListing[], to: ShipMode, makersPooled: number): SwitchRow[] {
  return listings.map((l) => {
    const now = takeHome(l, l.mode, makersPooled);
    const after = takeHome(l, to, makersPooled);
    let statusAfter: SwitchRow['statusAfter'] = null;
    if (after) {
      try {
        statusAfter = checkListingPrice(l.typeId, l.price, after.breakEven) === 'qualifies' ? 'qualifies' : 'notEligible';
      } catch {
        statusAfter = null; // no comparables seeded for this type: no launch status to show
      }
    }
    return { ...l, takeHomeNow: now?.takeHome ?? null, takeHomeAfter: after?.takeHome ?? null, statusAfter };
  });
}

/** How the maker ships on Warehouse: his last switch there, else his onboarding choice (Pack Point = his district's node). */
export function warehouseShip(personaMode: ShipMode, districtNode: string, sw: ShipSwitch | undefined): { mode: ShipMode; node: string | null; switched: boolean } {
  if (sw) return { mode: sw.mode, node: sw.mode === 'packPoint' ? sw.node : null, switched: true };
  return { mode: personaMode, node: personaMode === 'packPoint' ? districtNode : null, switched: false };
}
