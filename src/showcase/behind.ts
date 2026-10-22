// "Behind it": the live calculation behind each new element, for the showcase sidebar.
// Every number is computed here from the engine's UI entry (src/engine/ui.ts) or the seed JSON in
// src/data; none is typed in. The launch price cap never appears: the price checks show only
// "Qualifies / Doesn't qualify" and a third (Low / Mid / High), exactly as the maker sees them.
import calendar from '../data/calendar.json';
import growthSeed from '../data/growth.json';
import launch from '../data/launch.json';
import lotSeed from '../data/packPointLot.json';
import model from '../data/packPointModel.json';
import nodesSeed from '../data/packPointNodes.json';
import personas from '../data/personas.json';
import {
  checkListingPrice,
  clusterForPincode,
  costStack,
  dayToDate,
  demandForType,
  eligibility,
  formatDate,
  growthAt,
  launchProgress,
  likelyOrdersPerDay,
  likelyShare,
  listingPricePosition,
  lotInbound,
  packPointFee,
  pctDisplay,
  productTypeName,
  qualifyingPriceExists,
  slots,
  suggestedLot,
  typicalForType,
  type BusinessType,
  type CostStack,
  type EligibilityCheck,
  type MakerRecords,
  type ProductTypeId,
} from '../engine/ui';
import { BOT_FILLED_COUNT, MAKER_COUNT, MANDATORY_IDS } from '../pages/panel/catalog/bot';
import type { Persona } from '../store/demo';
import type { BehindCtx } from './types';

// ── formatting (same output as the app's fmt in src/i18n: Indian grouping, up to 2 decimals) ──────
const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
const rs = (n: number) => `₹${fmt(n)}`;
/** fixed 2 decimals, for paise amounts like ₹26.10 */
const rs2 = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt3 = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 3 });
const one = (n: number) => fmt(Math.round(n * 10) / 10);
const pct = (share: number) => `${fmt(Math.round(share * 1000) / 10)}%`;
/** "14 Nov" */
const shortIso = (iso: string) => formatDate(iso).split(' ').slice(0, 2).join(' ');
const short = (day: number) => shortIso(dayToDate(day));
/** "14–18 Nov" (same month) or "28 Nov–2 Dec" */
const shortSpan = (a: number, b: number) => {
  const [da, ma] = short(a).split(' ');
  const [db, mb] = short(b).split(' ');
  return ma === mb ? `${da}–${db} ${mb}` : `${short(a)}–${short(b)}`;
};
const range = (r: { low: number; high: number }, unit = '') => (r.low === r.high ? `${fmt(r.low)}${unit}` : `${fmt(r.low)}–${fmt(r.high)}${unit}`);
const rsRange = (r: { low: number; high: number }) => `₹${fmt(r.low)}–${fmt(r.high)}`;

// ── personas ─────────────────────────────────────────────────────────────────────────────────────
interface Product {
  type: ProductTypeId;
  makingCost: number;
  marginPct: number;
}
interface PersonaSeed {
  name: string;
  taxId: string;
  businessType: string;
  gstNatureOfBusiness: string[];
  udyam: { majorActivity: string | null } | null;
  fulfilment: string;
  address: { city: string; pincode: string };
  product: Product | null;
}
const P = personas as unknown as Record<Persona, PersonaSeed>;
const firstName = (p: Persona) => P[p].name.split(' ')[0]!;
const modeOf = (p: Persona) => (P[p].fulfilment === 'packPoint' ? 'packPoint' : 'selfShip') as 'packPoint' | 'selfShip';

/** The persona's own product, or null (the reseller has none). */
const productOf = (p: Persona): Product | null => P[p].product;
const NO_PRODUCT = (p: Persona) => [`${p === 'reseller' ? 'The reseller' : firstName(p)} has no product of their own here; switch to Jasmeet or Samar to see the numbers.`];

function stackOf(p: Persona): { prod: Product; stack: CostStack } | null {
  const prod = productOf(p);
  if (!prod) return null;
  return { prod, stack: costStack(prod.type, prod.makingCost, prod.marginPct, modeOf(p)) };
}

/** "80 making + 6 packaging + 32 shipping & fixed fee + 8 returns = 126" */
function costLine(s: CostStack): string {
  const f = s.fees;
  const parts = [
    `${fmt(s.makingCost)} making`,
    f.packaging !== undefined ? `${fmt(f.packaging)} packaging` : null,
    f.packPointFee !== undefined ? `${fmt(f.packPointFee)} Pack Point fee` : null,
    `${fmt(f.shippingAndFixed)} shipping & fixed fee`,
    `${fmt(f.returnsBuffer)} returns buffer`,
  ].filter(Boolean);
  return `${parts.join(' + ')} = ${fmt(s.costBeforeGst)}`;
}
const gstX = (s: CostStack) => fmt(1 + s.gstRate);
const breakEvenLine = (s: CostStack) =>
  `Break-even: ${fmt(s.costBeforeGst)} × ${gstX(s)} GST = ${fmt(Math.round(s.costBeforeGst * (1 + s.gstRate) * 100) / 100)} → ${rs(s.breakEven)}`;
const takeHomeLine = (prod: Product, s: CostStack) => `Take-home: ${fmt(prod.marginPct)}% × ${rs(prod.makingCost)} = ${rs(s.takeHome)}`;
const listLine = (s: CostStack) =>
  `List price: (${fmt(s.costBeforeGst)} + ${fmt(s.takeHome)}) × ${gstX(s)} = ${rs(s.listPrice)} · GST inside ${rs(s.fees.gst)}`;

const STATUS_WORD = { qualifies: 'Qualifies', aboveCap: 'Doesn’t qualify', belowCost: 'Doesn’t qualify (below break-even)' } as const;
const THIRD = { low: 'Low', mid: 'Mid', high: 'High' } as const;

// ── launch helpers ───────────────────────────────────────────────────────────────────────────────
const J: Persona = 'jasmeet';
const LOT = launch.commit.jasmeet.units;
const DAILY = launch.dailyOrders as Record<string, number>;
const L = calendar.launch;
const EDIT = { price: launch.priceEdit.price, day: calendar.jumps.priceEdit, persona: launch.priceEdit.persona as Persona };

/** Jasmeet's listing price on a demo day: the go-live price, or the scripted edit from D40. */
function priceOn(p: Persona, day: number, listPrice: number): { price: number; edited: boolean } {
  return p === EDIT.persona && day >= EDIT.day ? { price: EDIT.price, edited: true } : { price: listPrice, edited: false };
}

function growthFor(p: Persona, day: number) {
  if (p !== J) return null;
  const s = stackOf(J)!;
  const typical = typicalForType(s.prod.type)!;
  return growthAt(day, { lot: LOT, leadTimeDays: typical.leadTimeDays, minRun: typical.minRun, makingCost: s.prod.makingCost, listPrice: s.stack.listPrice });
}
const notInLoop = (p: Persona, day: number) =>
  p !== J
    ? ['The growth loop in this demo runs on Jasmeet’s launched bottle; switch to Jasmeet.']
    : [`Starts on D${growthSeed.asOfDay} (${short(growthSeed.asOfDay)}), after a full week of launch sales (today is D${day}).`];

// ── eligibility ─────────────────────────────────────────────────────────────────────────────────
function records(p: Persona): MakerRecords {
  const r = P[p];
  return {
    taxId: r.taxId as MakerRecords['taxId'],
    businessType: r.businessType as BusinessType,
    gstNatureOfBusiness: r.gstNatureOfBusiness,
    udyamMajorActivity: (r.udyam?.majorActivity ?? null) as MakerRecords['udyamMajorActivity'],
  };
}
const RESULT = { eligible: 'Eligible for Factory Launch', pending: 'Pending (no Udyam yet)', notEligible: 'Not eligible: sells as today, not factory-track' } as const;

// ── the calculations ────────────────────────────────────────────────────────────────────────────
export const BEHIND: Record<string, (ctx: BehindCtx) => string[]> = {
  /** FO-3: the outreach message's teaser */
  outreach: () => [
    `Category-level: ${launch.category} manufacturers invited to ${launch.name.replace(/\s+\d+$/, '')} · no product, demand or price numbers in the message`,
    'Udyam or IndiaMART data can’t tell us a maker’s exact product, so the maker tells us after onboarding (finish screen); the demand teaser and cost check show there.',
  ],

  /** FO-4: the demand teaser on the onboarding finish screen, for the type the maker picked */
  teaser: ({ persona }) => {
    const prod = productOf(persona) ?? productOf(J)!;
    const d = demandForType(prod.type);
    return [
      `Open gap: ${range(d.gapPerWeek)} a week${d.priceBand ? ` at ${rsRange(d.priceBand)}` : ''} · confidence ${d.confidence}`,
      `${fmt(d.committedUnits)} units already committed by other makers`,
    ];
  },

  /** FO-5: the 5-minute cost check */
  costCheck: ({ persona }) => {
    const x = stackOf(persona);
    if (!x) return NO_PRODUCT(persona);
    const { prod, stack } = x;
    const ok = qualifyingPriceExists(prod.type, stack.breakEven);
    return [
      `Costs per order: ${costLine(stack)}`,
      breakEvenLine(stack),
      `${takeHomeLine(prod, stack)} → list at ${rs(stack.listPrice)}`,
      ok ? `Break-even ${rs(stack.breakEven)} sits under the launch price cap → a qualifying price exists` : `Break-even ${rs(stack.breakEven)} is above the launch price cap → no qualifying price`,
    ];
  },

  /** FO-6, FO-7, LW-4: seller type + GST nature + Udyam */
  eligibility: ({ persona }) => {
    const r = P[persona];
    const e = eligibility(records(persona));
    const ok = (c: EligibilityCheck) => (e.failedChecks.includes(c) ? '✗' : '✓');
    if (e.failedChecks.includes('gstin')) return ['No GSTIN (Enrolment ID) ✗', `→ ${RESULT[e.status]}`];
    return [
      `Seller type “${r.businessType}” ${ok('sellerType')}`,
      `GST nature of business: ${r.gstNatureOfBusiness.join(', ')} ${ok('gstNature')}`,
      `Udyam activity: ${r.udyam?.majorActivity ?? 'none'} ${ok('udyam')}`,
      `→ ${RESULT[e.status]}`,
    ];
  },

  /** FO-8: shipping choice at Pickup Address */
  fulfilment: ({ persona }) => {
    const r = P[persona];
    const node = clusterForPincode(nodesSeed.nodes as { city: string; status: string; makersPooled?: number; opensAtMakers?: number; pincodePrefixes?: string[] }[], r.address.pincode);
    if (!node) return [`${r.address.city} has no Pack Point cluster yet → self-ship, as today.`];
    if (node.status !== 'live' || node.makersPooled === undefined)
      return [`${node.city} Pack Point opens at ${fmt(node.opensAtMakers ?? model.densityFloorMakers)} makers → join the waitlist or self-ship.`];
    const fee = packPointFee(node.makersPooled);
    return [
      `Pickup pincode is in the ${node.city} cluster: live, ${fmt(node.makersPooled)} makers pooled`,
      `Pack Point fee: ${rs(fee.feePerDeliveredOrder)} per delivered order (packing included) · or self-ship as today`,
    ];
  },

  /** LB-3, LB-4: who fills what */
  botFill: () => [
    `Today’s form: ${fmt(MANDATORY_IDS.length)} mandatory fields, all typed by hand`,
    `With the bot: Meesho fills ${fmt(BOT_FILLED_COUNT)} of them from the photos, GST record and category; the maker types ${fmt(MAKER_COUNT)} values`,
  ],

  /** LB-5: demand card + suggested lot (also behind the order book's expected orders) */
  demandLot: ({ persona }) => {
    const prod = productOf(persona);
    if (!prod) return NO_PRODUCT(persona);
    const d = demandForType(prod.type);
    const s = likelyShare(prod.type);
    const day = likelyOrdersPerDay(prod.type);
    const lot = suggestedLot(prod.type, prod.makingCost);
    return [
      `Open gap ${range(d.gapPerWeek)} a week × ${pct(s.share)} likely share = ${range(s.ordersPerWeek)} a week = ${one(s.ordersPerWeek.low / 7)}–${one(s.ordersPerWeek.high / 7)} → ${range(day)} a day`,
      `Slots: ${fmt(d.gapPerWeek.low)} ÷ ${fmt(s.ordersPerWeek.low)} = ${fmt(d.gapPerWeek.high)} ÷ ${fmt(s.ordersPerWeek.high)} = ${fmt(slots(prod.type))}`,
      `First lot ≈ ${fmt(lot.dailyRunRate)} a day × ${lot.days} days = ${fmt(lot.dailyRunRate * lot.days)} → ${fmt(lot.units)} (${rs(lot.atCost)} at cost)`,
    ];
  },

  /** LB-6: the bot's Price screen */
  price: ({ persona }) => {
    const x = stackOf(persona);
    if (!x) return NO_PRODUCT(persona);
    const { prod, stack } = x;
    return [
      `Costs: ${costLine(stack)}`,
      breakEvenLine(stack),
      `${takeHomeLine(prod, stack)} → ${listLine(stack).replace('List price: ', 'list ')}`,
      `${rs(stack.listPrice)} is above break-even ${rs(stack.breakEven)} and within the launch price cap → ${STATUS_WORD[checkListingPrice(prod.type, stack.listPrice, stack.breakEven)]}`,
    ];
  },

  /** LB-8: go-live checklist */
  goLive: ({ persona }) => {
    const x = stackOf(persona);
    if (!x) return NO_PRODUCT(persona);
    const { prod, stack } = x;
    const lot = suggestedLot(prod.type, prod.makingCost);
    const ok = checkListingPrice(prod.type, stack.listPrice, stack.breakEven) === 'qualifies';
    return [
      `Images ✓ · Details ✓ · Price in band ${ok ? '✓' : '✗'} (${rs(stack.listPrice)}) · Lot ${fmt(lot.units)} ✓ → Go live`,
      `Fees locked at dispatch: take-home stays ${rs(stack.takeHome)} a unit at ${rs(stack.listPrice)}`,
    ];
  },

  /** LW-2: the Factory Launch event */
  launchWeek: () => [
    `Commitments close D${L.commitmentsCloseDay} (${short(L.commitmentsCloseDay)}) · stock at the node by D${L.stockAtNodeDay} (${short(L.stockAtNodeDay)})`,
    `Live ${L.liveToDay - L.liveFromDay + 1} days: D${L.liveFromDay}–D${L.liveToDay} (${shortSpan(L.liveFromDay, L.liveToDay)}) · entry by rule, no discount asked`,
  ],

  /** LW-3: the published order book */
  orderBook: ({ persona }) => {
    const prod = productOf(J)!;
    const d = demandForType(prod.type);
    const total = slots(prod.type);
    const taken = launch.slotsTakenBeforeJasmeet;
    const lot = suggestedLot(prod.type, prod.makingCost);
    const day = likelyOrdersPerDay(prod.type);
    return [
      `${productTypeName(prod.type)}: ${total} slots (${fmt(d.gapPerWeek.low)}–${fmt(d.gapPerWeek.high)} a week open gap ÷ ${range(day)} a day per listing)`,
      `${fmt(d.committedUnits)} units already committed ÷ ${fmt(lot.units)} a lot = ${fmt(d.committedUnits / lot.units)} slots taken → ${fmt(total - taken)} left${persona === J ? '' : ' (before Jasmeet commits)'}`,
      `Expected ${range(day)} orders a day per listing · suggested first lot ${fmt(lot.units)} · price cap checked at commit, not printed`,
    ];
  },

  /** LW-5: the commit */
  commit: ({ persona }) => {
    const x = stackOf(persona);
    if (!x) return NO_PRODUCT(persona);
    const { prod, stack } = x;
    const lot = suggestedLot(prod.type, prod.makingCost);
    return [
      `Commit ${fmt(lot.units)} units (suggested; any number) = ${rs(lot.units * prod.makingCost)} at cost`,
      `Price ${rs(stack.listPrice)} re-checked at commit → ${STATUS_WORD[checkListingPrice(prod.type, stack.listPrice, stack.breakEven)]} · no discount field`,
    ];
  },

  /** LW-6: the Home banner (also the sidebar item and pinned notice), on the scripted story for each persona */
  launchBanner: (ctx) => {
    const { persona, day } = ctx;
    if (eligibility(records(persona)).status !== 'eligible') return [`${RESULT[eligibility(records(persona)).status]} → no banner, no sidebar item, no pinned notice: Meesho as today.`];
    const own = productOf(persona);
    if (!own || !launch.productTypes.includes(own.type))
      return [`${own ? productTypeName(own.type) : 'This product'} has no order book in ${launch.name} (${launch.category}) → a slim “no open order book” note on Home while commitments are open; sidebar item and pinned notice still show.`];
    const total = slots(own.type);
    const taken = launch.slotsTakenBeforeJasmeet;
    const told = day > calendar.jumps.onboarding;
    const listed = day >= calendar.jumps.listing;
    const committed = day > L.commitmentsCloseDay;
    const n = 2 + Number(listed) + Number(committed);
    const lines = [
      `Slots: ${fmt(total)} − ${fmt(taken)} taken = ${fmt(total - taken)} left for ${productTypeName(own.type)} (the order book’s count, before ${firstName(persona)} commits)`,
      `Dates: commitments close D${L.commitmentsCloseDay} (${short(L.commitmentsCloseDay)}) · stock ready D${L.stockAtNodeDay} (${short(L.stockAtNodeDay)}) · live D${L.liveFromDay}–D${L.liveToDay} (${shortSpan(L.liveFromDay, L.liveToDay)})`,
      told
        ? `Checklist: manufacturer ✓ + records agree ✓ (GST/Udyam checks) + listed at a qualifying price ${listed ? '✓' : '○'} (listing from D${calendar.jumps.listing}) + stock committed ${committed ? '✓' : '○'} (counts after D${L.commitmentsCloseDay}) = ${n} of 4`
        : `Checklist: “Tell us what you make” ○ (finish screen; the seeded product counts from D${calendar.jumps.onboarding + 1}) + manufacturer ✓ + records agree ✓ + listed ○ + committed ○ = 2 of 5`,
    ];
    if (day >= L.liveFromDay && day <= L.liveToDay) {
      const g = launchProgress(DAILY, LOT, day);
      lines.push(`Live now: ${fmt(g.today ?? 0)} orders today (seeded series) · ${fmt(g.soldToDate)} of ${fmt(LOT)} sold`);
    }
    return lines;
  },

  /** LW-7: live launch view */
  launchLive: ({ persona, day }) => {
    if (persona !== J) return ['Launch Week 1 in this demo holds Jasmeet’s 1 L bottle; switch to Jasmeet.'];
    if (day < L.liveFromDay) return [`Not live yet: live days D${L.liveFromDay}–D${L.liveToDay} (${shortSpan(L.liveFromDay, L.liveToDay)}). Today is D${day}.`];
    const g = launchProgress(DAILY, LOT, day);
    const exp = likelyOrdersPerDay(productOf(J)!.type);
    const sum = g.days.length <= 5 ? `${g.days.map((d) => fmt(d.orders)).join(' + ')} = ${fmt(g.soldToDate)}` : `D${g.days[0]!.day}–D${g.days.at(-1)!.day} orders add up to ${fmt(g.soldToDate)}`;
    return [
      g.today !== null ? `D${day}: ${fmt(g.today)} orders today vs ${range(exp)} expected` : `D${day}: no orders seeded for today`,
      `Sold: ${sum} of ${fmt(LOT)} → ${fmt(g.left)} left (${pct(g.sellThrough)} sold)`,
    ];
  },

  /** LW-8: listing-level quality score */
  listingScore: ({ persona, day }) => {
    if (persona !== J) return ['Shown for a launched listing (Jasmeet’s bottle).'];
    if (day < L.liveFromDay) return [`Starts with the first launch orders on D${L.liveFromDay}.`];
    const g = launchProgress(DAILY, LOT, day);
    return [`Built from this listing’s own ${fmt(g.soldToDate)} launch orders and their returns, not an inherited seller score → “${launch.listingScoreLabel}”`];
  },

  /** GL-1: Business Dashboard tiles */
  dashboard: ({ persona, day }) => {
    const g = growthFor(persona, day);
    if (!g) return notInLoop(persona, day);
    const d = g.dashboard;
    return [
      `Click rate ${fmt(d.clicks)} ÷ ${fmt(d.views)} = ${pctDisplay(d.clickRate)} · conversion ${fmt(d.orders)} ÷ ${fmt(d.clicks)} = ${pctDisplay(d.conversion)}`,
      `Sales ${fmt(d.orders)} × ${rs(d.sales / d.orders)} = ${rs(d.sales)} · returns ${fmt(d.returns)} ÷ ${fmt(d.orders)} = ${pctDisplay(d.returnRate)}`,
    ];
  },

  /** GL-2: restock card */
  restock: ({ persona, day }) => {
    const g = growthFor(persona, day);
    if (!g) return notInLoop(persona, day);
    const r = g.restock;
    const typical = typicalForType(productOf(J)!.type)!;
    const lead = typical.leadTimeDays;
    const safety = growthSeed.safetyDays;
    const week = g.weekDaily.reduce((s, d) => s + d.orders, 0);
    const cover = r.coverDays < lead + safety ? `< ${lead} lead + ${safety} safety → Make more` : `≥ ${lead} + ${safety} → Keep`;
    return [
      `Run-rate ${fmt(week)} ÷ 7 = ${fmt(g.runRate)} a day · cover ${fmt(g.onHand)} ÷ ${fmt(g.runRate)} = ${fmt(r.coverDays)} days ${cover}`,
      `Reorder point ${fmt(g.runRate)} × (${lead} + ${safety}) = ${fmt(r.reorderPoint)} · ${fmt(g.onHand)} on hand ${g.onHand <= r.reorderPoint ? '≤' : '>'} ${fmt(r.reorderPoint)}`,
      `Next batch ${fmt(g.runRate)} × 21 = ${fmt(g.runRate * 21)} → ${fmt(r.nextBatch)} (${rs(r.batchAtCost)} at cost)`,
      `Start ${shortIso(r.startBy)}, lands ${shortIso(r.landsOn)} with ${fmt(r.leftOnLanding)} left`,
    ];
  },

  /** GL-5: verdict chips */
  verdicts: ({ persona, day }) => {
    const g = growthFor(persona, day);
    if (!g) return notInLoop(persona, day);
    const word = { makeMore: 'Make more', keep: 'Keep', fix: 'Fix', stop: 'Stop', switch: 'Switch' } as const;
    const why = { coverBelowLead: `${fmt(g.restock.coverDays)} days of cover, less than lead time + safety`, weakListing: 'weak listing, the coach has one fix', sellThroughLow: 'sell-through low for 2+ weeks', inBand: 'in band', afterStop: 'stopped, switch suggested' } as const;
    return g.verdicts.map((v) => `${v.name}: ${word[v.verdict]} (${why[v.reason]})`);
  },

  /** GL-6: what to make instead */
  switchTo: ({ persona, day }) => {
    const g = growthFor(persona, day);
    if (!g) return notInLoop(persona, day);
    const lines: string[] = [];
    for (const [sku, list] of Object.entries(g.switchTo)) {
      const name = g.verdicts.find((v) => v.id === sku)?.name ?? sku;
      lines.push(`Instead of ${name}: open gaps on the same line, largest first`);
      for (const s of list.slice(0, 2)) lines.push(`${s.name}: ${s.gapPerWeek.approx ? '~' : ''}${range(s.gapPerWeek)} a week unserved · ${s.confidence}`);
    }
    return lines.length ? lines.slice(0, 4) : ['No SKU needs a switch this week.'];
  },

  /** GL-3, GL-4: SKU Health Coach */
  coach: ({ persona, day }) => {
    const g = growthFor(persona, day);
    if (!g) return notInLoop(persona, day);
    const c = g.coach;
    if (!c) return ['Nothing to fix this week.'];
    return [
      `${c.skuName}: ${fmt(c.clicks)} clicks ÷ ${fmt(c.views)} views = ${c.fix.ctrDisplay} click-through vs ${c.fix.similarDisplay} for similar listings`,
      `${fmt(c.orders)} orders ÷ ${fmt(c.clicks)} clicks = ${c.conversionDisplay} conversion → one fix: change the main photo`,
    ];
  },

  /** PI-2: price position */
  pricePosition: ({ persona, day }) => {
    const x = stackOf(persona);
    if (!x) return ['Resellers don’t see this tab: it needs the seller-type and GST/Udyam checks.'];
    const { prod, stack } = x;
    const { price } = priceOn(persona, day, stack.listPrice);
    const third = THIRD[listingPricePosition(prod.type, price)];
    return [
      'Position = share of similar delivered orders priced below yours, in thirds: under ⅓ Low · ⅓–⅔ Mid · over ⅔ High',
      `${rs(price)} → ${third} third · ${STATUS_WORD[checkListingPrice(prod.type, price, stack.breakEven)]}`,
      'Shown in thirds, never as a number, so the cut-off can’t be read off the screen',
    ];
  },

  /** PI-3: auto price-hold */
  priceHold: ({ persona, day }) => {
    const x = stackOf(persona);
    if (!x) return ['Resellers don’t see this tab: it needs the seller-type and GST/Udyam checks.'];
    const { prod, stack } = x;
    const now = priceOn(persona, day, stack.listPrice);
    if (!now.edited)
      return [`No price edit yet: ${rs(stack.listPrice)} still ${STATUS_WORD[checkListingPrice(prod.type, stack.listPrice, stack.breakEven)]} · launch slot kept`, persona === EDIT.persona ? `Scripted edit on D${EDIT.day} (${short(EDIT.day)}): ${rs(EDIT.price)}` : ''].filter(Boolean);
    const status = checkListingPrice(prod.type, now.price, stack.breakEven);
    return [
      `D${EDIT.day} (${short(EDIT.day)}): price edited ${rs(stack.listPrice)} → ${rs(now.price)}`,
      `${rs(now.price)} re-checked → ${STATUS_WORD[status]}${status === 'qualifies' ? '' : ' → launch slot removed, no number shown'}`,
      `Position ${THIRD[listingPricePosition(prod.type, stack.listPrice)]} → ${THIRD[listingPricePosition(prod.type, now.price)]}`,
    ];
  },

  /** PP-3: the Cluster Pack Point program card */
  packPointProgram: ({ persona }) => {
    const prod = productOf(persona);
    if (!prod || eligibility(records(persona)).status !== 'eligible') return ['Shown only to Factory-verified makers in a Pack Point cluster.'];
    const node = clusterForPincode(nodesSeed.nodes as { city: string; makersPooled?: number; pincodePrefixes?: string[] }[], P[persona].address.pincode);
    const fee = node?.makersPooled !== undefined ? packPointFee(node.makersPooled).feePerDeliveredOrder : null;
    const lines = [`One lot a week to ${node?.city ?? 'the cluster'}; the partner packs, ships and takes returns${fee !== null ? ` for ${rs(fee)} per delivered order` : ''}`];
    if (modeOf(persona) === 'selfShip' && prod) {
      const self = costStack(prod.type, prod.makingCost, prod.marginPct, 'selfShip');
      const pp = costStack(prod.type, prod.makingCost, prod.marginPct, 'packPoint');
      lines.push(`Self-ship: ${costLine(self)} → list ${rs(self.listPrice)}`);
      lines.push(`Pack Point: ${costLine(pp)} → list ${rs(pp.listPrice)} (packaging is inside the fee)`);
    } else {
      const s = costStack(prod.type, prod.makingCost, prod.marginPct, 'packPoint');
      lines.push(`Cost stack: ${costLine(s)} → break-even ${rs(s.breakEven)}, list ${rs(s.listPrice)}`);
    }
    return lines;
  },

  /** PP-4: Pack Point fee */
  packPointFee: () => {
    const base = model.densityFloorMakers;
    const f = packPointFee(base);
    const others = Object.keys(model.staffByPoolSize)
      .filter((k) => !k.startsWith('_') && Number(k) !== base)
      .map(Number);
    return [
      `${rs(Math.round(f.monthlyCost))} a month ÷ ${fmt(f.ordersPerMonth)} orders = ${rs2(f.costPerOrderHandled)} per order handled`,
      `× ${fmt(model.partnerMarginMultiplier)} partner margin = ${rs2(f.feePerOrderHandled)} ÷ ${fmt3(1 - model.blendedRtoRate)} (${pct(model.blendedRtoRate)} RTO) = ${rs(Math.round(f.feePerDeliveredOrderExact * 10) / 10)}`,
      `→ ${rs(f.feePerDeliveredOrder)} per delivered order at ${fmt(base)} makers (${others.map((n) => `${rs(packPointFee(n).feePerDeliveredOrder)} at ${n}`).join(', ')})`,
    ];
  },

  /** PP-5: lot inbound */
  lotInbound: ({ persona, day }) => {
    const prod = productOf(persona);
    if (!prod || modeOf(persona) !== 'packPoint') return ['Shown to makers who ship through the Pack Point (Samar, Agra).'];
    const lot = suggestedLot(prod.type, prod.makingCost);
    const perDay = likelyOrdersPerDay(prod.type);
    const lines = [
      `First lot = ${lot.days} days of expected sales: (${fmt(perDay.low)} + ${fmt(perDay.high)}) ÷ 2 = ${fmt(lot.dailyRunRate)} a day × ${lot.days} = ${fmt(lot.dailyRunRate * lot.days)} → ${fmt(lot.units)} (${rs(lot.atCost)} at cost)`,
    ];
    if (prod.type !== lotSeed.productType) return lines;
    if (day < lotSeed.day) return [...lines, `Inbound at ${lotSeed.node} on D${lotSeed.day} (${short(lotSeed.day)})`];
    const r = lotInbound(lotSeed);
    return [
      ...lines,
      `${fmt(r.expected)} expected · ${fmt(r.received)} received · every unit weighed: ${fmt(lotSeed.packedWeightG)} g ± ${fmt(lotSeed.weightTolerancePct)}% = ${fmt(r.weightRangeG.low)}–${fmt(r.weightRangeG.high)} g`,
      `Storage free to D${r.storageFreeUntilDay} (${short(r.storageFreeUntilDay)}), then ${fmt(r.received)} × ${rs(lotSeed.storage.perUnitPerDay)} = ${rs2(r.storagePerDayAfterFree)} a day`,
    ];
  },
};
