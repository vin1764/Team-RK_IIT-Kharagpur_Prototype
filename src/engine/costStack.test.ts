import { describe, expect, it } from 'vitest';
import { costStack, takeHomeAt } from './costStack';

// plan §8 costStack · §8b Break-even, Take-home, List price
describe('costStack — Jasmeet, 1 L steel bottle, self-ship', () => {
  const s = () => costStack('steel-bottle-1l', 80, 17.5, 'selfShip');

  it('fills the type fees: packaging ₹6, shipping + fixed ₹32, returns ₹8, GST ₹7', () => {
    expect(s().fees).toEqual({ packaging: 6, shippingAndFixed: 32, returnsBuffer: 8, gst: 7 });
    expect(s().feesTotal).toBe(53);
  });

  it('break-even = 80 + 6 + 32 + 8 + 7 = ₹133', () => {
    expect(s().breakEven).toBe(133);
  });

  it('take-home = 17.5% × ₹80 = ₹14', () => {
    expect(s().takeHome).toBe(14);
  });

  it('list price = ₹133 + ₹14 = ₹147', () => {
    expect(s().listPrice).toBe(147);
    expect(s().listPrice).toBe(s().breakEven + s().takeHome);
  });

  it('take-home at the list price matches the quote', () => {
    expect(takeHomeAt(147, s())).toBe(14);
  });

  it.todo('packPoint mode: needs the Pack Point cost stack (Q3)');
});
