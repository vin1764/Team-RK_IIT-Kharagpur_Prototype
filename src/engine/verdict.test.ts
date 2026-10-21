import { describe, expect, it } from 'vitest';
import { verdict, type SkuHealth } from './verdict';

const base: SkuHealth = {
  sku: 'x',
  coverDays: 20,
  leadTimeDays: 5,
  safetyDays: 2,
  outOfBand: [],
  weeksSellThroughBelowP25: 0,
  typeDemandSteady: true,
  stopped: false,
};

// plan §8 verdict (deck appendix rules; team moved the restock moment to D28)
describe('verdict', () => {
  it('bottle at D28 → Make more: 6.6 days of cover < 5 lead + 2 safety', () => {
    expect(verdict({ ...base, sku: 'bottle', coverDays: 6.6 })).toBe('makeMore');
  });
  it('sell-through below p25 for 2+ weeks while the type is steady → Stop', () => {
    expect(verdict({ ...base, weeksSellThroughBelowP25: 2 })).toBe('stop');
  });
  it('after a stop → Switch', () => expect(verdict({ ...base, stopped: true })).toBe('switch'));
  it('one metric out of band → Fix', () => expect(verdict({ ...base, outOfBand: ['clickThrough'] })).toBe('fix'));
  it('in band on everything → Keep', () => expect(verdict(base)).toBe('keep'));

  it.todo('lunch box → Keep: needs the lunch box SKU metrics (Q5)');
  it.todo('sipper → Stop: needs the sipper SKU metrics (Q5)');
});
