// Add Single Catalog · step 2 "Add Product Details" (no snapshot: built from
// catalog-product-details-1/2/3.png, catalog-other-attributes.png, catalog-price-table*.png).
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { paths } from '../../app/paths';
import { toast } from '../../components/Toast';
import { CatalogHeader, NeedHelp, SingleStepper } from './catalog/CatalogHeader';
import { DetailsForm, type FormState } from './catalog/DetailsForm';
import { DetailsRail } from './catalog/DetailsRail';
import { useDraft } from './catalog/draftStore';
import { missingFields, PACKER_FROM_MANUFACTURER } from './catalog/fields';
import { Checkbox } from './catalog/FormBits';
import { filesToImages, useFilePicker } from './catalog/ImageTiles';
import { missingPrices } from './catalog/pricing';
import { PriceTable } from './catalog/PriceTable';

const LEGAL =
  'By listing your products on Meesho’s platform, you agree to comply with the applicable T&C of the platform, as updated from time to time. You confirm that all product information, including labels, claims, and disclosures etc., complies with the Legal Metrology Act, 2009, Bureau of Indian Standards Act, 2016 read with applicable Quality Control Orders, and all other applicable laws, rules and regulations. You also confirm that you are authorized to list and sell your products and hold all necessary licenses, registrations, and permits as required under applicable law, that each product listed falls within the scope of such licenses and registrations, and that you will keep them valid for the entire period your products remain listed, renewing them before expiry. If any such license, registration, or permit expires, is not renewed, or is suspended or cancelled, you will promptly inform Meesho and take down the affected listings. You are solely responsible for the accuracy and completeness of all information you provide in respect of your listings. You accept full responsibility for your listings, and Meesho bears no liability for any of your acts or omissions.';

function ProductStrip({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const { images, setImages } = useDraft();
  const picker = useFilePicker((files) => setImages(filesToImages(files, images)));
  return (
    <div className="flex items-start gap-7 bg-white px-6 pb-4.5">
      <div className="flex max-w-[calc(100%-12rem)] gap-2 overflow-x-auto">
        {images.map((img, i) => {
          const on = img.id === selected;
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelect(img.id)}
              className={`flex w-38.75 shrink-0 cursor-pointer items-center gap-3 rounded-t-lg border border-solid border-b-4 p-3 pb-2 font-body text-lg leading-5 text-brand-primary-text ${
                on ? 'border-brand-secondary-bg border-b-brand-primary-bg bg-secondary-bg' : 'border-transparent bg-white'
              }`}
            >
              <img src={img.url} alt="" className="block size-12 shrink-0 rounded-lg object-cover" />
              Product {i + 1}
            </button>
          );
        })}
      </div>
      {images.length < 9 && (
        <button type="button" onClick={picker.open} className="mt-6.5 flex cursor-pointer items-center gap-3.5 border-0 bg-transparent p-0 font-body text-lg leading-5 text-brand-primary-text">
          <span className="flex size-10 items-center justify-center rounded-sm border border-dashed border-brand-secondary-border bg-secondary-bg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12.75 5.5a.75.75 0 00-1.5 0v5.75H5.5a.75.75 0 000 1.5h5.75v5.75a.75.75 0 001.5 0v-5.75h5.75a.75.75 0 000-1.5h-5.75V5.5z" fill="#3C29B7" />
            </svg>
          </span>
          Add Product
        </button>
      )}
      {picker.input}
    </div>
  );
}

export default function AddSingleDetails() {
  const navigate = useNavigate();
  const d = useDraft();
  const [selected, setSelected] = useState(d.images[0]?.id ?? '');
  const [copyAll, setCopyAll] = useState(true);
  const [copyPrices, setCopyPrices] = useState(true);
  const [sameAsMfr, setSameAsMfr] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const leaving = useRef(false);
  useEffect(() => window.scrollTo(0, 0), []);

  // The details step needs the images picked on step 1.
  if (!d.images.length) return leaving.current ? null : <Navigate to={paths.addSingleCategory} replace />;

  const values = d.values;
  const sizes = values.size ? [values.size] : [];
  const missing = new Set(missingFields(values));
  const priceMissing = sizes.some((s) => missingPrices(d.prices[s]).length > 0);

  const setValue = (id: string, v: string) => {
    d.setValue(id, v);
    // "Same as Manufacturer Details" keeps the packer fields in step with the manufacturer ones.
    if (sameAsMfr) {
      const target = Object.entries(PACKER_FROM_MANUFACTURER).find(([, m]) => m === id)?.[0];
      if (target) d.setValue(target, v);
    }
  };
  const form: FormState = {
    values,
    setValue,
    errors: submitted ? missing : new Set(),
    sameAsManufacturer: sameAsMfr,
    setSameAsManufacturer: (on) => {
      setSameAsMfr(on);
      if (on) d.setValues(Object.fromEntries(Object.entries(PACKER_FROM_MANUFACTURER).map(([p, m]) => [p, values[m] ?? ''])));
    },
  };

  // Leaving clears the draft; the flag stops the "no images → back to step 1" guard from redirecting
  // while the (transitioned) navigation is still pending.
  const leave = (to: string) => {
    leaving.current = true;
    navigate(to);
    d.reset();
  };

  const submit = () => {
    setSubmitted(true);
    if (missing.size || priceMissing) {
      const first = [...missing][0];
      document.querySelector(first ? `[data-field="${first}"]` : '[data-testid="priceTable"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    toast('Catalog submitted for QC');
    leave(paths.catalogUploadsSingle);
  };

  const front = d.images.find((i) => i.id === selected) ?? d.images[0];

  return (
    <main data-show-sidebar="false" className="grow min-h-screen layout-main-dt-responsive">
      <div className="relative max-w-304 min-h-full mx-auto" id="mainWrapper">
        <CatalogHeader title="Add Single Catalog" helper="Learn to upload single catalog?" onBack={() => navigate(paths.addSingleCategory)} />
        <div className="flex items-center justify-between bg-white">
          <SingleStepper step={2} />
          <NeedHelp />
        </div>
        <ProductStrip selected={front?.id ?? ''} onSelect={setSelected} />

        <div className="mt-2.5 flex items-start gap-2">
          <div className="min-w-0 flex-1 rounded bg-white p-6" data-testid="addProductDetails">
            <h2 className="m-0 font-heading text-2xl leading-6 text-black">Add Product Details</h2>
            <div className="mt-4 rounded-sm bg-secondary-bg py-3 pr-5 pl-5">
              <Checkbox
                checked={copyAll}
                onChange={setCopyAll}
                label={
                  <span className="ml-4 block">
                    <span className="block font-body text-xl leading-5 text-secondary-text">Copy input details to all product</span>
                    <span className="block font-body text-lg leading-5 tracking-[-0.1px] text-secondary-text xl:whitespace-nowrap">
                      If you want to change specific fields for particular product like Color, Fabric etc, you can change it by selecting that product.
                    </span>
                  </span>
                }
              />
            </div>
            <DetailsForm
              form={form}
              afterSection={{
                inventory: sizes.length > 0 && (
                  <div className="mb-8.5">
                    <Checkbox
                      checked={copyPrices}
                      onChange={setCopyPrices}
                      label={<span className="ml-6.5 font-body text-xl leading-5 text-primary-text">Copy price details to all sizes</span>}
                    />
                    <PriceTable sizes={sizes} prices={d.prices} onChange={d.setPrice} showErrors={submitted} />
                  </div>
                ),
              }}
            />
            <p className="m-0 mt-1 border-0 border-t border-solid border-secondary-bg pt-4 font-body text-base leading-4 text-secondary-border">{LEGAL}</p>
          </div>
          <div className="w-95 shrink-0">
            <DetailsRail
              front={front}
              extras={front ? d.extraImages[front.id] ?? [] : []}
              onChangeFront={(img) => d.setImages(d.images.map((i) => (i.id === img.id ? img : i)))}
              onChangeExtras={(imgs) => front && d.setExtraImages(front.id, imgs)}
            />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between bg-white px-6 py-3 shadow-[0_-4px_12px_0_rgba(0,0,0,0.06)]" data-testid="detailsFooter">
          <button
            type="button"
            onClick={() => leave(paths.catalogUploadsBulk)}
            className="inline-flex h-9 cursor-pointer items-center rounded-sm border border-solid border-primary-text bg-white px-4 font-button text-xl text-primary-text active:scale-90 transition-all"
          >
            Discard Catalog
          </button>
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => {
                toast('Catalog saved as draft');
                navigate(paths.addSingleCategory);
              }}
              className="inline-flex h-9 cursor-pointer items-center rounded-sm border border-solid border-brand-primary-bg bg-white px-4 font-button text-xl text-brand-primary-text active:scale-90 transition-all"
            >
              Save and Go Back
            </button>
            <button type="button" onClick={submit} className="inline-flex h-9 cursor-pointer items-center rounded-sm border-none bg-brand-primary-bg px-4 font-button text-xl text-brand-foreground-text active:scale-90 transition-all">
              Submit Catalog
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
