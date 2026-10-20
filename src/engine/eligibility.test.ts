import { describe, expect, it } from 'vitest';
import { eligibility, type MakerRecords } from './eligibility';

const jasmeet: MakerRecords = {
  taxId: 'GSTIN',
  businessType: 'I have a manufacturing unit and sell directly to customers online',
  gstNatureOfBusiness: ['Factory / Manufacturing'],
  udyamMajorActivity: 'Manufacturing',
};

const reseller: MakerRecords = {
  taxId: 'GSTIN',
  businessType: 'I buy from other sellers and sell online',
  gstNatureOfBusiness: ['Retail Business'],
  udyamMajorActivity: 'Services',
};

// plan §8 eligibility · Phase 2 check
describe('eligibility', () => {
  it('Jasmeet → eligible', () => {
    expect(eligibility(jasmeet)).toEqual({ status: 'eligible', failedChecks: [] });
  });

  it('reseller → not eligible, with every failed check listed', () => {
    expect(eligibility(reseller)).toEqual({ status: 'notEligible', failedChecks: ['sellerType', 'gstNature', 'udyam'] });
  });

  it('no Udyam yet → pending', () => {
    expect(eligibility({ ...jasmeet, udyamMajorActivity: null })).toEqual({ status: 'pending', failedChecks: ['udyam'] });
  });

  it('Enrolment ID (non-GST) → not factory-track', () => {
    expect(eligibility({ ...jasmeet, taxId: 'EnrolmentID' }).status).toBe('notEligible');
  });
});
