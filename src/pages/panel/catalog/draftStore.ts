// The draft catalog that travels from the category step to the details step.
// Phase 3 ("Create from photos") pre-fills `values` and marks the keys it filled in `botFilled`.
// The in-progress draft is kept across reloads in localStorage (DRAFT_STORAGE_KEY), minus the object URLs of
// files the maker picked (they die with the page); the bundled demo photo paths are kept.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DRAFT_STORAGE_KEY, safeJSONStorage } from '../../../store/catalog';

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
  /** Extra (non-front) images per product id, added from "Uploaded Images". */
  extraImages: Record<string, DraftImage[]>;
  /** Field ids pre-filled by the bot ("Create from photos", LB-4); empty in the plain flow. A maker edit removes the id. */
  botFilled: string[];
  /** Bot mode: the 1-5 photos of the one product (cover first), before they become the product's images. */
  photos: DraftImage[];
  /** Bot mode: the maker confirmed the recognised category breadcrumb. */
  categoryConfirmed: boolean;
  /** Bot mode: the maker confirmed the pre-filled Net Quantity (go-live needs it). */
  netQtyConfirmed: boolean;
  /** Bot mode, Pack Point makers: units arrive in their retail pack (packer = manufacturer). */
  retailPacked: boolean;
  /** Bot mode: initial state of "Same as Manufacturer Details" (set by the packer rule). */
  sameAsManufacturer: boolean;
  setCategoryPath: (p: string[]) => void;
  setImages: (imgs: DraftImage[]) => void;
  setValue: (id: string, v: string) => void;
  setValues: (v: Record<string, string>) => void;
  setPrice: (size: string, row: Partial<PriceRow>) => void;
  setExtraImages: (productId: string, imgs: DraftImage[]) => void;
  setBot: (patch: Partial<Pick<DraftState, 'botFilled' | 'photos' | 'categoryConfirmed' | 'netQtyConfirmed' | 'retailPacked' | 'sameAsManufacturer'>>) => void;
  /** The maker edited a bot-filled field: it is no longer marked "Filled by bot". */
  unmarkBot: (id: string) => void;
  reset: () => void;
}

const INITIAL = {
  categoryPath: [] as string[],
  images: [] as DraftImage[],
  values: {} as Record<string, string>,
  prices: {} as Record<string, PriceRow>,
  extraImages: {} as Record<string, DraftImage[]>,
  botFilled: [] as string[],
  photos: [] as DraftImage[],
  categoryConfirmed: false,
  netQtyConfirmed: false,
  retailPacked: true,
  sameAsManufacturer: false,
};

let seq = 0;
/** Deterministic ids (no Math.random / Date.now). */
export const nextImageId = () => `img-${++seq}`;

/** The team's own product photo, offered as the first image so the demo needs no file at hand. */
export const DEMO_IMAGE: DraftImage = { id: 'demo-1', url: '/brand/local/catalog/demo-product-bottle.jpg', name: 'Product 1' };

type DraftData = typeof INITIAL;

/** Picked files are object URLs that don't survive a reload, so only bundled images are persisted. */
const keepable = (imgs: DraftImage[]) => imgs.filter((i) => !i.url.startsWith('blob:'));

export const useDraft = create<DraftState>()(
  persist(
    (set) => ({
      ...INITIAL,
      setCategoryPath: (categoryPath) => set({ categoryPath }),
      setImages: (images) => set({ images }),
      setValue: (id, v) => set((s) => ({ values: { ...s.values, [id]: v } })),
      setValues: (v) => set((s) => ({ values: { ...s.values, ...v } })),
      setPrice: (size, row) => set((s) => ({ prices: { ...s.prices, [size]: { ...EMPTY_PRICE_ROW, ...s.prices[size], ...row } } })),
      setExtraImages: (productId, imgs) => set((s) => ({ extraImages: { ...s.extraImages, [productId]: imgs } })),
      setBot: (patch) => set(patch),
      unmarkBot: (id) => set((s) => (s.botFilled.includes(id) ? { botFilled: s.botFilled.filter((x) => x !== id) } : {})),
      reset: () => {
        const s = useDraft.getState();
        [...s.images, ...s.photos, ...Object.values(s.extraImages).flat()].forEach((i) => i.url.startsWith('blob:') && URL.revokeObjectURL(i.url));
        set({ ...INITIAL });
      },
    }),
    {
      name: DRAFT_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<DraftData>(),
      partialize: (s): DraftData => ({
        categoryPath: s.categoryPath,
        images: keepable(s.images),
        values: s.values,
        prices: s.prices,
        extraImages: Object.fromEntries(Object.entries(s.extraImages).map(([k, v]) => [k, keepable(v)])),
        botFilled: s.botFilled,
        photos: keepable(s.photos),
        categoryConfirmed: s.categoryConfirmed,
        netQtyConfirmed: s.netQtyConfirmed,
        retailPacked: s.retailPacked,
        sameAsManufacturer: s.sameAsManufacturer,
      }),
    },
  ),
);

/** Empties the draft and removes its localStorage key ("Reset demo"). */
export function resetDraft() {
  useDraft.getState().reset();
  useDraft.persist.clearStorage();
}
