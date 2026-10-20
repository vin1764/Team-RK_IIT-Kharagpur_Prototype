import type { PersonaRecord } from '../../../store/onboarding';

/** "GSTIN" or "Enrolment ID / UIN", as the panel words the maker's tax id. */
export const taxIdKind = (p: PersonaRecord) => (p.taxId === 'GSTIN' ? 'GSTIN' : 'Enrolment ID / UIN');

/** One-line registered address from the persona's (fake) GST record. */
export const formatAddress = (a: PersonaRecord['address']) =>
  [a.building, a.street, a.landmark !== '-' ? a.landmark : null, a.city, `${a.state} - ${a.pincode}`].filter(Boolean).join(', ');
