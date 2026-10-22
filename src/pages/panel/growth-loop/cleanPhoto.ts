// "Upload another photo" on the coach's Change main photo panel: the maker's photo is cleaned the same way as the
// suggested one — background to white, product centred, filling about 80% of the frame — in the browser, with no
// network. A simple, deterministic approximation of a background remover:
//  1. draw the photo onto a canvas (longest side ≤ 640 px);
//  2. the background colour = the average of the border pixels; every pixel connected to the border whose colour is
//     within TOLERANCE of it is background (flood fill from the edges), and becomes white;
//  3. crop to what's left (the product) and centre it on a white square, its longer side at 80% of the frame.
// If nothing is left (the photo is all background), the whole photo is centred instead.

export const CLEAN_SIZE = 600;
export const FILL = 0.8;
const TOLERANCE = 48;
const MAX_SIDE = 640;

/** Pure: which pixels are background (flood fill from the border, colour within tolerance of the border average). */
export function backgroundMask(data: Uint8ClampedArray, w: number, h: number, tolerance = TOLERANCE): Uint8Array {
  const mask = new Uint8Array(w * h);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const add = (i: number) => {
    r += data[i * 4]!;
    g += data[i * 4 + 1]!;
    b += data[i * 4 + 2]!;
    n++;
  };
  for (let x = 0; x < w; x++) {
    add(x);
    add((h - 1) * w + x);
  }
  for (let y = 1; y < h - 1; y++) {
    add(y * w);
    add(y * w + w - 1);
  }
  const bg = [r / n, g / n, b / n] as const;
  const near = (i: number) => {
    const dr = data[i * 4]! - bg[0];
    const dg = data[i * 4 + 1]! - bg[1];
    const db = data[i * 4 + 2]! - bg[2];
    return dr * dr + dg * dg + db * db <= tolerance * tolerance;
  };
  const stack: number[] = [];
  const seed = (i: number) => {
    if (!mask[i] && near(i)) {
      mask[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (y > 0) seed(i - w);
    if (y < h - 1) seed(i + w);
  }
  return mask;
}

/** Pure: the bounding box of the non-background pixels, or null if there are none. */
export function foregroundBox(mask: Uint8Array, w: number, h: number): { x: number; y: number; w: number; h: number } | null {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('unreadable image'));
    img.src = src;
  });
}

/** Cleans a photo file: white background, centred, ~80% of the frame. Resolves to a JPEG data URL. */
export async function cleanPhoto(file: Blob): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const src = document.createElement('canvas');
    src.width = w;
    src.height = h;
    const sctx = src.getContext('2d', { willReadFrequently: true });
    if (!sctx) throw new Error('no canvas');
    sctx.drawImage(img, 0, 0, w, h);
    const pixels = sctx.getImageData(0, 0, w, h);
    const mask = backgroundMask(pixels.data, w, h);
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      pixels.data[i * 4] = 255;
      pixels.data[i * 4 + 1] = 255;
      pixels.data[i * 4 + 2] = 255;
    }
    sctx.putImageData(pixels, 0, 0);
    const box = foregroundBox(mask, w, h) ?? { x: 0, y: 0, w, h };
    const out = document.createElement('canvas');
    out.width = CLEAN_SIZE;
    out.height = CLEAN_SIZE;
    const octx = out.getContext('2d');
    if (!octx) throw new Error('no canvas');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, CLEAN_SIZE, CLEAN_SIZE);
    const k = (CLEAN_SIZE * FILL) / Math.max(box.w, box.h);
    const dw = box.w * k;
    const dh = box.h * k;
    octx.drawImage(src, box.x, box.y, box.w, box.h, (CLEAN_SIZE - dw) / 2, (CLEAN_SIZE - dh) / 2, dw, dh);
    return out.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
