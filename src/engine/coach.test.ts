import { describe, expect, it } from 'vitest';
import { coachFix } from './coach';

// plan §8 coachFix · §8b Coach
// The trigger cut-offs (ctrP25, viewsP25) are missing (Q10). The plan's outcome must hold
// for any CTR cut-off above 1.6% and up to 4.2%, and any views floor up to 2,400.
describe('coachFix — bottle funnel', () => {
  const funnel = { views: 2400, clicks: 38, orders: null };

  it.each([
    [0.016, 2400],
    [0.042, 0],
  ])('2,400 views, 38 clicks: 1.6% vs 4.2% → change the main photo (ctrP25 %f, viewsP25 %i)', (ctrP25, viewsP25) => {
    expect(coachFix(funnel, { ctrSimilar: 0.042, ctrP25, viewsP25 })).toEqual({
      fix: 'changeMainPhoto',
      ctrDisplay: '1.6%',
      similarDisplay: '4.2%',
    });
  });

  it('the result never names the trigger', () => {
    const r = coachFix(funnel, { ctrSimilar: 0.042, ctrP25: 0.042, viewsP25: 0 });
    expect(Object.keys(r ?? {})).toEqual(['fix', 'ctrDisplay', 'similarDisplay']);
  });
});
