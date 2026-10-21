import { describe, expect, it } from 'vitest';
import growth from '../data/growth.json';
import { coachFix } from './coach';

// plan §8 coachFix · §8b Coach · team Q10: shown comparison 4.2%, internal trigger below 2.5%
const bands = { ctrSimilar: growth.coachBands.ctrSimilar, ctrTrigger: growth.coachBands.ctrTrigger };

describe('coachFix — lunch box funnel at D28', () => {
  const funnel = { views: 2400, clicks: 38, orders: 3 };

  it('2,400 views, 38 clicks: 1.6% vs 4.2% → change the main photo', () => {
    expect(coachFix(funnel, bands)).toEqual({ fix: 'changeMainPhoto', ctrDisplay: '1.6%', similarDisplay: '4.2%' });
  });

  it('the result never names the trigger (2.5% stays internal)', () => {
    const r = coachFix(funnel, bands);
    expect(Object.keys(r ?? {})).toEqual(['fix', 'ctrDisplay', 'similarDisplay']);
    expect(JSON.stringify(r)).not.toContain('2.5');
  });

  it('bottle at 4.0% (770 of 19,250) is above the trigger → no fix', () => {
    expect(coachFix({ views: 19250, clicks: 770, orders: 77 }, bands)).toBeNull();
  });

  it('fires only below 2.5%', () => {
    expect(coachFix({ views: 1000, clicks: 25, orders: 0 }, bands)).toBeNull();
    expect(coachFix({ views: 1000, clicks: 24, orders: 0 }, bands)).not.toBeNull();
  });
});
