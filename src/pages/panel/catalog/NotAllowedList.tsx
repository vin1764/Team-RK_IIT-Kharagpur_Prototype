// "Image types which are not allowed" — the ten examples, in the panel's order
// (reference/html/meesho-image-bulk-upload.html). Two columns in the Products modal,
// one column in the bulk "Upload product front images" modal.
export const NOT_ALLOWED = [
  'Watermark image',
  'Fake branded/1st copy',
  'Image with price',
  'Pixelated image',
  'Inverted image',
  'Blur/unclear image',
  'Incomplete image',
  'Stretched/shrunk image',
  'Image with props',
  'Image with text',
];

export function NotAllowedList({ layout, colon = false }: { layout: 'grid' | 'column'; colon?: boolean }) {
  return (
    <div>
      <p className="m-0 mb-3.5 flex items-center gap-2 font-body text-lg leading-5 text-error-text">
        <img src="/brand/ms/supplier-new/invalid-icon-red.svg" alt="" width="16" height="16" className="block size-4" />
        Image types which are not allowed{colon ? ':' : ''}
      </p>
      <div className={layout === 'grid' ? 'grid grid-cols-[11.875rem_1fr]' : 'flex flex-col'}>
        {NOT_ALLOWED.map((label, i) => (
          <div key={label} className={`flex items-center ${layout === 'grid' ? 'min-h-16 py-1' : 'mb-3'}`}>
            <img
              src={`/brand/ms/supplier-new/invalid-image-${i + 1}.png`}
              alt={label}
              width="48"
              height="48"
              className="mr-2.5 block size-12 shrink-0 rounded-sm border border-solid border-tertiary-border"
            />
            <div className="flex flex-col justify-center">
              <span className="font-body text-lg leading-5 text-secondary-text">{label}</span>
              <span className="mt-1 flex items-center font-body text-base leading-4 text-tertiary-text">
                <img src="/brand/ms/supplier-new/invalid-icon-gray.svg" alt="" width="12" height="12" className="mr-1.5 block size-3" />
                NOT ALLOWED
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
