// Showcase frame geometry: the prototype renders in a fixed 1366×768 CSS-px iframe (a laptop
// viewport, so the panel lays out as it does on a real laptop) scaled by k to fit the stage.

export const FRAME_W = 1366;
export const FRAME_H = 768;

/** The laptop drawn around the screen (CSS px, unscaled). Keep in sync with showcase.css. */
export const CHROME = {
  /** stage padding around the laptop */
  pad: 10,
  /** bezel: left/right, top (camera), bottom */
  side: 8,
  top: 16,
  bottom: 9,
  /** hinge/base bar under the bezel, and how far it sticks out on each side */
  base: 12,
  overhang: 12,
} as const;

export type Chrome = typeof CHROME;

/** Laptop outer size for a scale k (screen + bezel + base). */
export function laptopSize(k: number, c: Chrome = CHROME) {
  return {
    w: Math.round(FRAME_W * k) + 2 * c.side + 2 * c.overhang,
    h: Math.round(FRAME_H * k) + c.top + c.bottom + c.base,
  };
}

/**
 * "Fit": the largest k (≤ 1) at which screen + laptop chrome fit the stage, keeping the 1366:768
 * aspect. Returns at least `min` so a tiny stage never collapses the frame to nothing.
 */
export function fitScale(stageW: number, stageH: number, c: Chrome = CHROME, min = 0.2): number {
  if (!(stageW > 0) || !(stageH > 0)) return min;
  const w = stageW - 2 * c.pad - 2 * c.side - 2 * c.overhang;
  const h = stageH - 2 * c.pad - c.top - c.bottom - c.base;
  const k = Math.min(w / FRAME_W, h / FRAME_H, 1);
  return Math.max(min, Math.floor(k * 1000) / 1000);
}
