// Bulk Catalog Upload: pick a leaf category, then upload / generate / download its template.
// Replica of reference/html/meesho-catalog-bulk-category.html + bulk-upload-*.png.
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../../app/paths';
import { BulkTemplatePanel } from './catalog/BulkTemplatePanel';
import { CatalogHeader, DiscardBar, NeedHelp } from './catalog/CatalogHeader';
import { isLeafPath } from './catalog/categories';
import { CategorySearch } from './catalog/CategorySearch';
import { CategoryTree } from './catalog/CategoryTree';
import { GenerateTemplateModal } from './catalog/GenerateTemplateModal';

export default function BulkCatalogUpload() {
  const navigate = useNavigate();
  const [path, setPath] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [coach, setCoach] = useState(true);
  const search = useRef<HTMLInputElement>(null);
  const back = () => navigate(paths.catalogUploadsBulk);

  return (
    <main data-show-sidebar="false" className="grow min-h-screen layout-main-dt-responsive">
      <div className="relative max-w-304 min-h-full mx-auto" id="mainWrapper">
        <div data-testid="bulkCatalogUpload">
          <CatalogHeader title="Bulk Catalog Upload" helper="How to upload catalogs in Bulk?" onBack={back} />
          <div>
            <div className="mt-6 flex justify-between">
              <h3 className="m-0 p-0 font-heading text-2xl leading-6 text-secondary-text">Search Category</h3>
              <NeedHelp />
            </div>
            <div className="flex items-end justify-between">
              <CategorySearch ref={search} onPick={setPath} />
            </div>
            <div className="mt-4 pb-24">
              <div className="mt-6 grid grid-cols-[3fr_25.31rem]">
                <CategoryTree path={path} onChange={setPath} variant="bulk" onSearchCategory={() => search.current?.focus()} />
                {isLeafPath(path) && <BulkTemplatePanel path={path} onGenerate={() => setModal(true)} coach={coach} onCoachClose={() => setCoach(false)} />}
              </div>
            </div>
            <DiscardBar small onDiscard={back} />
          </div>
        </div>
      </div>
      {modal && <GenerateTemplateModal onClose={() => setModal(false)} />}
    </main>
  );
}
