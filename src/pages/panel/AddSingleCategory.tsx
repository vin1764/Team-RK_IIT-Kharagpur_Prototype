// Add Single Catalog · step 1 "Select Category".
// Replica of reference/html/meesho-catalog-add-single-category.html + catalog-select-category*.png.
// ?mode=photos = "Create from photos" (LB-3/LB-4): the bot recognises the category from the photos instead
// of the tree, and the maker confirms the breadcrumb.
import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { Banner } from '../../components/ui';
import { productTypeName } from '../../engine/ui';
import { useT } from '../../i18n';
import { useOnboarding, usePersona } from '../../store/onboarding';
import { BOT_QUERY, botPrefill, botTypeFor, cleanedFor, MAX_PHOTOS, stackMode } from './catalog/bot';
import { BotProduct } from './catalog/BotProduct';
import { BotStrip } from './catalog/BotStrip';
import { CatalogHeader, DiscardBar, NeedHelp, SingleStepper } from './catalog/CatalogHeader';
import { isLeafPath } from './catalog/categories';
import { CategoryPreview } from './catalog/CategoryPreview';
import { CategorySearch } from './catalog/CategorySearch';
import { CategoryTree } from './catalog/CategoryTree';
import { DEMO_IMAGE, useDraft } from './catalog/draftStore';
import { ProductsModal } from './catalog/ProductsModal';

export default function AddSingleCategory() {
  const navigate = useNavigate();
  const d = useDraft();
  const { categoryPath, images, setCategoryPath, setImages, reset } = d;
  const [params] = useSearchParams();
  const persona = usePersona();
  const fulfilment = useOnboarding((s) => s.fulfilment);
  const t = useT();
  const botMode = params.get('mode') === 'photos';
  const type = persona.product?.type ?? null;
  const botType = botMode ? botTypeFor(type) : null;
  const bot = !!botType && !!type;

  const [modal, setModal] = useState(bot && !d.photos.length);
  const search = useRef<HTMLInputElement>(null);
  const leaf = isLeafPath(categoryPath);

  const discard = () => {
    reset();
    navigate(paths.catalogUploadsBulk);
  };

  const continueToDetails = () => {
    if (!bot || !type) return;
    const mode = stackMode(fulfilment, persona);
    const pf = botPrefill(type, persona, mode, d.retailPacked);
    const [cover, ...rest] = d.photos;
    if (!cover) return;
    // The cleaned cover becomes the product's Front Image; the other photos go under "Uploaded Images".
    setImages([cleanedFor(cover) ?? cover]);
    d.setExtraImages(cover.id, rest);
    setCategoryPath(pf.categoryPath);
    d.setValues(pf.values);
    const size = pf.values.size;
    if (size) d.setPrice(size, pf.price);
    d.setBot({ botFilled: pf.botFilled, sameAsManufacturer: pf.sameAsManufacturer, netQtyConfirmed: false });
    navigate(`${paths.addSingleDetails}?${BOT_QUERY}`);
  };

  return (
    <main data-show-sidebar="false" className="grow min-h-screen layout-main-dt-responsive">
      <div className="relative max-w-304 min-h-full mx-auto" id="mainWrapper">
        <div data-testid="singleCatalogCategory">
          <CatalogHeader title="Add Single Catalog" helper="Learn to upload single catalog?" onBack={() => navigate(bot ? paths.home : paths.catalogUploadsBulk)} />
          <div className="flex items-center justify-between bg-white">
            <SingleStepper step={1} />
            <NeedHelp />
          </div>
          {botMode && <BotStrip active="product" />}
          {botMode && !bot && (
            <div className="mt-2.5" data-c2m="LB-4">
              <Banner tone="warning">
                {t('bot.noType')}. {t('bot.noType.more')}
              </Banner>
            </div>
          )}
          {bot ? (
            d.photos.length > 0 && (
              <BotProduct
                photos={d.photos}
                name={productTypeName(type)}
                categoryPath={botType.categoryPath}
                confirmed={d.categoryConfirmed}
                onConfirm={() => d.setBot({ categoryConfirmed: true })}
                onEditPhotos={() => setModal(true)}
                onChooseCategory={() => navigate(paths.addSingleCategory)}
                onContinue={continueToDetails}
              />
            )
          ) : (
            <>
              <h3 className="mt-6 mb-2 font-heading text-2xl leading-6 text-secondary-text">Search Category</h3>
              <CategorySearch ref={search} onPick={setCategoryPath} />
              <div className="mt-[29px] mb-24 grid grid-cols-[3fr_25.31rem]">
                <CategoryTree path={categoryPath} onChange={setCategoryPath} variant="single" onSearchCategory={() => search.current?.focus()} />
                {leaf && <CategoryPreview path={categoryPath} onAddImages={() => setModal(true)} />}
              </div>
            </>
          )}
          <DiscardBar onDiscard={discard} />
        </div>
      </div>
      {modal &&
        (bot ? (
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
            onCancel={() => (d.photos.length ? setModal(false) : navigate(paths.home))}
            onContinue={(imgs) => {
              // The bot "recognises" the product from the photos: the category comes from the maker's product type.
              d.setBot({ photos: imgs });
              setCategoryPath(botType.categoryPath);
              setModal(false);
            }}
          />
        ) : (
          <ProductsModal
            initial={images}
            onCancel={() => setModal(false)}
            onContinue={(imgs) => {
              setImages(imgs);
              navigate(paths.addSingleDetails);
            }}
          />
        ))}
    </main>
  );
}
