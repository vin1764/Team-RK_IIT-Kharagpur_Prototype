import { describe, expect, it } from 'vitest';
import { backgroundMask, foregroundBox } from './cleanPhoto';

/** A w×h RGBA image filled with `bg`, with a `fg` rectangle. */
function image(w: number, h: number, bg: number[], fg: number[], r: { x: number; y: number; w: number; h: number }) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inFg = x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
      const c = inFg ? fg : bg;
      d.set([c[0]!, c[1]!, c[2]!, 255], (y * w + x) * 4);
    }
  }
  return d;
}

describe('cleanPhoto (in-browser clean of an uploaded photo)', () => {
  it('a product on a plain background: background found from the border, the product boxed', () => {
    const d = image(20, 10, [200, 160, 110], [150, 155, 160], { x: 3, y: 2, w: 6, h: 5 });
    const mask = backgroundMask(d, 20, 10);
    expect(mask[0]).toBe(1);
    expect(mask[3 * 20 + 4]).toBe(0);
    expect(foregroundBox(mask, 20, 10)).toEqual({ x: 3, y: 2, w: 6, h: 5 });
  });
  it('an all-background photo has no product box (the panel then centres the whole photo)', () => {
    const d = image(8, 8, [240, 240, 240], [240, 240, 240], { x: 0, y: 0, w: 0, h: 0 });
    expect(foregroundBox(backgroundMask(d, 8, 8), 8, 8)).toBeNull();
  });
  it('background-coloured pixels inside the product, not touching the border, stay', () => {
    const d = image(12, 12, [255, 255, 255], [90, 90, 90], { x: 2, y: 2, w: 8, h: 8 });
    // a white hole in the middle of the product
    d.set([255, 255, 255, 255], (6 * 12 + 6) * 4);
    const mask = backgroundMask(d, 12, 12);
    expect(mask[6 * 12 + 6]).toBe(0);
  });
});
