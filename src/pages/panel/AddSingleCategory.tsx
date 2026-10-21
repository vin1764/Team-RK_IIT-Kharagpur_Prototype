// Add Single Catalog · step 1 "Select Category".
// Replica of reference/html/meesho-catalog-add-single-category.html + catalog-select-category*.png.
// ?mode=photos = "Create from photos" (LB-3/LB-4): the maker adds 3-5 photos, the bot recognises the category
// from them (no tree) and pre-fills the draft, then the three short screens open on Product (catalog/bot/BotFlow.tsx).
import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { Banner } from '../../components/ui';
import { useT } from '../../i18n';
import { useDemo } from '../../store/demo';
import { useOnboarding, usePersona } from '../../store/onboarding';
import { botTypeFor, MAX_PHOTOS } from './catalog/bot';
import { applyPhotos } from './catalog/photos';
import { BotStrip } from './catalog/BotStrip';
import { BotLayout } from './catalog/bot/BotLayout';
import { botStepUrl } from './catalog/bot/BotFlow';
import { CatalogHeader, DiscardBar, NeedHelp, SingleStepper } from './catalog/CatalogHeader';
import { isLeafPath } from './catalog/categories';
import { CategoryPreview } from './catalog/CategoryPreview';
import { CategorySearch } from './catalog/CategorySearch';
import { CategoryTree } from './catalog/CategoryTree';
import { DEMO_IMAGE, useDraft, type DraftImage } from './catalog/draftStore';
import { ProductsModal } from './catalog/ProductsModal';

export default function AddSingleCategory() {
  // "Today vs ours": plain mode is today's category step (no "Create from photos"); remount on a switch.
  const c2m = useDemo((s) => s.c2m);
  return <CategoryPage key={c2m ? 'c2m' : 'plain'} c2m={c2m} />;
}

function CategoryPage({ c2m }: { c2m: boolean }) {
  const navigate = useNavigate();
  const d = useDraft();
  const { categoryPath, images, setCategoryPath, setImages, reset } = d;
  const [params] = useSearchParams();
  const persona = usePersona();
  const fulfilment = useOnboarding((s) => s.fulfilment);
  const t = useT();
  const botMode = c2m && params.get('mode') === 'photos';
  const type = persona.product?.type ?? null;
  const botType = botMode ? botTypeFor(type) : null;
  const bot = !!botType && !!type;

  const [modal, setModal] = useState(bot);
  const search = useRef<HTMLInputElement>(null);
  const leaf = isLeafPath(categoryPath);

  const discard = () => {
    reset();
    navigate(paths.catalogUploadsBulk);
  };

  /** Photos in: the bot pre-fills the draft the first time (catalog/photos.ts), then the Product screen opens. */
  const photosIn = (imgs: DraftImage[]) => {
    if (!bot || !type) return;
    if (applyPhotos(imgs, type, persona, fulfilment)) navigate(botStepUrl('product'));
  };
  const prefilled = d.categoryConfirmed && d.images.length > 0;

  if (bot) {
    const none = { product: false, quantity: false, price: false };
    return (
      <>
        <BotLayout step="product" done={none} onBackHeader={() => navigate(paths.home)} />
        {modal && (
          <ProductsModal
            initial={d.photos.length ? d.photos : [DEMO_IMAGE]}
            photos={{
              title: t('bot.modal.title'),
              intro: t('bot.modal.intro'),
              note: t('bot.modal.note'),
              addLabel: t('bot.modal.add'),
              cancel: t('bot.modal.cancel'),
              continueLabel: t('bot.modal.continue'),
              cover: t('bot.photos.cover'),
              max: MAX_PHOTOS,
            }}
            onCancel={() => (prefilled ? navigate(botStepUrl(d.botStep)) : navigate(paths.home))}
            onContinue={photosIn}
          />
        )}
      </>
    );
  }

  return (
    <main data-show-sidebar="false" className="grow min-h-screen layout-main-dt-responsive">
      <div className="relative max-w-304 min-h-full mx-auto" id="mainWrapper">
        <div data-testid="singleCatalogCategory">
          <CatalogHeader title="Add Single Catalog" helper="Learn to upload single catalog?" onBack={() => navigate(paths.catalogUploadsBulk)} />
          <div className="flex items-center justify-between bg-white">
            <SingleStepper step={1} />
            <NeedHelp />
          </div>
          {botMode && <BotStrip active="product" />}
          {botMode && !bot && (
            <div className="mt-2.5" data-c2m="LB-4" data-c2m-id="LB-4">
              <Banner tone="warning">
                {t('bot.noType')}. {t('bot.noType.more')}
              </Banner>
            </div>
          )}
          <h3 className="mt-6 mb-2 font-heading text-2xl leading-6 text-secondary-text">Search Category</h3>
          <CategorySearch ref={search} onPick={setCategoryPath} />
          <div className="mt-[29px] mb-24 grid grid-cols-[3fr_25.31rem]">
            <CategoryTree path={categoryPath} onChange={setCategoryPath} variant="single" onSearchCategory={() => search.current?.focus()} />
            {leaf && <CategoryPreview path={categoryPath} onAddImages={() => setModal(true)} />}
          </div>
          <DiscardBar onDiscard={discard} />
        </div>
      </div>
      {modal && (
        <ProductsModal
          initial={images}
          onCancel={() => setModal(false)}
          onContinue={(imgs) => {
            setImages(imgs);
            navigate(paths.addSingleDetails);
          }}
        />
      )}
    </main>
  );
}
