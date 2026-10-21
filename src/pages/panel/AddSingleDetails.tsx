// Add Single Catalog · step 2 "Add Product Details" (no snapshot: built from
// catalog-product-details-1/2/3.png, catalog-other-attributes.png, catalog-price-table*.png).
// ?mode=photos = "Create from photos" (LB-4 … LB-10): bot pre-fill per plan §7, demand card, cost inputs,
// take-home and status in the price table, and the go-live checklist instead of "Submit Catalog".
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { toast } from '../../components/Toast';
import { Banner, Button, Pill } from '../../components/ui';
import { checkListingPrice, costStack, gstAt, suggestedLot, takeHomeAt, typicalForType } from '../../engine/ui';
import { fmt, useT } from '../../i18n';
import { useCatalog } from '../../store/catalog';
import { useDemo } from '../../store/demo';
import { useOnboarding, usePersona } from '../../store/onboarding';
import {
  BOT_INPUTS,
  BOT_PRICE_FIELDS,
  BOT_QUERY,
  botTypeFor,
  countBotMandatory,
  demoValues,
  describeListing,
  goLiveChecks,
  MAKER_FIELDS,
  MANDATORY_IDS,
  numberIn,
  packerFor,
  stackMode,
} from './catalog/bot';
import { DemandCard, GoLiveBar, LotLine, StackLine, StatusChip } from './catalog/BotPrice';
import { BotStrip, type BotTab } from './catalog/BotStrip';
import { CatalogHeader, NeedHelp, SingleStepper } from './catalog/CatalogHeader';
import { DetailsForm, FieldGrid, type BotView, type FormState } from './catalog/DetailsForm';
import { DetailsRail } from './catalog/DetailsRail';
import { EMPTY_PRICE_ROW, useDraft, type PriceRow } from './catalog/draftStore';
import { FIELDS, missingFields, PACKER_FROM_MANUFACTURER, type FieldDef } from './catalog/fields';
import { Checkbox } from './catalog/FormBits';
import { filesToImages, useFilePicker } from './catalog/ImageTiles';
import { missingPrices, suggestWdrp } from './catalog/pricing';
import { PriceTable, type BotPriceView } from './catalog/PriceTable';

/** Bot inputs accept a number only (margin may have decimals). */
const cleanNumber = (id: string, v: string) => (id === 'marginPct' || id === 'makingCost' ? v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') : v.replace(/[^\d]/g, ''));
const BOT_INPUT_IDS = new Set(BOT_INPUTS.map((f) => f.id));

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
  const [params] = useSearchParams();
  const persona = usePersona();
  const fulfilmentChoice = useOnboarding((s) => s.fulfilment);
  const day = useDemo((s) => s.day);
  const personaId = useDemo((s) => s.persona);
  const t = useT();
  const type = persona.product?.type ?? null;
  // "Create from photos" needs a product type with bot data (Jasmeet); otherwise the plain flow runs.
  const bot = params.get('mode') === 'photos' && !!botTypeFor(type);
  const [selected, setSelected] = useState(d.images[0]?.id ?? '');
  const [copyAll, setCopyAll] = useState(true);
  const [copyPrices, setCopyPrices] = useState(true);
  const [sameAsMfr, setSameAsMfr] = useState(bot ? d.sameAsManufacturer : false);
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState<BotTab>('product');
  const leaving = useRef(false);
  useEffect(() => window.scrollTo(0, 0), []);

  const values = d.values;
  const sizes = values.size ? [values.size] : [];
  const size = sizes[0];
  const row: PriceRow = (size && d.prices[size]) || EMPTY_PRICE_ROW;
  const filled = new Set(d.botFilled);

  // ── Bot: cost stack from the maker's making cost and margin (engine), then price, take-home, status ──
  const mode = stackMode(fulfilmentChoice, persona);
  const makingCost = numberIn(values.makingCost);
  const margin = numberIn(values.marginPct);
  const stack = bot && type && makingCost !== null && makingCost > 0 && margin !== null && margin >= 0 ? costStack(type, makingCost, margin, mode) : null;
  const price = numberIn(row.meeshoPrice);
  const status = stack && type && price ? checkListingPrice(type, price, stack.breakEven) : null;
  const inventory = numberIn(row.inventory);
  const lot = bot && type ? suggestedLot(type, makingCost ?? 0) : null;
  const typical = bot && type ? typicalForType(type) : null;

  // Bot-owned cells follow the inputs until the maker edits them.
  useEffect(() => {
    if (!bot || !size) return;
    const patch: Partial<PriceRow> = {};
    if (filled.has('meeshoPrice')) {
      const v = stack ? String(stack.listPrice) : '';
      if (row.meeshoPrice !== v) patch.meeshoPrice = v;
    }
    const p = Number(patch.meeshoPrice ?? row.meeshoPrice);
    if (filled.has('wdrp')) {
      const v = p ? String(suggestWdrp(p)) : '';
      if (row.wdrp !== v) patch.wdrp = v;
    }
    if (Object.keys(patch).length) d.setPrice(size, patch);
  }, [bot, size, stack?.listPrice, row.meeshoPrice, row.wdrp, d.botFilled]); // eslint-disable-line react-hooks/exhaustive-deps
  // The description is regenerated from the filled attributes while it is still the bot's.
  useEffect(() => {
    if (!bot || !filled.has('description')) return;
    const desc = describeListing(values);
    if (values.description !== desc) d.setValue('description', desc);
  }, [bot, values, d.botFilled]); // eslint-disable-line react-hooks/exhaustive-deps

  // The details step needs the images picked on step 1.
  if (!d.images.length) return leaving.current ? null : <Navigate to={bot ? `${paths.addSingleCategory}?${BOT_QUERY}` : paths.addSingleCategory} replace />;

  const missing = new Set(missingFields(values));
  const priceMissing = sizes.some((s) => missingPrices(d.prices[s]).length > 0);

  const setValue = (id: string, raw: string) => {
    const v = bot && BOT_INPUT_IDS.has(id) ? cleanNumber(id, raw) : raw;
    d.setValue(id, v);
    if (bot) {
      d.unmarkBot(id); // edited by the maker: no longer "Filled by bot"
      if (id === 'netQuantity') d.setBot({ netQtyConfirmed: false });
    }
    // "Same as Manufacturer Details" keeps the packer fields in step with the manufacturer ones.
    if (sameAsMfr) {
      const target = Object.entries(PACKER_FROM_MANUFACTURER).find(([, m]) => m === id)?.[0];
      if (target) d.setValue(target, v);
    }
  };

  // ── Bot view of the form (labels, tags, unit pickers, extras) ──
  const youEnter = new Set<string>(MAKER_FIELDS);
  const view = (f: FieldDef): FieldDef => {
    const label = t(`field.${f.id}`);
    const info = f.id === 'minRun' ? t('tip.minRun') : f.id === 'leadTimeDays' ? t('tip.leadTimeDays') : f.info;
    const placeholder =
      f.id === 'makingCost'
        ? t('placeholder.makingCost')
        : f.id === 'marginPct'
          ? t('placeholder.marginPct')
          : f.id === 'minRun'
            ? typical ? fmt(typical.minRun) : undefined
            : f.id === 'leadTimeDays'
              ? typical ? fmt(typical.leadTimeDays) : undefined
              : f.kind === 'select'
                ? t('placeholder.select')
                : t('placeholder.enter', { label });
    return { ...f, label, info, placeholder };
  };
  const sectionCount = (id: string) =>
    FIELDS.filter((f) => f.section === id && filled.has(f.id)).length + (id === 'inventory' ? BOT_PRICE_FIELDS.filter((k) => filled.has(k)).length : 0);
  const retailToggle = (on: boolean) => {
    d.setBot({ retailPacked: on });
    const p = packerFor(mode, on, persona);
    setSameAsMfr(p.sameAsManufacturer);
    d.setValues(p.values);
  };
  const botView: BotView | undefined = bot
    ? {
        view,
        filled,
        youEnter,
        tagBot: t('bot.tag.bot'),
        tagYou: t('bot.tag.you'),
        sameAsManufacturerLabel: t('field.sameAsManufacturer'),
        sectionTitle: (id) => t(`section.${id}`),
        sectionRight: (id) => {
          const n = sectionCount(id);
          return n > 0 ? (
            <span data-c2m="LB-4" data-testid={`aiFilled-${id}`}>
              <Pill tone="brand" bordered className="px-3 text-base">
                {n === 1 ? t('bot.aiFilledOne') : t('bot.aiFilled', { n })}
              </Pill>
            </span>
          ) : null;
        },
        extra: (id) => {
          if (id === 'netQuantity')
            return (
              <div data-c2m="LB-4" data-testid="netQtyConfirm">
                <Checkbox
                  className="mt-3"
                  checked={d.netQtyConfirmed}
                  onChange={(v) => d.setBot({ netQtyConfirmed: v })}
                  label={<span className="ml-2.5 font-body text-lg leading-5 text-secondary-text">{t('bot.netQty.confirm')}</span>}
                />
              </div>
            );
          if (id === 'packerName' && mode === 'packPoint')
            return (
              <div data-c2m="LB-4">
                <Checkbox
                  className="mt-3"
                  checked={d.retailPacked}
                  onChange={retailToggle}
                  label={<span className="ml-2.5 font-body text-lg leading-5 text-secondary-text">{t('bot.retailPacked')}</span>}
                />
              </div>
            );
          return null;
        },
      }
    : undefined;

  const form: FormState = {
    values,
    setValue,
    errors: submitted ? missing : new Set(),
    sameAsManufacturer: sameAsMfr,
    setSameAsManufacturer: (on) => {
      setSameAsMfr(on);
      if (on) d.setValues(Object.fromEntries(Object.entries(PACKER_FROM_MANUFACTURER).map(([p, m]) => [p, values[m] ?? ''])));
    },
    bot: botView,
  };

  const setPrice = (s: string, patch: Partial<PriceRow>) => {
    d.setPrice(s, patch);
    if (bot) Object.keys(patch).forEach((k) => d.unmarkBot(k));
  };
  const botPrice: BotPriceView | undefined = bot
    ? {
        label: (k, fallback) => {
          const v = t(`col.${k}`);
          return v === `col.${k}` ? fallback : v;
        },
        info: (c) => (c.key === 'meeshoPrice' ? t('tip.meeshoPrice') : c.info),
        makingCost: makingCost ? `₹${fmt(makingCost)}` : <span className="text-tertiary-text">—</span>,
        takeHome: (r) => {
          const p = numberIn(r.meeshoPrice);
          return stack && p ? (
            <b className="font-button whitespace-nowrap" data-testid="takeHome">
              {t('takeHome.perUnit', { v: fmt(takeHomeAt(p, stack)) })}
            </b>
          ) : (
            <span className="text-tertiary-text">—</span>
          );
        },
        status: () => <StatusChip status={status} />,
        filled,
        youEnter,
        tagBot: t('bot.tag.bot'),
        tagYou: t('bot.tag.you'),
        pricePlaceholder: t('price.auto'),
        invSuffix: t('inv.suggested'),
        wdrpSuggested: t('wdrp.suggested'),
      }
    : undefined;

  const checks = goLiveChecks({
    hasFrontImage: !!d.images[0],
    missingFields: [...missing],
    missingPrices: size ? missingPrices(d.prices[size]) : ['meeshoPrice'],
    netQtyConfirmed: d.netQtyConfirmed,
    inputs: values,
    status,
    inventory,
  });

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

  // Bot: a failing checklist pill shows what is missing.
  const show = (what: 'images' | 'details' | 'price' | 'lot') => {
    setSubmitted(true);
    const firstInput = BOT_INPUTS.find((f) => !numberIn(values[f.id]))?.id;
    const target =
      what === 'images'
        ? '[data-testid="detailsRail"]'
        : what === 'details'
          ? [...missing][0]
            ? `[data-field="${[...missing][0]}"]`
            : !d.netQtyConfirmed
              ? '[data-testid="netQtyConfirm"]'
              : firstInput
                ? `[data-field="${firstInput}"]`
                : '[data-testid="priceTable"]'
          : '[data-testid="priceTable"]';
    document.querySelector(target)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const goLive = () => {
    if (!checks.all || !stack || !type || !price || !inventory || makingCost === null || margin === null) return;
    useCatalog.getState().addListing({
      typeId: type,
      name: values.productName ?? '',
      price,
      breakEven: stack.breakEven,
      takeHome: takeHomeAt(price, stack),
      inventory,
      minRun: numberIn(values.minRun) ?? 0,
      leadTimeDays: numberIn(values.leadTimeDays) ?? 0,
      makingCost,
      marginPct: margin,
      fulfilment: mode,
      createdDay: day,
      persona: personaId,
    });
    toast(t('check.toast'));
    leave(paths.catalogUploadsSingle);
  };

  const fillDemo = () => {
    if (!type) return;
    const { mrp, ...v } = demoValues(type, persona, typical);
    d.setValues(v);
    if (mrp && size) d.setPrice(size, { mrp });
  };

  const backToStep1 = bot ? `${paths.addSingleCategory}?${BOT_QUERY}` : paths.addSingleCategory;
  const front = d.images.find((i) => i.id === selected) ?? d.images[0];

  return (
    <main data-show-sidebar="false" className="grow min-h-screen layout-main-dt-responsive">
      <div className="relative max-w-304 min-h-full mx-auto" id="mainWrapper">
        <CatalogHeader title="Add Single Catalog" helper="Learn to upload single catalog?" onBack={() => navigate(backToStep1)} />
        <div className="flex items-center justify-between bg-white">
          <SingleStepper step={2} />
          <NeedHelp />
        </div>
        {bot && (
          <BotStrip
            active={tab}
            onTab={(x) => {
              setTab(x);
              document.querySelector(`[data-bot-anchor="${x}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }}
          />
        )}
        <ProductStrip selected={front?.id ?? ''} onSelect={setSelected} />

        <div className="mt-2.5 flex items-start gap-2">
          <div className="min-w-0 flex-1 scroll-mt-24 rounded bg-white p-6" data-testid="addProductDetails" data-bot-anchor={bot ? 'product' : undefined}>
            <h2 className="m-0 font-heading text-2xl leading-6 text-black">Add Product Details</h2>
            {bot && (
              <div className="mt-4" data-c2m="LB-4" data-testid="botSummary">
                <Banner
                  tone="success"
                  action={
                    <Button variant="text" size="sm" className="shrink-0 px-0" onClick={fillDemo}>
                      {t('bot.fillDemo')}
                    </Button>
                  }
                >
                  {t('bot.summary', { bot: countBotMandatory(d.botFilled), total: MANDATORY_IDS.length, you: MAKER_FIELDS.length })}
                </Banner>
              </div>
            )}
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
                inventory: bot && type && lot ? (
                  <div className="mb-8.5">
                    <div className="scroll-mt-24" data-bot-anchor="quantity">
                      <DemandCard type={type} />
                    </div>
                    <div className="scroll-mt-24" data-bot-anchor="price" data-c2m="LB-6" data-testid="botInputs">
                      <FieldGrid fields={BOT_INPUTS} form={form} />
                    </div>
                    {sizes.length > 0 && (
                      <>
                        <Checkbox
                          checked={copyPrices}
                          onChange={setCopyPrices}
                          label={<span className="ml-6.5 font-body text-xl leading-5 text-primary-text">Copy price details to all sizes</span>}
                        />
                        <PriceTable sizes={sizes} prices={d.prices} onChange={setPrice} showErrors={submitted} bot={botPrice} />
                      </>
                    )}
                    <StackLine stack={stack} gst={stack && price ? gstAt(price, stack) : null} />
                    <LotLine lot={lot} makingCost={makingCost} inventory={inventory} minRun={numberIn(values.minRun)} />
                  </div>
                ) : (
                  sizes.length > 0 && (
                    <div className="mb-8.5">
                      <Checkbox
                        checked={copyPrices}
                        onChange={setCopyPrices}
                        label={<span className="ml-6.5 font-body text-xl leading-5 text-primary-text">Copy price details to all sizes</span>}
                      />
                      <PriceTable sizes={sizes} prices={d.prices} onChange={d.setPrice} showErrors={submitted} />
                    </div>
                  )
                ),
              }}
            />
            <p className="m-0 mt-1 border-0 border-t border-solid border-secondary-bg pt-4 font-body text-base leading-4 text-secondary-border">{LEGAL}</p>
          </div>
          <div className="w-95 shrink-0" data-testid="detailsRail">
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
          {bot ? (
            <GoLiveBar checks={checks} status={status} inventory={inventory} onGoLive={goLive} onShow={show} />
          ) : (
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
          )}
        </div>
      </div>
    </main>
  );
}
