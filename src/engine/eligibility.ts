/** The 7 options of today's "What's your business type" dropdown (onb-business-type-dropdown.png). */
export const BUSINESS_TYPES = [
  'I have a manufacturing unit and supply to other sellers',
  'I have a manufacturing unit and sell directly to customers online',
  'I have a retail shop and sell directly to customers',
  'I buy from other sellers and sell online',
  'I make handcrafted products at home and sell them',
  'I buy and sell in bulk/wholesale',
  'Do not belong to any of the above',
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Q11 (team, 21 Oct 2026): only the two manufacturing-unit options are factory-track. */
export const MANUFACTURER_TYPES: readonly BusinessType[] = [BUSINESS_TYPES[0], BUSINESS_TYPES[1]];

export const GST_FACTORY_NATURE = 'Factory / Manufacturing';

export interface MakerRecords {
  taxId: 'GSTIN' | 'EnrolmentID';
  businessType: BusinessType;
  /** GST "Nature of Business Activity", often several */
  gstNatureOfBusiness: string[];
  /** null = no Udyam registration */
  udyamMajorActivity: 'Manufacturing' | 'Services' | null;
}

export type EligibilityCheck = 'gstin' | 'sellerType' | 'gstNature' | 'udyam';

export interface Eligibility {
  status: 'eligible' | 'pending' | 'notEligible';
  failedChecks: EligibilityCheck[];
}

/**
 * Factory-track checks on Business Details (FO-6, FO-7):
 * Enrolment ID → notEligible (sells as today, not factory-track);
 * seller type must be a manufacturing option; GST nature must include
 * "Factory / Manufacturing"; Udyam must say Manufacturing; no Udyam (and nothing else failing) → pending.
 */
export function eligibility(maker: MakerRecords): Eligibility {
  if (maker.taxId !== 'GSTIN') return { status: 'notEligible', failedChecks: ['gstin'] };
  const failed: EligibilityCheck[] = [];
  if (!MANUFACTURER_TYPES.includes(maker.businessType)) failed.push('sellerType');
  if (!maker.gstNatureOfBusiness.includes(GST_FACTORY_NATURE)) failed.push('gstNature');
  if (maker.udyamMajorActivity !== 'Manufacturing') failed.push('udyam');
  if (failed.length === 0) return { status: 'eligible', failedChecks: [] };
  if (failed.length === 1 && failed[0] === 'udyam' && maker.udyamMajorActivity === null) return { status: 'pending', failedChecks: failed };
  return { status: 'notEligible', failedChecks: failed };
}
