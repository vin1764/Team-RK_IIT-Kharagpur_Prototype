import { NotImplemented } from './types';

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
 * seller type must be a manufacturing option (Q11); GST nature must include
 * "Factory / Manufacturing"; Udyam must say Manufacturing; no Udyam → pending.
 */
export function eligibility(maker: MakerRecords): Eligibility {
  throw new NotImplemented('eligibility');
}
