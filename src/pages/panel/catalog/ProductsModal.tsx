// "Products in a catalog" (catalog-image-modal.png): add 1–9 front images, then Continue.
import { useState } from 'react';
import { Button } from '../../../components/ui';
import { CatalogModal, GreyButton } from './CatalogModal';
import { DEMO_IMAGE, type DraftImage } from './draftStore';
import { ImageTiles } from './ImageTiles';
import { NotAllowedList } from './NotAllowedList';

export function ProductsModal({ initial, onCancel, onContinue }: { initial: DraftImage[]; onCancel: () => void; onContinue: (imgs: DraftImage[]) => void }) {
  // Demo convenience: a fresh draft starts with the team's own product photo (as in the screenshot);
  // remove it with x and add real files with "Add Product".
  const [images, setImages] = useState<DraftImage[]>(initial.length ? initial : [DEMO_IMAGE]);
  return (
    <CatalogModal
      title="Products in a catalog"
      onClose={onCancel}
      footer={
        <>
          <GreyButton onClick={onCancel}>Cancel</GreyButton>
          <Button size="sm" disabled={!images.length} onClick={() => onContinue(images)}>
            Continue
          </Button>
        </>
      }
    >
      <div className="px-4 pt-4.5 pb-4">
        <p className="m-0 font-body text-xl leading-5 text-secondary-text">
          Please add only front image of your product. If you want to add multiple images for particular product, you can add it in next step.
        </p>
        <div className="mt-5 flex">
          <div className="w-71 shrink-0">
            <div className="flex items-center gap-2.5 rounded-lg border border-solid border-info-border bg-info-bg py-2 pr-3 pl-3">
              <img src="/brand/local/info-yellow.svg" alt="" width="24" height="24" className="size-6 shrink-0" />
              <p className="m-0 font-body text-base leading-4 text-primary-text">You can add minimum 1 and maximum 9 products to create a catalog</p>
            </div>
            <div className="mt-1 h-32 overflow-y-scroll pt-3 pl-px">
              <ImageTiles images={images} onChange={setImages} addLabel="Add Product" />
            </div>
          </div>
          <div className="ml-6 flex-1">
            <NotAllowedList layout="grid" />
          </div>
        </div>
      </div>
    </CatalogModal>
  );
}
