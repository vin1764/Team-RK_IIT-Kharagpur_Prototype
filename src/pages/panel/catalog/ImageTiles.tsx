// Product image tiles with a remove (x) badge, plus the dashed "Add Product" tile that opens a
// file picker. Picked files become object URLs in the browser; nothing is uploaded.
import { useRef, type ReactNode } from 'react';
import { nextImageId, type DraftImage } from './draftStore';

export const MAX_PRODUCTS = 9;

/** Turns picked files into draft images, keeping at most `max` in total. */
export function filesToImages(files: FileList | null, existing: DraftImage[], max = MAX_PRODUCTS): DraftImage[] {
  const room = Math.max(0, max - existing.length);
  const picked = Array.from(files ?? [])
    .filter((f) => f.type.startsWith('image/'))
    .slice(0, room)
    .map((f) => ({ id: nextImageId(), url: URL.createObjectURL(f), name: f.name }));
  return [...existing, ...picked];
}

export function removeImage(list: DraftImage[], id: string) {
  const gone = list.find((i) => i.id === id);
  if (gone?.url.startsWith('blob:')) URL.revokeObjectURL(gone.url);
  return list.filter((i) => i.id !== id);
}

/** Hidden <input type=file> + a function that opens it. */
export function useFilePicker(onFiles: (f: FileList | null) => void, accept = 'image/*', multiple = true) {
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      className="hidden"
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={(e) => {
        onFiles(e.target.files);
        e.target.value = '';
      }}
    />
  );
  return { input, open: () => ref.current?.click() };
}

export function ImageTiles({
  images,
  onChange,
  addLabel,
  tile = 'size-20',
  max = MAX_PRODUCTS,
  caption,
}: {
  images: DraftImage[];
  onChange: (imgs: DraftImage[]) => void;
  addLabel: ReactNode;
  tile?: string;
  /** Most tiles allowed (9 products; 5 photos in "Create from photos"). */
  max?: number;
  /** Optional caption under a tile (bot mode: "Cover" under the first photo). */
  caption?: (index: number) => ReactNode;
}) {
  const picker = useFilePicker((files) => onChange(filesToImages(files, images, max)));
  return (
    <div className="flex flex-wrap gap-4">
      {images.map((img, i) => (
        <div key={img.id} className={`relative ${tile} shrink-0`}>
          <img src={img.url} alt={img.name} className="block size-full rounded-sm object-cover" />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onChange(removeImage(images, img.id))}
            className="absolute -top-2 -right-2.5 flex size-5.5 cursor-pointer items-center justify-center rounded-full border border-solid border-white bg-tertiary-text p-0"
          >
            <img src="/brand/msa/merlin/lined/cross-white.svg" alt="" width="14" height="14" className="block size-3.5" />
          </button>
          {caption?.(i)}
        </div>
      ))}
      {images.length < max && (
        <button
          type="button"
          onClick={picker.open}
          className={`${tile} flex shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-sm border border-dashed border-brand-secondary-border bg-secondary-bg p-0 font-body text-lg leading-5 text-brand-primary-text`}
        >
          <img src="/brand/msa/merlin/filled/add-blue.svg" alt="" width="24" height="24" className="block size-6" />
          {addLabel}
        </button>
      )}
      {picker.input}
    </div>
  );
}
