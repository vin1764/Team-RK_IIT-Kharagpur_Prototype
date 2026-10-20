import { paths, pathOnly } from '../app/paths';

export interface SidebarLeaf {
  label: string;
  icon: string;
  to: string;
  /** extra path prefixes that keep this row active */
  match?: string[];
}
export interface SidebarGroup {
  label: string;
  icon: string;
  children: { label: string; to: string; match?: string[] }[];
  match: string[];
}
export type SidebarEntry = SidebarLeaf | SidebarGroup;
export interface SidebarSection {
  title?: string;
  items: SidebarEntry[];
}

const icon = (name: string) => `/brand/msa/merlin/filled/${name}.svg`;
const base = (p: string) => pathOnly(p);

// Order, labels and icons exactly as in reference/html (nav#app-sidebar).
export const SIDEBAR: SidebarSection[] = [
  { items: [{ label: 'Home', icon: icon('home-v2'), to: paths.home }] },
  {
    title: 'Manage Business',
    items: [
      { label: 'Orders', icon: icon('orders-v2'), to: paths.orders, match: ['/panel/v3/new/fulfillment/demo/orders'] },
      { label: 'Returns', icon: icon('return-orders-v2'), to: paths.returns, match: ['/panel/v3/new/fulfillment/demo/returns'] },
      {
        label: 'Pricing',
        icon: icon('rupee-v2'),
        match: ['/panel/v3/new/services/demo/ipp'],
        children: [
          { label: 'Manage Pricing', to: paths.managePricing, match: ['/panel/v3/new/services/demo/ipp/allproducts', '/panel/v3/new/services/demo/ipp/price-position'] },
          { label: 'Reduce RTOs & Returns', to: paths.reduceRto, match: ['/panel/v3/new/services/demo/ipp/reduce-rto-and-returns'] },
        ],
      },
      { label: 'Claims', icon: icon('rupee-wallet'), to: paths.claims },
      { label: 'Inventory', icon: icon('products-v2'), to: paths.inventory },
      {
        label: 'Catalog Uploads',
        icon: icon('upload-fill-v2'),
        to: paths.catalogUploadsBulk,
        match: ['/panel/v3/new/cataloging/demo/catalogs'],
      },
      { label: 'Image Bulk Upload', icon: icon('image-v2'), to: paths.imageBulkUpload },
      { label: 'Quality', icon: icon('product-optimiser'), to: paths.quality },
      { label: 'Payments', icon: icon('payments-v2'), to: paths.payments },
      { label: 'Warehouse', icon: icon('home-v3'), to: paths.warehouse, match: [paths.warehouse] },
    ],
  },
  {
    title: 'Boost Sales',
    items: [
      { label: 'Influencer Marketing', icon: icon('influencer-marketing'), to: paths.influencerMarketing },
      {
        label: 'Promotions',
        icon: icon('promotions-v2'),
        match: ['/panel/v3/new/promotions/demo'],
        children: [
          { label: 'Sale Opt-in', to: paths.saleOptIn, match: [base(paths.saleOptIn)] },
          { label: 'Offer Opt-in', to: paths.offerOptIn, match: [base(paths.offerOptIn)] },
        ],
      },
      { label: 'Instant Cash', icon: icon('bank-finance'), to: paths.instantCash },
    ],
  },
  {
    title: 'Performance',
    items: [{ label: 'Business Dashboard', icon: icon('business-dashboard-v2'), to: paths.businessDashboard }],
  },
];

export const isGroup = (e: SidebarEntry): e is SidebarGroup => 'children' in e;

export function matches(pathname: string, to: string, extra: string[] = []) {
  return [base(to), ...extra].some((m) => pathname === m || pathname.startsWith(m + '/'));
}
