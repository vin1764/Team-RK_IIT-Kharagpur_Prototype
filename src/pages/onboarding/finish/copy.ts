// Copy of the onboarding finish screen (FO-7 result, FO-4 teaser, FO-5 cost check). "prompt" = given by the
// team; "doc" = quoted in reference/C2M-solution-doc.pdf (FO-4/FO-5 mock-ups, p.11); the rest is ours.
// Numbers are never written here: every value is passed in from the engine or the seed.
import { fmt } from '../../../i18n';

export const FIN = {
  title: 'What do you sell?', // team, 22 Oct 2026 (for every seller)
  sub: 'Tell us your product to see buyer demand and your take-home. Factory Launch Week is open to every seller whose price qualifies.', // ours
  // Picker
  pickHeading: 'Search or pick your category', // ours
  searchPlaceholder: 'Try Water Bottles, Lunch Boxes, Sneakers…', // ours
  or: 'or', // ours
  photo: 'Upload one product photo', // prompt
  photoModal: {
    title: 'Upload one product photo', // prompt
    intro: 'Add one clear photo of your product. We’ll recognise the product type from it.', // ours
    note: 'One photo is enough', // ours
    add: 'Add photo', // ours
    cancel: 'Cancel', // panel
    continueLabel: 'Recognise', // ours
    cover: 'Your product', // ours
  },
  recognised: (name: string, where: string) => `Recognised: ${name} · ${where}`, // prompt
  correct: 'Correct?', // prompt
  yes: 'Yes', // prompt
  change: 'Change', // prompt
  notRecognised: 'We couldn’t recognise this photo. Pick your category instead.', // ours
  yourProduct: 'Your product', // ours
  noTypeForLeaf: (leaf: string) => `${leaf}: no product type with demand data in this prototype yet`, // ours
  // FO-4 teaser
  teaserTitle: (name: string) => `Buyer demand for ${name.endsWith('s') ? name : `${name}s`}`, // ours
  gap: (low: number, band: string | null) => `About ${fmt(low)} orders a week go unserved${band ? ` at ${band}` : ''}`, // prompt (doc FO-4)
  launchLine: 'Factory Launch Week · open to every seller whose price qualifies · no ads, no listing fee', // team, 22 Oct 2026
  forecast: 'Expected orders are a forecast, not a guarantee', // doc
  noDemand: 'No demand data for this product type yet', // prompt
  // FO-5 cost check (the new copy, from the earning input to the Factory Launch status, is in src/i18n: cost.*)
  costTitle: 'See your take-home in 5 minutes', // doc
  costSub: (mode: 'selfShip' | 'packPoint') => `Cost check · ${mode === 'packPoint' ? 'shipping through the Pack Point' : 'Self-ship'}`, // ours (FO-8 choice)
  feeStack: 'Fee stack per order', // ours
  breakEven: 'Break-even', // ours
  noFeeCard: 'The cost check needs this product type’s fee card, which isn’t in this prototype yet.', // ours
  demo: 'Use demo product and costs', // ours (prototype helper)
  // Footer
  check: 'Check my eligibility', // prompt
  skip: 'Skip for now', // prompt
};
