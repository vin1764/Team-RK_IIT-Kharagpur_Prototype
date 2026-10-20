// Shared engine types. Rupees are whole numbers unless a field says "exact".

export type ProductTypeId = 'steel-bottle-1l' | 'steel-casserole-1-5l' | 'steel-flask-500ml';
export type Confidence = 'High' | 'Medium' | 'Low';
export type FulfilmentMode = 'selfShip' | 'packPoint';

export interface Range {
  low: number;
  high: number;
}

/** Thrown by every stub until Phase 3 implements it. */
export class NotImplemented extends Error {
  constructor(fn: string) {
    super(`${fn}: not implemented yet (Phase 3)`);
    this.name = 'NotImplemented';
  }
}

/** Thrown when the plan has no value for an input (see PHASE-0.md §7). */
export class MissingPlanValue extends Error {
  constructor(what: string) {
    super(`Missing plan value: ${what}`);
    this.name = 'MissingPlanValue';
  }
}
