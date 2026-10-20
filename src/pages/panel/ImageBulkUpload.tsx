// Image Bulk Upload (/cataloging/demo/images-bulk-upload), ported from
// reference/html/meesho-image-bulk-upload.html. The snapshot's hamburger button is the
// panel's own below-1280px menu (hidden max-xl:flex); PanelShell already provides it,
// so the page renders the desktop layout only. Selected images stay in the browser.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../../app/paths';

const NOT_ALLOWED = [
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

const ACCEPT = ['image/png', 'image/jpeg'];

export default function ImageBulkUpload() {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<Array<{ name: string; url: string }>>([]);

  const add = (files: FileList | null) => {
    const picked = Array.from(files ?? []).filter((f) => ACCEPT.includes(f.type));
    if (picked.length) setImages((cur) => [...cur, ...picked.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))]);
  };
  const remove = (url: string) => {
    URL.revokeObjectURL(url);
    setImages((cur) => cur.filter((i) => i.url !== url));
  };
  const latest = useRef(images);
  latest.current = images;
  useEffect(() => () => latest.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="z-2 flex items-start bg-primary-bg p-4">
        <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Image Bulk Upload</h1>
      </div>
      <div className="flex flex-col bg-primary-bg">
        <div className="h-2 bg-secondary-bg" />
        <div className="flex">
          <div className="flex flex-1 flex-col gap-4 ml-4 bg-primary-bg">
            {/* Pre-filled template banner */}
            <div className="box-content flex justify-between overflow-y-scroll [scrollbar-width:none] p-4 border border-solid border-tertiary-border rounded-lg mt-6 mr-7">
              <div className="flex gap-x-3">
                <div>
                  <img src="/brand/msa/merlin/filled/excel-upload.svg" alt="" width="24" height="24" className="h-6 w-6" />
                </div>
                <div className="flex flex-col justify-center">
                  <h2 className="m-0 p-0 text-primary-text font-bold font-heading text-3xl leading-6">Introducing pre-filled templates for faster bulk uploads</h2>
                  <p className="m-0 p-0 text-primary-text font-normal font-body text-xl leading-5">Add product front images and get prefilled catalog template</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => navigate(paths.addBulk)}
                  className="inline-flex items-center justify-center gap-1 rounded-sm font-button cursor-pointer transition-all duration-200 ease-in-out active:scale-90 bg-transparent text-brand-primary-bg border border-solid border-brand-primary-bg h-9 px-4 text-xl"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Drop zone */}
            <div className="relative w-auto bg-secondary-bg mt-2 mr-7.25 mb-6.5">
              <input ref={input} type="file" className="hidden" multiple id="imageBulkUploadGetFile" accept="image/x-png, image/jpeg" onChange={(e) => (add(e.target.files), (e.target.value = ''))} />
              <div
                className="box-content flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-brand-secondary-border bg-secondary-bg pt-10.25 px-16 pb-7"
                role="button"
                tabIndex={0}
                data-testid="imageBulkUpload"
                onClick={() => input.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  add(e.dataTransfer.files);
                }}
              >
                <img src="/brand/msa/merlin/filled/add-blue.svg" alt="" width="24" height="24" className="h-7.5 w-7.5" />
                <h3 className="m-0 p-0 font-bold font-heading text-2xl leading-6 mt-1.25 mb-1 text-brand-primary-text">Add Images</h3>
                <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text">You can drop images here</p>
              </div>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 bg-primary-bg pt-4">
                  {images.map((img) => (
                    <div key={img.url} className="relative size-20 rounded-sm border border-solid border-tertiary-border bg-white">
                      <img src={img.url} alt={img.name} title={img.name} className="size-full rounded-sm object-cover" />
                      <button
                        type="button"
                        aria-label={`Remove ${img.name}`}
                        onClick={() => remove(img.url)}
                        className="absolute -right-2 -top-2 flex size-5 cursor-pointer items-center justify-center rounded-full border border-solid border-tertiary-border bg-white p-0"
                      >
                        <img src="/brand/msa/merlin/lined/cross-grey.svg" alt="" width="12" height="12" className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Image types which are not allowed */}
          <div className="flex shrink-0 flex-col border-0 border-l border-solid border-tertiary-border mt-6 pr-6 pb-5 pl-7 bg-primary-bg" data-testid="invalid-images">
            <p className="m-0 p-0 font-normal font-body leading-5 mb-4 flex w-max items-center justify-center gap-1.5 text-[0.875rem] text-error-text">
              <img src="/brand/ms/supplier-new/invalid-icon-red.svg" alt="" className="mr-1.5 block" />
              Image types which are not allowed:
            </p>
            <div className="gap-4 overflow-x-auto scroll-smooth whitespace-nowrap">
              {NOT_ALLOWED.map((label, i) => (
                <div key={label} className="mb-4 flex items-center">
                  <img src={`/brand/ms/supplier-new/invalid-image-${i + 1}.png`} alt={label} width="56" height="56" className="mr-3 h-14 w-14 block shrink-0" />
                  <div className="flex flex-col justify-center">
                    <span className="m-0 p-0 font-semibold font-button text-lg leading-5 text-black">{label}</span>
                    <span className="m-0 p-0 font-semibold text-tertiary-text font-button text-sm mt-1 flex items-center leading-3.5">
                      <img src="/brand/ms/supplier-new/invalid-icon-gray.svg" alt="" className="mr-1.5 block shrink-0" />
                      NOT ALLOWED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
