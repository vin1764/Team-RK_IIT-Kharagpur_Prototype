// Add Single Catalog · step 1 "Select Category".
// Replica of reference/html/meesho-catalog-add-single-category.html + catalog-select-category*.png.
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../../app/paths';
import { CatalogHeader, DiscardBar, NeedHelp, SingleStepper } from './catalog/CatalogHeader';
import { isLeafPath } from './catalog/categories';
import { CategoryPreview } from './catalog/CategoryPreview';
import { CategorySearch } from './catalog/CategorySearch';
import { CategoryTree } from './catalog/CategoryTree';
import { useDraft } from './catalog/draftStore';
import { ProductsModal } from './catalog/ProductsModal';

export default function AddSingleCategory() {
  const navigate = useNavigate();
  const { categoryPath, images, setCategoryPath, setImages, reset } = useDraft();
  const [modal, setModal] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const leaf = isLeafPath(categoryPath);

  const discard = () => {
    reset();
    navigate(paths.catalogUploadsBulk);
  };

  return (
    <main data-show-sidebar="false" className="grow min-h-screen layout-main-dt-responsive">
      <div className="relative max-w-304 min-h-full mx-auto" id="mainWrapper">
        <div data-testid="singleCatalogCategory">
          <CatalogHeader title="Add Single Catalog" helper="Learn to upload single catalog?" onBack={() => navigate(paths.catalogUploadsBulk)} />
          <div className="flex items-center justify-between bg-white">
            <SingleStepper step={1} />
            <NeedHelp />
          </div>
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
