// Right rail of "Add Product Details": guideline banner, image guidelines, the four required image
// kinds, and the selected product's uploaded images (catalog-product-details-1/2.png).
import { notInPrototype } from '../../../components/Toast';
import { Banner } from '../../../components/ui';
import type { DraftImage } from './draftStore';
import { filesToImages, useFilePicker } from './ImageTiles';

const RULES = ['Images with text/Watermark are not acceptable in primary images.', 'Product image should not have any text', 'Please add solo product image without any props.'];

const KINDS = [
  { title: 'Front Image', sub: 'Upload Front View Image', img: 'guide-front-image.png' },
  { title: 'Relative Size', sub: 'Upload Size Gide Image', img: 'guide-relative-size.png' },
  { title: 'Size comprehension', sub: 'Upload Size Gide Image', img: 'guide-size-comprehension.png' },
  { title: 'Uses', sub: 'User view of the product', img: 'guide-uses.png' },
];

const Star = () => <span className="ml-0.5 text-error-text">*</span>;

export function DetailsRail({
  front,
  extras,
  onChangeFront,
  onChangeExtras,
}: {
  front: DraftImage | undefined;
  extras: DraftImage[];
  onChangeFront: (img: DraftImage) => void;
  onChangeExtras: (imgs: DraftImage[]) => void;
}) {
  const change = useFilePicker((files) => {
    const [img] = filesToImages(files, [], 1);
    if (img) onChangeFront({ ...img, id: front?.id ?? img.id });
  }, 'image/*', false);
  const add = useFilePicker((files) => onChangeExtras(filesToImages(files, extras, 8)));
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded bg-white p-4">
        <Banner tone="info">
          <span className="text-base">Follow guidelines to reduce quality check failure</span>
        </Banner>
        <div className="mt-4 flex items-baseline justify-between">
          <p className="m-0 font-body text-lg leading-5 text-black">Image Guidelines</p>
          <button type="button" onClick={() => notInPrototype('View Full Image Guidelines')} className="cursor-pointer border-0 bg-transparent p-0 font-button text-lg leading-5 text-brand-primary-text">
            View Full Image Guidelines
          </button>
        </div>
        <ol className="m-0 mt-2.5 flex list-none flex-col gap-3 p-0">
          {RULES.map((r, i) => (
            <li key={r} className="flex items-start gap-3.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-secondary-bg font-body text-lg text-brand-primary-text">{i + 1}</span>
              <span className="mt-1 font-body text-lg leading-5 text-secondary-text">{r}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded bg-white p-4">
        <p className="m-0 font-button text-lg leading-5 text-primary-text">Add images with details listed here</p>
        <div className="mt-3 flex flex-col gap-3">
          {KINDS.map((k) => (
            <div key={k.title} className="flex items-center gap-2">
              <img src={`/brand/local/catalog/${k.img}`} alt="" width="54" height="54" className="box-content size-13.5 shrink-0 border border-solid border-secondary-bg object-cover" />
              <div>
                <p className="m-0 font-body text-lg leading-5 text-primary-text">
                  {k.title}
                  <Star />
                </p>
                <p className="m-0 mt-1 font-body text-sm leading-4 text-secondary-text">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="m-0 mt-6 font-button text-lg leading-5 text-primary-text">Uploaded Images</p>
        <div className="mt-4 flex flex-wrap items-start gap-2">
          {front && (
            <div className="flex w-20 flex-col items-center">
              <img src={front.url} alt={front.name} className="block size-20 object-cover" />
              <p className="m-0 mt-0.5 font-body text-lg leading-5 text-secondary-text">
                Front Image
                <Star />
              </p>
              <button type="button" onClick={change.open} className="cursor-pointer border-0 bg-transparent p-0 font-button text-sm leading-5 text-brand-primary-text">
                CHANGE
              </button>
            </div>
          )}
          {extras.map((x) => (
            <img key={x.id} src={x.url} alt={x.name} className="block size-20 object-cover" />
          ))}
          <button
            type="button"
            onClick={add.open}
            className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-solid border-brand-secondary-border bg-secondary-bg p-0 font-button text-lg leading-5 text-brand-primary-text"
          >
            <img src="/brand/msa/merlin/filled/add-blue.svg" alt="" width="24" height="24" className="block size-6" />
            Add Images
          </button>
        </div>
        {change.input}
        {add.input}
      </div>
    </div>
  );
}
