import { create } from 'zustand';
import personas from '../data/personas.json';
import type { BusinessType, ProductTypeId } from '../engine/ui';
import { useDemo, type Persona } from './demo';

export interface PersonaRecord {
  name: string;
  storeName: string;
  profile: string;
  phone: string;
  email: string;
  taxId: 'GSTIN' | 'EnrolmentID';
  gstin: string;
  legalName: string;
  pan: string;
  address: { building: string; street: string; landmark: string; pincode: string; city: string; state: string };
  gstNatureOfBusiness: string[];
  udyam: { number: string; majorActivity: 'Manufacturing' | 'Services' } | null;
  businessType: BusinessType;
  fulfilment: 'selfShip' | 'packPoint';
  product: { type: ProductTypeId; makingCost: number; marginPct: number } | null;
  bank: { account: string; ifsc: string };
}

export const PERSONAS = personas as unknown as Record<Persona, PersonaRecord>;

/** The fake records of the persona picked in the demo controls. */
export function usePersona(): PersonaRecord {
  return PERSONAS[useDemo((s) => s.persona)];
}

export type Fulfilment = 'selfShip' | 'packPoint' | 'waitlist';

/** Where the maker is in onboarding. Mock only: nothing is sent anywhere. */
export interface OnboardingState {
  persona: Persona | null;
  // Sign-up
  phone: string;
  otpSent: boolean;
  otp: string;
  accountCreated: boolean;
  // Cost check (FO-5), reached from the outreach teaser
  costCheckDone: boolean;
  costCheck: { type: ProductTypeId; makingCost: number; price: number } | null;
  // Step 1 · Business Details (FO-6, FO-7)
  taxIdInput: string;
  businessFetched: boolean;
  businessType: BusinessType | null;
  // Step 2 · Pickup Address (FO-8)
  pickupSaved: boolean;
  /** The pickup address the maker saved, when it differs from the GST record (null = the persona's address). */
  pickupAddress: PersonaRecord['address'] | null;
  fulfilment: Fulfilment | null;
  // Step 3 · Bank Details
  bankVerified: boolean;
  // Step 4 · Supplier Details
  supplierSubmitted: boolean;
  set: (patch: Partial<Omit<OnboardingState, 'set' | 'reset'>>) => void;
  reset: () => void;
}

const EMPTY = {
  persona: null,
  phone: '',
  otpSent: false,
  otp: '',
  accountCreated: false,
  costCheckDone: false,
  costCheck: null,
  taxIdInput: '',
  businessFetched: false,
  businessType: null,
  pickupSaved: false,
  pickupAddress: null,
  fulfilment: null,
  bankVerified: false,
  supplierSubmitted: false,
} satisfies Omit<OnboardingState, 'set' | 'reset'>;

export const useOnboarding = create<OnboardingState>((set) => ({
  ...EMPTY,
  set: (patch) => set(patch),
  reset: () => set({ ...EMPTY }),
}));

/** The maker's pickup pincode: the saved pickup address if any, else the persona's (GST) address. */
export function usePickupPincode(): string {
  const persona = usePersona();
  const saved = useOnboarding((s) => s.pickupAddress?.pincode);
  return saved || persona.address.pincode;
}

// Switching persona starts onboarding over for the new persona (Reset demo also calls reset()).
useDemo.subscribe((s, prev) => {
  if (s.persona !== prev.persona) useOnboarding.getState().reset();
});
