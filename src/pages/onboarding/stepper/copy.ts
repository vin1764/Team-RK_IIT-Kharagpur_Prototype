// C2M copy on the onboarding steps (FO-6, FO-7, FO-8). Strings quoted in the doc mock-up
// (reference/C2M-solution-doc.pdf p.12) are marked "doc"; the rest is ours (Team RK) and is
// listed in the Phase 2 report. Move to i18n/ when that folder lands.
import { GST_FACTORY_NATURE, type EligibilityCheck } from '../../../engine/ui';

export const C2M = {
  // FO-6
  businessTypeHeading: 'What’s your business type?', // doc
  businessTypeLabel: 'What’s your business type', // existing field label (onb-business-type-dropdown.png)
  select: 'Select', // Meesho's empty dropdown value
  useDemoBusinessType: 'Use demo answer', // ours (demo only; fills nothing until clicked)
  // FO-7
  checksHeading: 'Automatic checks', // doc
  sellerType: (ok: boolean) => `Seller type: ${ok ? 'manufacturer' : 'not a manufacturer'}`, // ours (prompt)
  gstNature: (values: string[]) => `GST nature of business: ${values.join(', ')}`, // doc
  udyam: (activity: string | null, number: string | null) =>
    `Udyam major activity: ${activity ?? 'not registered'}${number ? ` (${number})` : ''}`, // doc
  gstinRow: 'GSTIN: not provided (registered with Enrolment ID / UIN)', // ours
  eligible: 'Eligible for Factory Launch', // doc
  pending: 'Pending · register on Udyam (free)', // prompt
  registerUdyam: 'Register on Udyam', // ours
  notEligible: 'Not eligible for Factory Launch', // prompt
  stillSells: 'You can still sell on Meesho as today.', // doc ("still sells as today")
  why: 'Why:', // ours
  failed: (c: EligibilityCheck, udyamActivity: string | null): string =>
    ({
      gstin: 'Factory Launch needs a GSTIN; you registered with an Enrolment ID / UIN',
      sellerType: 'Your business type is not a manufacturing unit',
      gstNature: `Your GST nature of business does not include “${GST_FACTORY_NATURE}”`,
      udyam: udyamActivity ? `Your Udyam major activity is ${udyamActivity}, not Manufacturing` : 'You are not registered on Udyam yet',
    })[c], // ours
  natureRowLabel: 'Nature of Business (GST)', // prompt
  useDemoTaxId: (kind: string) => `Use demo ${kind}`, // ours (prototype helper)
  // FO-8
  shipHeading: 'How will your orders ship?', // doc
  selfShipTitle: 'Ship from my factory', // doc
  selfShipBody: 'You pack each order; dispatch in 24–48 hrs', // doc
  // FO-8 Pack Point option: generic card; fees, providers and cluster detail live in the drawer (team spec)
  packPointTitle: 'Send one lot a week to a Pack Point', // team (drawer spec)
  packPointBody: 'A partner near you stores, packs, ships and takes returns', // team (drawer spec)
  ppAvailable: 'Available near you', // team (drawer spec)
  ppOpeningSoon: 'Opening soon near you', // team (seller view: no maker counts)
  ppJoinWaitlist: 'Join the waitlist', // prompt (kept from the earlier opening-cluster card)
  ppSeeDetails: 'See details & rate cards', // team (drawer spec)
  ppUsing: (city: string) => `Pack Point · ${city}`, // ours (the one he picked in the drawer)
  changeLater: 'Can be changed per product later', // doc
  // FO-8 / PP-10 Pack Point drawer (team drawer spec; numbers come from the seed JSON / engine).
  // Seller view only: the cluster economics (fee by size, opening rule, fee build-up, sign-ups) are Meesho's, not shown.
  ppDrawerTitle: 'Pack Point · details & rate cards',
  ppClose: 'Close',
  ppHowHeading: 'How it works',
  ppHowSteps: (hours: number) => [
    'Send one lot a week to the Pack Point',
    'Every unit is counted and weighed',
    'The partner packs each order to Meesho’s barcoded standard',
    `Orders ship within ${hours} h`,
    'Returns come back to the Pack Point, weighed and graded',
  ],
  ppNearHeading: 'Pack Points near you', // team (seller view spec)
  ppNearNote: 'Distances are approximate, from your pickup pincode.', // ours (city-centre approximations)
  ppInYourDistrict: 'in your district', // team (seller view spec)
  ppKm: (km: number) => `${km.toLocaleString('en-IN')} km`,
  ppOpen: 'Open', // team (seller view spec)
  ppOpeningSoonPill: 'Opening soon', // team (seller view spec)
  ppFeeLine: (fee: number) => `₹${fee.toLocaleString('en-IN')} per delivered order`, // team (seller view spec; the 18% inside the fee is the partner's margin, not GST)
  ppServicesLine: 'Stores · packs · ships · takes returns', // team (seller view spec)
  ppUse: 'Use this Pack Point', // team (seller view spec)
  ppInUse: 'You’re on this Pack Point', // ours
  ppSwitchBack: 'Switch back to self-ship', // team
  ppJoinWaitlistBtn: 'Join waitlist', // team (seller view spec)
  ppOnWaitlist: 'You’re on the waitlist · we’ll notify you', // team
  ppNoneNear: 'No Pack Point near you yet. You’ll be notified when one opens.', // team (seller view spec)
  ppProvidersHeading: 'Providers serving your pincode',
  ppProvider: 'Provider',
  ppServices: 'Services',
  ppRateCard: 'Rate card',
  ppPerOrder: (rate: number) => `₹${rate} per order`,
  ppOnRequest: 'On request',
  ppNoProviders: 'No providers serve this pincode yet',
  ppStorage: (freeDays: number, perUnitPerDay: number) => `Storage free for ${freeDays} days, then ₹${perUnitPerDay} per unit per day`, // team (seller view spec)
  ppNothingAtSignup: 'Nothing to pay at sign-up',
  ppCompareHeading: 'Self-ship or Pack Point',
  ppSelfShip: 'Self-ship',
  ppSelfShipPoints: [
    'You pack each order and buy the packaging',
    'You hand every order to the courier',
    'Returns come back to your door',
  ],
  ppPackPoint: 'Pack Point',
  ppPackPointPoints: [
    'You send one bulk lot a week',
    'A per-order fee instead of packaging',
    'The partner packs, ships and grades returns',
  ],
  ppCompareNote: 'You’ll see what each costs for your product once you tell us what you make.',
  sameAsRegistered: 'Same as registered address', // prompt
  useDemoBank: 'Use demo bank details', // ours (prototype helper)
  useDemoSupplier: 'Use demo store name and email', // ours (prototype helper)
  accountMismatch: 'Account numbers do not match', // ours
  accountCreated: 'Account created (prototype)', // prompt
};
