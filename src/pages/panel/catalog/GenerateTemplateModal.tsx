// "Upload product front images to generate template" (bulk-upload-image-modal.png).
import { useState } from 'react';
import { Button } from '../../../components/ui';
import { notInPrototype, toast } from '../../../components/Toast';
import { CatalogModal, GreyButton } from './CatalogModal';
import { DEMO_IMAGE, type DraftImage } from './draftStore';
import { ImageTiles, removeImage } from './ImageTiles';
import { NotAllowedList } from './NotAllowedList';

export function GenerateTemplateModal({ onClose }: { onClose: () => void }) {
  // Starts with the team's demo photo, as in the screenshot; real files can be added or it removed.
  const [images, setImages] = useState<DraftImage[]>([DEMO_IMAGE]);
  const close = () => {
    images.forEach((i) => removeImage(images, i.id));
    onClose();
  };
  return (
    <CatalogModal
      title={<span className="font-body text-xl text-primary-text">Upload product front images to generate template</span>}
      onClose={close}
      footer={
        <>
          <GreyButton onClick={close}>Discard</GreyButton>
          <Button
            size="sm"
            disabled={!images.length}
            onClick={() => {
              toast('Generating prefilled templates isn\'t part of this prototype');
              close();
            }}
          >
            Generate Template
          </Button>
        </>
      }
    >
      <div className="flex border-0 border-b border-solid border-tertiary-border">
        <button type="button" className="cursor-pointer border-0 border-b-2 border-solid border-brand-primary-bg bg-transparent px-4 py-3 font-button text-lg leading-5 text-brand-primary-text">
          Upload Image files
        </button>
        <button type="button" onClick={() => notInPrototype('Upload Image links')} className="cursor-pointer border-0 bg-transparent px-4 py-3 font-button text-lg leading-5 text-primary-text">
          Upload Image links
        </button>
      </div>
      <div className="flex">
        <div className="w-[27.5rem] shrink-0 py-5 pl-4">
          <div className="flex items-center gap-2.5 rounded-lg border border-solid border-info-border bg-info-bg px-3 py-2">
            <img src="/brand/local/info-yellow.svg" alt="" width="20" height="20" className="size-5 shrink-0" />
            <p className="m-0 font-body text-base leading-4 text-primary-text">
              Please provide only <b className="font-button">front image</b> for each product. Additional images can be added while updating the bulk template
            </p>
          </div>
          <div className="mt-1.5 h-36 overflow-y-scroll pt-3">
            <p className="m-0 font-button text-xl leading-5 text-secondary-text">Added Products ({images.length})</p>
            <div className="mt-3 pl-px pt-1">
              <ImageTiles
                images={images}
                onChange={setImages}
                addLabel={<span className="text-center text-base leading-4">Add Front<br />Images</span>}
              />
            </div>
          </div>
        </div>
        <div className="ml-6 max-h-[25.8rem] flex-1 overflow-y-auto border-0 border-l border-solid border-tertiary-border pt-5 pl-2.5">
          <NotAllowedList layout="column" colon />
        </div>
      </div>
    </CatalogModal>
  );
}
