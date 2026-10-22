// "Create from photos" (LB-3/LB-4): photos in. The first time, the bot pre-fills the whole draft; later (photos
// edited) only the images change. Used by the photo modal (AddSingleCategory) and the showcase frame's prep.
import type { ProductTypeId } from '../../../engine/ui';
import type { PersonaRecord } from '../../../store/onboarding';
import { botPrefill, cleanedFor, stackMode, type FulfilmentChoice } from './bot';
import { useDraft, type DraftImage } from './draftStore';

/** Applies the photos to the draft; false when there is no cover photo. */
export function applyPhotos(imgs: DraftImage[], type: ProductTypeId, persona: PersonaRecord, fulfilment: FulfilmentChoice): boolean {
  const [cover, ...rest] = imgs;
  if (!cover) return false;
  const d = useDraft.getState();
  d.setBot({ photos: imgs });
  if (!d.categoryConfirmed || !d.botFilled.length) {
    const pf = botPrefill(type, persona, stackMode(fulfilment, persona), d.retailPacked);
    d.setCategoryPath(pf.categoryPath);
    d.setValues(pf.values);
    const size = pf.values.size;
    if (size) d.setPrice(size, pf.price);
    d.setBot({ botFilled: pf.botFilled, sameAsManufacturer: pf.sameAsManufacturer, netQtyConfirmed: false, categoryConfirmed: true, botStep: 'product', botReview: null, fulfilmentOverride: null });
  }
  // The cleaned cover becomes the product's Front Image; the other photos go under "Uploaded Images".
  d.setImages([cleanedFor(cover) ?? cover]);
  d.setExtraImages(cover.id, rest);
  return true;
}
