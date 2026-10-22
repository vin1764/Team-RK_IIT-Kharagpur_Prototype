import { describe, expect, it } from 'vitest';
import { makerProduct, SCRIPTED_FROM_DAY } from './makerProduct';

describe('the maker’s product (chosen, or scripted past onboarding)', () => {
  it('unknown on the onboarding day until the maker tells us', () => {
    expect(SCRIPTED_FROM_DAY).toBe(2);
    expect(makerProduct('jasmeet', 1, undefined)).toMatchObject({ type: null, told: false });
  });

  it('from D2 the seeded product counts (Jasmeet’s bottle, Samar’s sneakers); the reseller has none', () => {
    expect(makerProduct('jasmeet', 3, undefined)).toMatchObject({ type: 'steel-bottle-1l', told: true, source: 'scripted' });
    expect(makerProduct('samar', 50, undefined)).toMatchObject({ type: 'sneakers-slip-on-men', source: 'scripted' });
    expect(makerProduct('reseller', 3, undefined)).toMatchObject({ type: null, told: false });
  });

  it('an interactive choice always wins, even a leaf with no product type', () => {
    const lunch = { categoryPath: ['Home & Kitchen', 'Kitchen & Dining', 'Kitchen Storage', 'Lunch Boxes'], type: null, via: 'category' as const };
    expect(makerProduct('jasmeet', 1, lunch)).toMatchObject({ type: null, told: true, source: 'chosen' });
    expect(makerProduct('jasmeet', 23, lunch).type).toBeNull();
  });
});
