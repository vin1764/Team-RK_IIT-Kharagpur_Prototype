// Maker-facing copy of the Factory Launch screens (LW-2 … LW-8). English only, like the other
// panel inserts outside the bot. "doc" = quoted in reference/C2M-solution-doc.pdf pp.21–22 or the
// deck's order-book appendix; "prompt" = given by the team in the Phase 4 brief; the rest is ours.
// Numbers are never written here: every value is passed in from the engine or the launch seed.
import { fmt } from '../../../i18n';

const s = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`;

export const FL = {
  tab: 'Factory Launch', // doc
  eventTitle: (name: string, category: string) => `${name} · ${category}`, // prompt
  eventSub: 'A launch week open to every seller whose price qualifies. Entry by price, not by discount: no discount asked.', // ours (team, 22 Oct 2026: price, listing and stock decide entry)
  // Phase pills
  phase: {
    open: 'Open for commitments', // ours
    closed: 'Commitments closed', // prompt
    stockReady: 'Stock at the node', // ours
    live: 'Live', // prompt
    ended: 'Ended', // prompt
  },
  // Key dates (doc: commitments close day 7; stock at node by day 18; live days 21–25)
  keyDates: 'Key dates', // ours
  commitmentsClose: 'Commitments close', // doc
  stockReady: 'Stock ready by', // prompt
  live: 'Live', // doc
  today: 'Today', // ours
  // Phase banners
  closedBanner: (stock: string) => `Commitments are closed. Committed stock must be ready by ${stock}.`, // ours
  stockBanner: (stock: string, live: string) => `Stock ready by ${stock}. The launch goes live on ${live}.`, // ours
  liveBanner: (n: number, of: number) => `Live now · Day ${n} of ${of}`, // ours (doc "day 3 of 5")
  endedBanner: 'Launch week ended · orders continue', // prompt
  // Order book
  orderBook: 'Order book', // doc
  yourProduct: 'Your product', // ours (the type the maker told us after onboarding)
  col: {
    type: 'Product type', // ours
    slots: 'Slots', // doc
    expected: 'Expected orders per listing', // doc
    lot: 'Suggested first lot', // doc
    committed: 'Committed so far', // doc
    ppFee: 'Pack Point fee', // doc
    priceCap: 'Price cap', // doc
    action: 'Action', // panel
  },
  slotsLeft: (n: number) => s(n, 'slot left', 'slots left'), // prompt
  slotsFull: 'Full · crowded', // prompt
  slotsFullYours: 'Full · you have a slot', // ours
  expectedRange: (low: number, high: number) => `${fmt(low)}–${fmt(high)} a day`, // prompt
  forecast: 'A forecast, not a guarantee', // doc
  units: (n: number) => s(n, 'unit', 'units'),
  ppFeeValue: (fee: number) => `₹${fmt(fee)} + GST per delivered order`, // doc; team Q20 (+ GST)
  ppFeeYours: 'In your cost stack', // ours (doc: "goes straight into the cost stack")
  ppFeeInfo: 'For Pack Point makers', // ours
  priceCapValue: 'Checked at commit', // doc
  priceCapTip: 'Your listing price is checked when you commit. You only see whether it qualifies.', // ours
  oversubscribed: 'If a type is oversubscribed, the lower listed price wins the slot.', // prompt
  commit: 'Commit', // doc
  committedPill: (units: number) => `Committed · ${s(units, 'unit', 'units')}`, // ours
  viewLive: 'View live launch', // prompt
  closedOn: (date: string) => `Commitments closed on ${date}`, // prompt
  // Personas without an order book (LW-4)
  noOrderBook: 'No open order book for your product type yet', // prompt
  noOrderBookSub: 'Footwear comes in a later launch. We will tell you when its order book opens.', // ours (deck)
  // Commit panel (LW-5)
  commitTitle: (name: string) => `Commit to ${name}`, // ours
  sku: 'SKU', // doc
  catalogId: (id: string) => `Catalog ID ${id}`, // panel
  yourPrice: (price: number) => `Your price ₹${fmt(price)}`, // ours
  unitsLabel: 'Units to commit', // doc
  unitsHint: (units: number, days: number) => `${fmt(units)} suggested · about ${fmt(days)} days of expected sales · any number`, // ours (plan §7)
  belowMinRun: (units: number, minRun: number) => `${fmt(units)} units is below your minimum run of ${fmt(minRun)}. You can still commit this number.`, // ours (same as lot.belowMinRun)
  priceCheck: 'Price check', // ours
  qualifies: 'Qualifies ✓', // prompt
  priceFails: 'Price doesn’t qualify for Factory Launch', // prompt
  priceFailsSub: 'Change the price on Manage Pricing, then commit.', // ours
  stockPromise: (date: string) => `Have these units ready by ${date}.`, // ours
  cancel: 'Cancel', // panel
  listFirst: (type: string) => `List your ${type} first`, // prompt
  listFirstSub: 'Factory Launch commits a live listing. Create it from photos in a few minutes.', // ours
  createFromPhotos: 'Create from photos', // existing LB-3 button
  success: (name: string, units: number, live: string) => `You're in ${name} · ${s(units, 'unit', 'units')} · live ${live}`, // prompt
  // Live view (LW-7)
  liveTitle: 'Live launch', // ours
  dayOf: (n: number, of: number, date: string) => `Day ${n} of ${of} · ${date}`, // prompt
  goesLive: (date: string) => `Goes live on ${date}`, // prompt
  endedTitle: 'Launch week ended · orders continue', // prompt
  tile: {
    today: 'Orders today', // prompt
    expected: 'Expected', // prompt
    sold: 'Sold', // prompt
    left: 'Left', // prompt
    soldTo: (date: string) => `Sold to end of ${date}`, // ours (Phase 6)
    leftAt: (date: string) => `Left at end of ${date}`, // ours (Phase 6)
    sellThrough: 'Sell-through', // prompt
  },
  ofLot: (sold: number, lot: number) => `${fmt(sold)} of ${fmt(lot)}`, // prompt
  ordersPerDay: 'Orders per day', // ours
  expectedBand: (low: number, high: number) => `Expected ${fmt(low)}–${fmt(high)} a day`, // ours
  launchWeek: 'Launch week', // ours
  unitsSold: 'Units sold of the lot', // doc
  soldOfLot: (sold: number, lot: number, pct: number) => `${fmt(sold)} of ${fmt(lot)} sold · ${fmt(pct)}%`, // ours
  noCommitTitle: 'You have no lot in this launch', // ours
  noCommitSub: 'Commit units from the Factory Launch tab to see your launch here.', // ours
  backToLaunch: 'Factory Launch', // ours
  // Home banner, sidebar item, pinned notice (LW-6). Shown only to makers
  // who passed the seller-type + GST/Udyam checks.
  banner: {
    openToAll: 'Open to every seller whose price qualifies · no ads, no listing fee', // team, 22 Oct 2026 (replaces "Manufacturers only")
    slotsFor: (slots: string, type: string) => `${slots} for ${type.endsWith('s') ? type : `${type}s`}`, // prompt
    liveOn: (dates: string) => `Live ${dates}`, // prompt
    check: 'Check my eligibility', // prompt
    progress: (done: number, total: number) => `${fmt(done)} of ${fmt(total)} done`, // prompt
    next: (step: string) => `Next: ${step}`, // ours
    commitStock: 'Commit stock', // prompt
    closeBy: (date: string) => `Commitments close ${date}`, // prompt
    item: {
      product: 'Tell us what you sell', // prompt (team, 22 Oct 2026: every seller)
      priceFails: 'Not eligible at this price · lower your price to join', // team spec (price never blocks listing)
      stock: 'Stock committed', // prompt
      stockDone: (units: number, stock: string) => `${s(units, 'unit', 'units')} · ready by ${stock}`, // ours
      stockOpen: (date: string) => `Commit units from the order book by ${date}`, // ours
      stockClosed: (date: string) => `Commitments closed on ${date}`, // prompt
    },
    createFromPhotos: 'Create from photos', // existing LB-3 button
    notEligiblePrice: 'Not eligible at this price · lower your price to join', // team spec (price never blocks listing)
    lowerPrice: 'Lower your price', // ours
    tellUs: 'Tell us', // ours
    product: 'product', // ours ("List your product…" before the maker has told us what they make)
    noBook: (type: string) => `No open order book for ${type} yet · we'll tell you when one opens`, // ours (prompt LW-4 "No open order book for your product type yet")
    toOrderBook: 'Go to order book', // prompt
    in: (name: string, stock: string, live: string) => `You're in ${name} · stock ready by ${stock} · live ${live}`, // prompt
    live: (today: number) => `Live now · ${s(today, 'order', 'orders')} today`, // prompt
    liveSub: (day: string, sold: string) => `${day} · ${sold} sold so far`, // ours
    ended: 'Launch week ended · orders continue', // prompt
    results: 'Launch results', // prompt
    slotRemoved: 'Launch slot removed — price no longer qualifies', // prompt (doc p.7)
    slotRemovedSub: 'Sales so far stay as they are.', // doc + ours
    closed: (date: string) => `Commitments closed on ${date} · next Factory Launch soon`, // prompt
    dismiss: 'Dismiss', // ours
    expand: 'Show checklist', // ours
    collapse: 'Hide checklist', // ours
  },
  sidebar: 'Factory Launch', // prompt
  newTag: 'NEW', // panel
  notice: {
    pinned: 'Pinned', // ours
    body: 'Open to every seller whose price qualifies · no ads, no listing fee. Entry by price, a live listing and committed stock; no discount asked.', // team, 22 Oct 2026
    dates: (close: string, stock: string, live: string) => `Commit stock by ${close} · stock ready by ${stock} · live ${live}`, // ours (calendar)
  },
  // Price-hold breach (PI-3, doc p.7: "price no longer qualifies" → launch slot removed, no number shown)
  toPricePosition: 'View price position', // ours
  slotRemovedPill: 'Slot removed', // doc
  slotRemovedSub: 'Price no longer qualifies', // doc
  slotRemovedBanner: 'Your price no longer qualifies for Factory Launch · launch slot removed. Sales so far stay as they are.', // doc + ours
  // Listed above the cap (team spec: the price never blocks listing; it only decides launch eligibility). No number shown.
  notEligiblePrice: 'Not eligible at this price', // team spec
  notEligiblePriceBanner: 'Your listing is live on Meesho. Not eligible at this price · lower your price to join.', // team spec + ours
  // Quality (LW-8)
  scoreTitle: (type: string) => `Listing score · ${type}`, // prompt
  scoreLine: 'Built from this listing’s own orders and returns', // prompt
};
