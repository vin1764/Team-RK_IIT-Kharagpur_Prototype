// Real Supplier Hub URLs (team, 21 Oct 2026), with the fake supplier code "demo".
// Paths marked "ours" weren't captured; they follow the same pattern.

export const SID = 'demo';
const P = '/panel/v3/new';

export const paths = {
  home: `${P}/growth/${SID}/home`,
  notices: `${P}/growth/${SID}/notices`, // ours
  orders: `${P}/fulfillment/${SID}/orders/pending`,
  ordersTab: (tab: string) => `${P}/fulfillment/${SID}/orders/${tab}`, // other tabs: ours
  returns: `${P}/fulfillment/${SID}/returns/overview`,
  returnsTab: (tab: string) => `${P}/fulfillment/${SID}/returns/${tab}`, // other tabs: ours
  claims: `${P}/fulfillment/${SID}/claims`,
  warehouse: `${P}/fulfillment/${SID}/warehouse`,
  managePricing: `${P}/services/${SID}/ipp/allproducts`,
  pricePosition: `${P}/services/${SID}/ipp/price-position`, // ours (C2M PI-2)
  reduceRto: `${P}/services/${SID}/ipp/reduce-rto-and-returns/discounts-applied`,
  reduceRtoAdd: `${P}/services/${SID}/ipp/reduce-rto-and-returns/add-discount`, // ours
  inventory: `${P}/services/${SID}/inventory`,
  quality: `${P}/cataloging/${SID}/product-optimiser`,
  catalogUploadsBulk: `${P}/cataloging/${SID}/catalogs/bulk`,
  catalogUploadsSingle: `${P}/cataloging/${SID}/catalogs/single`,
  addSingleCategory: `${P}/cataloging/${SID}/catalogs/single/select-category`,
  addSingleDetails: `${P}/cataloging/${SID}/catalogs/single/add-product-details`, // ours
  addBulk: `${P}/cataloging/${SID}/catalogs/bulk/add`,
  imageBulkUpload: `${P}/cataloging/${SID}/images-bulk-upload`,
  payments: `${P}/payouts/${SID}/payments`,
  influencerMarketing: `${P}/livecommerce/${SID}/influencer-marketing`,
  promotions: `${P}/promotions/${SID}/list?tab=SALE&status=UPCOMING`,
  promotionsBase: `${P}/promotions/${SID}/list`,
  factoryLaunch: `${P}/promotions/${SID}/list?tab=FACTORY_LAUNCH`,
  factoryLaunchLive: `${P}/promotions/${SID}/factory-launch/flw-1/live`, // ours (C2M LW-7)
  saleOptIn: `${P}/promotions/${SID}/sale/list?tab=SALE&status=UPCOMING`,
  saleOptInBase: `${P}/promotions/${SID}/sale/list`,
  offerOptIn: `${P}/promotions/${SID}/offer/list?tab=DEAL`,
  offerOptInBase: `${P}/promotions/${SID}/offer/list`,
  instantCash: `${P}/finance/${SID}/home`,
  businessDashboard: `${P}/insights/${SID}/business-dashboard`,
} as const;

// Onboarding (outside the panel; paths are ours — the live ones weren't captured)
export const onboarding = {
  outreach: '/outreach',
  signup: '/signup',
  signupFromOutreach: '/signup?ref=outreach',
  costCheck: '/cost-check',
  businessDetails: '/onboarding/business-details',
  pickupAddress: '/onboarding/pickup-address',
  bankDetails: '/onboarding/bank-details',
  supplierDetails: '/onboarding/supplier-details',
} as const;

/** Path without its query string, for matching the current location. */
export const pathOnly = (p: string) => p.split('?')[0]!;
