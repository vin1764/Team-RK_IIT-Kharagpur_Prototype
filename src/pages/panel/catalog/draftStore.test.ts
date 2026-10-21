import { describe, expect, it } from 'vitest';
import { sanitizeDraft } from './draftStore';

describe('sanitizeDraft — old or malformed saved drafts never crash a screen', () => {
  it('keeps well-formed fields', () => {
    const d = sanitizeDraft({ images: [{ id: 'demo-1', url: '/a.jpg', name: 'P' }], values: { size: 'Free Size' }, botStep: 'price', netQtyConfirmed: true });
    expect(d.images).toHaveLength(1);
    expect(d.values).toEqual({ size: 'Free Size' });
    expect(d.botStep).toBe('price');
    expect(d.netQtyConfirmed).toBe(true);
  });
  it('drops wrong shapes', () => {
    const d = sanitizeDraft({ images: 'x', values: ['a'], prices: { 'Free Size': 5, M: { mrp: 299, meeshoPrice: '147' } }, botFilled: { a: 1 }, botStep: 'details', photos: [{ url: 'blob:x', id: '1' }] });
    expect(d.images).toEqual([]);
    expect(d.values).toEqual({});
    expect(d.prices).toEqual({ M: { meeshoPrice: '147', wdrp: '', mrp: '', inventory: '', sku: '' } });
    expect(d.botFilled).toEqual([]);
    expect(d.botStep).toBe('product');
    expect(d.photos).toEqual([]);
  });
  it('null or junk → nothing kept', () => {
    expect(sanitizeDraft(null)).toEqual({});
    expect(sanitizeDraft('junk')).toEqual({});
  });
});
