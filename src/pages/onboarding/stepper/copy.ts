// C2M copy on the onboarding steps (FO-6, FO-7, FO-8). Strings quoted in the doc mock-up
// (reference/C2M-solution-doc.pdf p.12) are marked "doc"; the rest is ours (Team RK) and is
// listed in the Phase 2 report. Move to i18n/ when that folder lands.
import { GST_FACTORY_NATURE, type EligibilityCheck } from '../../../engine/ui';

export const C2M = {
  // FO-6
  businessTypeHeading: 'What’s your business type?', // doc
  businessTypeLabel: 'What’s your business type', // existing field label (onb-business-type-dropdown.png)
  suggested: 'Suggested', // ours
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
  packPointTitle: 'Send one lot a week to Pack Point', // doc
  packPointLive: (city: string, fee: number) => `${city} · ₹${fee} per delivered order`, // doc
  packPointBody: 'Partner packs, ships and takes returns', // doc
  packPointOpening: (city: string, makers: number) => `${city} · Opens at ${makers} makers · Join the waitlist`, // prompt
  packPointNone: (pincode: string) => `Not available near ${pincode} yet · Join the waitlist`, // prompt
  waitlistJoined: 'You’re on the waitlist; ship from your factory until it opens', // ours
  changeLater: 'Can be changed per product later', // doc
  sameAsRegistered: 'Same as registered address', // prompt
  useDemoBank: 'Use demo bank details', // ours (prototype helper)
  useDemoSupplier: 'Use demo store name and email', // ours (prototype helper)
  accountMismatch: 'Account numbers do not match', // ours
  accountCreated: 'Account created (prototype)', // prompt
};
