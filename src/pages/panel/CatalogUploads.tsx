// Catalog Uploads (/cataloging/demo/catalogs/:kind, kind = bulk | single).
// Default state = reference/screens/catalog-uploads.png; ?state=qc = reference/html/meesho-catalog-uploads.html.
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { dayLabel } from '../../engine/ui';
import { tEn } from '../../i18n';
import { FIRST_ID, useListingsForPersona } from '../../store/catalog';
import { useDemo } from '../../store/demo';
import { useScriptedListing } from '../../store/timeline';
import { botTypeFor } from './catalog/bot';
import { LAUNCH } from './factory-launch/launch';
import { CATALOG_UPLOADS_DEFAULT, CATALOG_UPLOADS_SNAPSHOT, listingRows, STATUS_TABS, type StatusTabId } from './catalog-uploads/data';
import { AddCatalogActions, BannerCarousel, FilterBar, Header, MainTabs, NoResults, Overview, QcTip, SubTabs, UploadsTable } from './catalog-uploads/parts';

const NONE: ReturnType<typeof useListingsForPersona> = [];

export default function CatalogUploads() {
  const { kind: kindParam } = useParams();
  const kind = kindParam === 'single' ? 'single' : 'bulk';
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const seed = params.get('state') === 'qc' ? CATALOG_UPLOADS_SNAPSHOT : CATALOG_UPLOADS_DEFAULT;
  // Catalogs the current persona put live from photos (LB-8) join the Single Uploads list; after the listing day a
  // presenter who jumped ahead sees the scripted one (as Home does). Plain mode ("Today vs ours"): only the captured rows.
  const c2m = useDemo((s) => s.c2m);
  const day = useDemo((s) => s.day);
  const ours = useListingsForPersona();
  const scripted = useScriptedListing();
  const fallback = useMemo(
    () => (scripted?.scripted && day > LAUNCH.listingDay ? [{ ...scripted, id: String(FIRST_ID) }] : NONE),
    [scripted, day],
  );
  const listings = c2m ? (ours.length ? ours : fallback) : NONE;
  const data = useMemo(
    () => ({
      bulk: seed.bulk,
      single: [
        ...listingRows(
          listings,
          (typeId) => botTypeFor(typeId as Parameters<typeof botTypeFor>[0])?.categoryPath.at(-1) ?? typeId,
          dayLabel,
          (r) => tEn('filled.confirmedAt', { date: dayLabel(r.day), time: r.time }),
        ).reverse(),
        ...seed.single,
      ],
    }),
    [seed, listings],
  );

  const [status, setStatus] = useState<StatusTabId>('ALL');
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const all = data[kind];
  const categories = useMemo(() => [...new Set(all.map((r) => r.category))], [all]);
  const statusTabs = STATUS_TABS.map((t) => ({ id: t.id, label: t.id === 'ALL' ? t.label : `${t.label} (${all.filter(t.match).length})` }));
  const match = STATUS_TABS.find((t) => t.id === status)!.match;
  const rows = all.filter((r) => match(r) && (!category || r.category === category) && r.id.toLowerCase().includes(query.trim().toLowerCase()));

  const switchKind = (k: string) => {
    if (k === kind) return;
    setStatus('ALL');
    setCategory(null);
    setQuery('');
    navigate((k === 'single' ? paths.catalogUploadsSingle : paths.catalogUploadsBulk) + (params.toString() ? `?${params}` : ''));
  };

  return (
    <div className="merlin-border-box flex flex-col">
      <div className="flex flex-col">
        <Header />
        <BannerCarousel />
        <AddCatalogActions />
        <Overview bulk={data.bulk.length} single={data.single.length} />
      </div>
      <div className="flex min-h-200 flex-col bg-white">
        <MainTabs
          tabs={[
            { id: 'bulk', label: `Bulk Uploads (${data.bulk.length})` },
            { id: 'single', label: `Single Uploads (${data.single.length})` },
          ]}
          active={kind}
          onSelect={switchKind}
        />
        <div className="w-full h-[0.0625rem] border-0 border-b border-solid border-b-tertiary-bg" role="separator" />
        <SubTabs tabs={statusTabs} active={status} onSelect={(id) => setStatus(id as StatusTabId)} />
        <FilterBar
          categories={categories}
          category={category}
          onCategory={setCategory}
          query={query}
          onQuery={setQuery}
          placeholder={kind === 'bulk' ? 'Search By File Id' : 'Search By Catalog Id'}
        />
        <QcTip />
        {rows.length ? <UploadsTable rows={rows} kind={kind} /> : <NoResults kind={kind} />}
      </div>
    </div>
  );
}
