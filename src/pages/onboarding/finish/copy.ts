// Copy of the onboarding finish screen (FO-7 result, FO-4 teaser, FO-5 cost check). "prompt" = given by the
// team; "doc" = quoted in reference/C2M-solution-doc.pdf (FO-4/FO-5 mock-ups, p.11); the rest is ours.
// Numbers are never written here: every value is passed in from the engine or the seed.
import { fmt } from '../../../i18n';

export const FIN = {
  title: 'You’re a verified factory seller. What do you make?', // prompt
  sub: 'You’re eligible for Factory Launch Week. Tell us your product to see buyer demand and your take-home.', // prompt + ours
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
  launchLine: 'Factory Launch Week · manufacturers only', // doc
  forecast: 'Expected orders are a forecast, not a guarantee', // doc
  noDemand: 'No demand data for this product type yet', // prompt
  // FO-5 cost check (the new copy, from the earning input to the Factory Launch status, is in src/i18n: cost.*)
  costTitle: 'See your take-home in 5 minutes', // doc
  costSub: (mode: 'selfShip' | 'packPoint') => `Cost check · ${mode === 'packPoint' ? 'shipping through the Pack Point' : 'shipping from your factory'}`, // ours (FO-8 choice)
  makingCost: 'Making cost per unit', // doc
  feeStack: 'Fee stack per order', // ours
  breakEven: 'Break-even', // ours
  noFeeCard: 'The cost check needs this product type’s fee card, which isn’t in this prototype yet.', // ours
  demo: 'Use demo product and costs', // ours (prototype helper)
  // Footer
  check: 'Check my eligibility', // prompt
  skip: 'Skip for now', // prompt
};
