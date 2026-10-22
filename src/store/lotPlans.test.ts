import { beforeEach, describe, expect, it } from 'vitest';
import { LOT_PLAN_STORAGE_KEY, lotKey, resetLotPlans, useLotPlans } from './lotPlans';
import { safeStorage } from './catalog';

describe('lot plans (GL-6 "Plan a lot")', () => {
  beforeEach(() => resetLotPlans());

  it('keyed by persona and product type', () => {
    expect(lotKey('jasmeet', 'steel-casserole-1-5l')).toBe('jasmeet:steel-casserole-1-5l');
  });

  it('Save plan stores the units, start day and lead time; Edit replaces it', () => {
    const k = lotKey('jasmeet', 'steel-casserole-1-5l');
    useLotPlans.getState().save(k, { units: 80, startDay: 28, leadTimeDays: 5 });
    useLotPlans.getState().save(lotKey('jasmeet', 'steel-flask-500ml'), { units: 50, startDay: 28, leadTimeDays: 5 });
    expect(useLotPlans.getState().plans[k]).toEqual({ units: 80, startDay: 28, leadTimeDays: 5 });
    useLotPlans.getState().save(k, { units: 120, startDay: 30, leadTimeDays: 5 });
    expect(Object.keys(useLotPlans.getState().plans)).toHaveLength(2);
    expect(useLotPlans.getState().plans[k]!.units).toBe(120);
  });

  it('is persisted under rk-lot-plans-v1, and Reset demo clears it', () => {
    useLotPlans.getState().save(lotKey('jasmeet', 'steel-flask-500ml'), { units: 50, startDay: 28, leadTimeDays: 5 });
    expect(LOT_PLAN_STORAGE_KEY).toBe('rk-lot-plans-v1');
    expect(JSON.parse(safeStorage.getItem(LOT_PLAN_STORAGE_KEY) as string).state.plans).toHaveProperty('jasmeet:steel-flask-500ml');
    resetLotPlans();
    expect(useLotPlans.getState().plans).toEqual({});
    expect(safeStorage.getItem(LOT_PLAN_STORAGE_KEY)).toBeNull();
  });
});
