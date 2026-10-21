import { describe, expect, it } from 'vitest';
import launch from '../data/launch.json';
import { launchProgress, trailingRunRate } from './launch';

const daily = launch.dailyOrders;
const lot = launch.commit.jasmeet.units; // 150

// Team Phase 4 answers (Q2, Q12)
describe('launchProgress — Jasmeet, lot 150', () => {
  it('D23: 11 today, 33 sold, 117 left', () => {
    const p = launchProgress(daily, lot, 23);
    expect([p.today, p.soldToDate, p.left]).toEqual([11, 33, 117]);
  });
  it('end of D27: 77 sold, 73 left — the reorder point', () => {
    const p = launchProgress(daily, lot, 27);
    expect([p.soldToDate, p.left]).toEqual([77, 73]);
  });
  it('D30: 110 of 150 sold = 73% sell-through', () => {
    const p = launchProgress(daily, lot, 30);
    expect(p.soldToDate).toBe(110);
    expect(Math.round(p.sellThrough * 100)).toBe(73);
  });
  it('before the launch, nothing sold', () => {
    const p = launchProgress(daily, lot, 20);
    expect([p.today, p.soldToDate, p.left]).toEqual([null, 0, 150]);
  });
});

describe('trailingRunRate', () => {
  it('D28: D21–D27 = 77 ÷ 7 = 11 a day', () => expect(trailingRunRate(daily, 28)).toBe(11));
});
