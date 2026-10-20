import { describe, expect, it } from 'vitest';
import { verdict } from './verdict';

// plan §8 verdict
describe('verdict — Jasmeet at D31', () => {
  it('bottle → Make more (84 on hand, reorder at 77, 11 a day: 0 whole days to reorder)', () => {
    expect(
      verdict({
        sku: 'bottle',
        daysToReorderPoint: Math.floor((84 - 77) / 11),
        outOfBand: [],
        weeksSellThroughBelowP25: 0,
        typeDemandSteady: true,
        stopped: false,
      }),
    ).toBe('makeMore');
  });

  it.todo('lunch box → Keep: needs the lunch box SKU metrics (Q5)');
  it.todo('sipper → Stop: needs the sipper SKU metrics (Q5)');
});
