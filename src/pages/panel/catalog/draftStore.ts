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
  /** Bot mode: the bot's pre-fill has run for these photos (the recognised category is accepted). */
  categoryConfirmed: boolean;
  /** Bot mode: the maker confirmed the pre-filled Net Quantity (go-live needs it). */
  netQtyConfirmed: boolean;
  /** Bot mode, Pack Point makers: units arrive in their retail pack (packer = manufacturer). */
  retailPacked: boolean;
  /** Bot mode: initial state of "Same as Manufacturer Details" (set by the packer rule). */
  sameAsManufacturer: boolean;
  /** Bot mode: the short screen the maker is on (Product → Quantity → Price), kept across reloads. */
  botStep: 'product' | 'quantity' | 'price';
  setCategoryPath: (p: string[]) => void;
  setImages: (imgs: DraftImage[]) => void;
  setValue: (id: string, v: string) => void;
  setValues: (v: Record<string, string>) => void;
  setPrice: (size: string, row: Partial<PriceRow>) => void;
  setExtraImages: (productId: string, imgs: DraftImage[]) => void;
  setBot: (patch: Partial<Pick<DraftState, 'botFilled' | 'photos' | 'categoryConfirmed' | 'netQtyConfirmed' | 'retailPacked' | 'sameAsManufacturer' | 'botStep'>>) => void;
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
  botStep: 'product' as 'product' | 'quantity' | 'price',
};

let seq = 0;
/** Deterministic ids (no Math.random / Date.now). */
export const nextImageId = () => `img-${++seq}`;

/** The team's own product photo, offered as the first image so the demo needs no file at hand. */
export const DEMO_IMAGE: DraftImage = { id: 'demo-1', url: '/brand/local/catalog/demo-product-bottle.jpg', name: 'Product 1' };

type DraftData = typeof INITIAL;

/**
 * A draft saved by an earlier version of the prototype (or edited by hand) is checked field by field when it is
 * loaded: anything of the wrong shape falls back to the empty value, so an old draft can never crash a screen.
 */
export function sanitizeDraft(raw: unknown): Partial<DraftData> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
  const strings = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : []);
  const imgs = (x: unknown): DraftImage[] =>
    Array.isArray(x)
      ? x.filter((i): i is DraftImage => isObj(i) && typeof i.id === 'string' && typeof i.url === 'string' && !i.url.startsWith('blob:')).map((i) => ({ id: i.id, url: i.url, name: typeof i.name === 'string' ? i.name : '' }))
      : [];
  const textMap = (x: unknown) => (isObj(x) ? Object.fromEntries(Object.entries(x).filter(([, v]) => typeof v === 'string')) as Record<string, string> : {});
  const prices = isObj(r.prices)
    ? Object.fromEntries(Object.entries(r.prices).filter(([, v]) => isObj(v)).map(([k, v]) => [k, { ...EMPTY_PRICE_ROW, ...textMap(v) }]))
    : {};
  const extra = isObj(r.extraImages) ? Object.fromEntries(Object.entries(r.extraImages).map(([k, v]) => [k, imgs(v)])) : {};
  const bool = (x: unknown, d: boolean) => (typeof x === 'boolean' ? x : d);
  const step = r.botStep === 'quantity' || r.botStep === 'price' ? r.botStep : 'product';
  return {
    categoryPath: strings(r.categoryPath),
    images: imgs(r.images),
    values: textMap(r.values),
    prices,
    extraImages: extra,
    botFilled: strings(r.botFilled),
    photos: imgs(r.photos),
    categoryConfirmed: bool(r.categoryConfirmed, INITIAL.categoryConfirmed),
    netQtyConfirmed: bool(r.netQtyConfirmed, INITIAL.netQtyConfirmed),
    retailPacked: bool(r.retailPacked, INITIAL.retailPacked),
    sameAsManufacturer: bool(r.sameAsManufacturer, INITIAL.sameAsManufacturer),
    botStep: step,
  };
}

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
      version: 2,
      storage: safeJSONStorage<DraftData>(),
      // v1 drafts (and anything malformed) are kept only where each field has the right shape.
      migrate: (persisted) => sanitizeDraft(persisted) as DraftData,
      merge: (persisted, current) => ({ ...current, ...sanitizeDraft(persisted) }),
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
        botStep: s.botStep,
      }),
    },
  ),
);

/**
 * Set while a showcase jump with prep is in flight (src/embed/FrameBridge.tsx): the prep clears or replaces the
 * draft before the new route is current, so the details pages' "no images → back to step 1" redirect waits instead
 * of racing the jump (their own `leaving` refs do the same for Discard and Go live).
 */
export const draftJump = { pending: false };

/** The jump landed: lift the hold and let the draft's pages re-check their redirect. */
export function endDraftJump() {
  if (!draftJump.pending) return;
  draftJump.pending = false;
  useDraft.setState({});
}

/** Empties the draft and removes its localStorage key ("Reset demo"). */
export function resetDraft() {
  useDraft.getState().reset();
  useDraft.persist.clearStorage();
}
