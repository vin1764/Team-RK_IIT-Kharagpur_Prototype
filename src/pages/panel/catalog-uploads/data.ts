// Catalog Uploads seed. Two states, kept apart so the demo day can drive them later:
//  - DEFAULT: reference/screens/catalog-uploads.png (no bulk files, one single catalog in QC).
//  - SNAPSHOT (?state=qc): reference/html/meesho-catalog-uploads.html (two bulk files in QC Error).
// Every count on the page is derived from these rows. File / catalog ids are fake.

export type QcStatus = 'QC Error' | 'QC in Progress' | 'QC Pass';

export interface UploadRow {
  category: string;
  /** Bulk: template file id. Single: catalog id. */
  id: string;
  created: string;
  /** Bulk only: number of rows in the file ("--" until QC finishes). */
  rows?: string;
  status: QcStatus;
}

export interface UploadsState {
  bulk: UploadRow[];
  single: UploadRow[];
}

export const CATALOG_UPLOADS_DEFAULT: UploadsState = {
  bulk: [],
  single: [{ category: 'Water Bottles', id: '123456789', created: "20 Oct '26 | 10:15 PM", status: 'QC in Progress' }],
};

export const CATALOG_UPLOADS_SNAPSHOT: UploadsState = {
  bulk: [
    {
      category: 'Water Bottles',
      id: '1792500000002-demo-12714-43-Prefilled-Template_demo_12714-MeeshoTemplate',
      created: "20 Oct '26 | 10:27 PM",
      rows: '--',
      status: 'QC Error',
    },
    {
      category: 'Saree Pin',
      id: '1792500000001-demo-13548-25-Prefilled-Template_demo_13548-MeeshoTemplate',
      created: "20 Oct '26 | 10:23 PM",
      rows: '--',
      status: 'QC Error',
    },
  ],
  single: CATALOG_UPLOADS_DEFAULT.single,
};

export const STATUS_TABS = [
  { id: 'ALL', label: 'All', match: () => true },
  // QC Error files are the ones that need the seller's action.
  { id: 'ACTION_REQUIRED', label: 'Action Required', match: (r: UploadRow) => r.status === 'QC Error' },
  { id: 'QC_IN_PROGRESS', label: 'QC in Progress', match: (r: UploadRow) => r.status === 'QC in Progress' },
  { id: 'QC_ERROR', label: 'QC Error', match: (r: UploadRow) => r.status === 'QC Error' },
  { id: 'LIVE', label: 'QC Pass', match: (r: UploadRow) => r.status === 'QC Pass' },
] as const;

export type StatusTabId = (typeof STATUS_TABS)[number]['id'];

/** Catalogs put live from "Create from photos" (LB-8), shown as Single Uploads rows. Ids are fake. */
export function listingRows(listings: { id: string; typeId: string; createdDay: number }[], categoryOf: (typeId: string) => string, dateOf: (day: number) => string): UploadRow[] {
  return listings.map((l) => ({ category: categoryOf(l.typeId), id: l.id, created: dateOf(l.createdDay), status: 'QC Pass' as const }));
}
