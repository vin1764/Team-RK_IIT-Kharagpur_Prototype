// The draft catalog that travels from the category step to the details step.
// Phase 3 ("Create from photos") pre-fills `values` and marks the keys it filled in `botFilled`.
import { create } from 'zustand';

export interface DraftImage {
  id: string;
  /** Object URL for a picked file, or a /brand/... path for the demo sample. Nothing is uploaded. */
  url: string;
  name: string;
}

/** Price-table row, one per selected size. */
export interface PriceRow {
  meeshoPrice: string;
  wdrp: string;
  mrp: string;
  inventory: string;
  sku: string;
}
export const EMPTY_PRICE_ROW: PriceRow = { meeshoPrice: '', wdrp: '', mrp: '', inventory: '', sku: '' };

interface DraftState {
  categoryPath: string[];
  images: DraftImage[];
  /** Field values keyed by FieldDef.id (see fields.ts). */
  values: Record<string, string>;
  /** Price rows keyed by size. */
  prices: Record<string, PriceRow>;
  /** Field ids pre-filled by the bot (Phase 3); empty in Phase 1. */
  botFilled: string[];
  setCategoryPath: (p: string[]) => void;
  setImages: (imgs: DraftImage[]) => void;
  setValue: (id: string, v: string) => void;
  setValues: (v: Record<string, string>) => void;
  setPrice: (size: string, row: Partial<PriceRow>) => void;
  reset: () => void;
}

const INITIAL = { categoryPath: [] as string[], images: [] as DraftImage[], values: {}, prices: {}, botFilled: [] as string[] };

let seq = 0;
/** Deterministic ids (no Math.random / Date.now). */
export const nextImageId = () => `img-${++seq}`;

/** The team's own product photo, offered as the first image so the demo needs no file at hand. */
export const DEMO_IMAGE: DraftImage = { id: 'demo-1', url: '/brand/local/catalog/demo-product-bottle.jpg', name: 'Product 1' };

export const useDraft = create<DraftState>((set) => ({
  ...INITIAL,
  setCategoryPath: (categoryPath) => set({ categoryPath }),
  setImages: (images) => set({ images }),
  setValue: (id, v) => set((s) => ({ values: { ...s.values, [id]: v } })),
  setValues: (v) => set((s) => ({ values: { ...s.values, ...v } })),
  setPrice: (size, row) => set((s) => ({ prices: { ...s.prices, [size]: { ...EMPTY_PRICE_ROW, ...s.prices[size], ...row } } })),
  reset: () => {
    useDraft.getState().images.forEach((i) => i.url.startsWith('blob:') && URL.revokeObjectURL(i.url));
    set({ ...INITIAL });
  },
}));
