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
  MANUFACTURER_TYPES,
  formatDate,
  growthAt,
  launchProgress,
  likelyOrdersPerDay,
  likelyShare,
  listingPricePosition,
  lotInbound,
  packPointFee,
  packPointsNear,
  pctDisplay,
  productTypeName,
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
import { MAX_PRICE_CHECKS } from '../pages/panel/catalog/launchCheck';
import { stockAtNode } from '../pages/panel/warehouse/lots';
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

const GROWTH_CACHE = new Map<string, ReturnType<typeof growthAt>>();
function growthFor(p: Persona, day: number, coachApplied: { sku: string; day: number } | null = null) {
  if (p !== J) return null;
  const key = `${day}:${coachApplied ? `${coachApplied.sku}@${coachApplied.day}` : '-'}`;
  if (GROWTH_CACHE.has(key)) return GROWTH_CACHE.get(key)!;
  const s = stackOf(J)!;
  const typical = typicalForType(s.prod.type)!;
  const g = growthAt(day, { lot: LOT, leadTimeDays: typical.leadTimeDays, minRun: typical.minRun, makingCost: s.prod.makingCost, listPrice: s.stack.listPrice }, [], coachApplied);
  GROWTH_CACHE.set(key, g);
  return g;
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
// ── Pack Point: Meesho's view (not shown to sellers) ─────────────────────────────────────────────
// The seller sees only Open / Opening soon, the distance and his fee. The cluster economics below (fee by cluster
// size, the opening rule, the fee build-up, sign-up counts) appear only here, labelled as Meesho's view.
type SeedNode = { city: string; status: string; makersPooled?: number; opensAtMakers?: number; makersSignedUp?: number; pincodePrefixes: string[]; location: { lat: number; lon: number } };
const PP_NODES = nodesSeed.nodes as SeedNode[];
const isLiveNode = (n: SeedNode): n is SeedNode & { makersPooled: number } => n.status === 'live' && n.makersPooled !== undefined;
const MEESHO_VIEW = 'Meesho’s view, not shown to sellers';
const POOL_SIZES = Object.keys(model.staffByPoolSize)
  .filter((k) => !k.startsWith('_'))
  .map(Number)
  .sort((a, b) => a - b);
/** "Fee by cluster size: ₹44 at 20 · ₹30 at 40 · ₹26 at 60 · ₹23 at 80 makers; a Pack Point opens only at 40 makers" */
const MEESHO_VIEW_LADDER = (label = true) =>
  `${label ? `${MEESHO_VIEW}: f` : 'F'}ee by cluster size: ${POOL_SIZES.map((n) => `${rs(packPointFee(n).feePerDeliveredOrder)} at ${n}`).join(' · ')} makers; a Pack Point opens only at ${fmt(model.densityFloorMakers)} makers`;
/** "Moradabad: 32/40 makers signed up (sellers see “Opening soon”)" */
const MEESHO_VIEW_SIGNUPS = (label = true) => {
  const s = PP_NODES.filter((n) => n.status === 'opening' && n.makersSignedUp !== undefined)
    .map((n) => `${n.city}: ${fmt(n.makersSignedUp!)}/${fmt(n.opensAtMakers ?? model.densityFloorMakers)} makers signed up (sellers see “Opening soon”)`)
    .join('; ');
  const live = PP_NODES.filter(isLiveNode).map((n) => `${n.city} ${fmt(n.makersPooled)}`).join(', ');
  return `${label ? `${MEESHO_VIEW}: ` : ''}${s}${live ? `; live pools: ${live} makers` : ''}`;
};

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

  /** FO-5: the 5-minute cost check, from his own two numbers (here “Fill demo values”) */
  costCheck: ({ persona }) => {
    const x = stackOf(persona);
    if (!x) return NO_PRODUCT(persona);
    const { prod, stack } = x;
    const status = checkListingPrice(prod.type, stack.listPrice, stack.breakEven);
    return [
      `He types: making cost ${rs(prod.makingCost)}, wants to earn ${rs(stack.takeHome)} per unit (the same as ${fmt(prod.marginPct)}% on the ₹/% switch) · ${modeOf(persona) === 'packPoint' ? 'Pack Point' : 'Self-ship'} from Pickup Address`,
      `Costs per order: ${costLine(stack)} · ${breakEvenLine(stack)}`,
      `Your price: (${fmt(stack.costBeforeGst)} + ${fmt(stack.takeHome)}) × ${gstX(stack)} = ${fmt(Math.round((stack.costBeforeGst + stack.takeHome) * (1 + stack.gstRate) * 100) / 100)} → ${rs(stack.listPrice)} (nearest rupee) · you earn ${rs(stack.takeHome)}`,
      `“Check price” (${fmt(MAX_PRICE_CHECKS)} a day per product, shared with the bot’s Price screen) → ${STATUS_WORD[status]}; nothing shows before he checks`,
    ];
  },

  /** FO-6, FO-7, LW-4: seller type + GST nature + Udyam */
  eligibility: ({ persona }) => {
    const r = P[persona];
    const e = eligibility(records(persona));
    const ok = (c: EligibilityCheck) => (e.failedChecks.includes(c) ? '✗' : '✓');
    const declared = MANUFACTURER_TYPES.includes(r.businessType as BusinessType);
    const seen = e.status === 'eligible' ? 'the maker sees “Factory verified ✓”' : declared ? 'the maker sees a neutral note, no reasons' : 'he sees nothing: the page is Meesho’s as today';
    if (e.failedChecks.includes('gstin')) return ['Silent check: no GSTIN (Enrolment ID) ✗ → not Factory verified', `Shown: ${seen}`];
    return [
      `Silent checks: seller type “${r.businessType}” ${ok('sellerType')} · GST nature ${r.gstNatureOfBusiness.join(', ')} ${ok('gstNature')} · Udyam ${r.udyam?.majorActivity ?? 'none'} ${ok('udyam')}`,
      `→ ${e.status === 'eligible' ? 'Factory verified: “Direct from the maker” label for buyers, Pack Point access' : 'not Factory verified: no “Direct from the maker” label, no Pack Point'} · shown: ${seen}`,
      'Not a gate: Factory Launch is open to every seller whose price qualifies (price ≤ the cap, listed, stock committed)',
    ];
  },

  /** FO-8: shipping choice at Pickup Address (seller view) + the cluster economics the seller doesn't see */
  fulfilment: ({ persona }) => {
    const r = P[persona];
    const near = packPointsNear(PP_NODES, r.address.pincode, model.nearRadiusKm);
    if (!near) return [`${r.address.city} has no Pack Point cluster yet → “No Pack Point near you yet. You’ll be notified when one opens.” Self-ship, as today.`, MEESHO_VIEW_LADDER()];
    const seen = near.map((n) => `${n.node.city} ${n.km === null ? 'in your district' : `${fmt(n.km)} km`} · ${isLiveNode(n.node) ? `Open, ${rs(packPointFee(n.node.makersPooled).feePerDeliveredOrder)} + GST` : 'Opening soon'}`);
    return [
      `Seller sees: ${seen.join('; ')} (only Pack Points within ${fmt(model.nearRadiusKm)} km; city-centre distances, rounded to 10 km)`,
      MEESHO_VIEW_SIGNUPS(),
      MEESHO_VIEW_LADDER(),
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
      `First lot ≈ ${fmt(Math.round(lot.dailyRunRate * 10) / 10)} a day × ${lot.days} days = ${fmt(Math.round(lot.dailyRunRate * lot.days))} → ${fmt(lot.units)} (${rs(lot.atCost)} at cost)`,
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
      `${rs(stack.listPrice)} is above break-even ${rs(stack.breakEven)} and within the launch price cap → ${STATUS_WORD[checkListingPrice(prod.type, stack.listPrice, stack.breakEven)]} · any price can go live; a typed price shows its launch status after “Check price” (${MAX_PRICE_CHECKS} a day per product)`,
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
      `Images ✓ · Details ✓ · Price set ✓ (${rs(stack.listPrice)}) · Lot ${fmt(lot.units)} ✓ → Go live`,
      `Factory Launch: ${ok ? 'Qualifies' : 'Not eligible at this price'} (a separate line: it never blocks Go live)`,
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
    const e = eligibility(records(persona));
    if (e.status !== 'eligible')
      return [
        `${RESULT[e.status]} → no banner, no sidebar item, no pinned notice: Meesho as today.`,
        `The eligibility drawer, if opened, says “Not eligible for Factory Launch” and why: ${e.failedChecks.join(', ')} failed (eligibility() checks) · he still sells normally.`,
      ];
    const own = productOf(persona);
    if (!own || !launch.productTypes.includes(own.type))
      return [`${own ? productTypeName(own.type) : 'This product'} has no order book in ${launch.name} (${launch.category}) → a slim “no open order book” note on Home while commitments are open; sidebar item and pinned notice still show.`];
    const total = slots(own.type);
    const taken = launch.slotsTakenBeforeJasmeet;
    const told = day > calendar.jumps.onboarding;
    const listed = day >= calendar.jumps.listing;
    const committed = day > L.commitmentsCloseDay;
    // scripted story: the price row turns ✓ with the listing (a qualifying “Check price” in the cost check ticks it earlier)
    const n = 2 + 2 * Number(listed) + Number(committed);
    const mark = (b: boolean) => (b ? '✓' : '○');
    const lines = [
      `Slots: ${fmt(total)} − ${fmt(taken)} taken = ${fmt(total - taken)} left for ${productTypeName(own.type)} (the order book’s count, before ${firstName(persona)} commits)`,
      `Dates: commitments close D${L.commitmentsCloseDay} (${short(L.commitmentsCloseDay)}) · stock ready D${L.stockAtNodeDay} (${short(L.stockAtNodeDay)}) · live D${L.liveFromDay}–D${L.liveToDay} (${shortSpan(L.liveFromDay, L.liveToDay)})`,
      `Checklist (banner and “Check my eligibility” drawer, one model): manufacturer ✓ + records agree ✓ (GST/Udyam checks) + price qualifies ${mark(listed)} (his last “Check price”, or his listing from D${calendar.jumps.listing}) + product listed ${mark(listed)}${told ? '' : ` (“Tell us what you make” first; the seeded product counts from D${calendar.jumps.onboarding + 1})`} + stock committed ${mark(committed)} (counts after D${L.commitmentsCloseDay}) = ${n} of 5`,
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
    const lines = [
      `${c.skuName}: ${fmt(c.clicks)} clicks ÷ ${fmt(c.views)} views = ${c.fix.ctrDisplay} click-through vs ${c.fix.similarDisplay} for similar listings`,
      `${fmt(c.orders)} orders ÷ ${fmt(c.clicks)} clicks = ${c.conversionDisplay} conversion → one fix: change the main photo`,
    ];
    // The check a week after the fix, as the showcase jumps set it up (photo changed on D28, checked on D35).
    const after = growthFor(persona, Math.max(day, g.asOfDay + growthSeed.coachCheckAfterDays), { sku: c.skuId, day: g.asOfDay })?.coachFollowUp?.result;
    if (after) {
      lines.push(
        `Applied on D${g.asOfDay} → checked on D${g.asOfDay + growthSeed.coachCheckAfterDays}: ${fmt(after.clicks)} ÷ ${fmt(after.views)} = ${after.ctrAfterDisplay} click-through (was ${after.ctrBeforeDisplay}); ${fmt(after.orders)} ÷ ${fmt(after.clicks)} = ${after.conversionDisplay} conversion`,
        after.nextFix ? 'Still in the bottom quarter of similar listings → the next fix' : 'Out of the bottom quarter of similar listings → no fix needed that week; not applied after a week → “Still pending”',
      );
    }
    return lines;
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
    lines.push(`${MEESHO_VIEW}: ${node?.city ?? 'the cluster'} pools ${node?.makersPooled !== undefined ? fmt(node.makersPooled) : '–'} makers; a Pack Point opens only at ${fmt(model.densityFloorMakers)}. ${MEESHO_VIEW_SIGNUPS(false)}`);
    return lines;
  },

  /** PP-4 / PP-10: the Pack Point fee build-up and ladder. Meesho's view only: the seller sees just his ₹ per delivered order. */
  packPointFee: () => {
    const base = model.densityFloorMakers;
    const f = packPointFee(base);
    const marginPct = fmt(Math.round((model.partnerMarginMultiplier - 1) * 100));
    const norm = model.partnerMarginNorm;
    return [
      `${MEESHO_VIEW} (the seller sees only “${rs(f.feePerDeliveredOrder)} + GST per delivered order”: 18% GST on this service, which GST-registered sellers claim back as input credit, so it isn’t counted in their cost; every price uses ${rs(f.feePerDeliveredOrder)})`,
      `${rs(Math.round(f.monthlyCost))} a month ÷ ${fmt(f.ordersPerMonth)} orders = ${rs2(f.costPerOrderHandled)} per order handled → × ${fmt(model.partnerMarginMultiplier)} (+ ${marginPct}% partner margin, 3PL norm ${fmt(norm.low * 100)}–${fmt(norm.high * 100)}%) = ${rs2(f.feePerOrderHandled)} → ÷ (1 − ${fmt3(model.blendedRtoRate)}) = ÷ ${fmt3(1 - model.blendedRtoRate)} (${pct(model.blendedRtoRate)} RTO) = ${rs(Math.round(f.feePerDeliveredOrderExact * 10) / 10)} → ${rs(f.feePerDeliveredOrder)} per delivered order at ${fmt(base)} makers`,
      MEESHO_VIEW_LADDER(false),
      MEESHO_VIEW_SIGNUPS(false),
    ];
  },

  /** PP-5: lot inbound */
  lotInbound: ({ persona, day }) => {
    const prod = productOf(persona);
    if (!prod || modeOf(persona) !== 'packPoint') return ['Shown to makers who ship through the Pack Point (Samar, Agra).'];
    const lot = suggestedLot(prod.type, prod.makingCost);
    const perDay = likelyOrdersPerDay(prod.type);
    const lines = [
      `First lot = ${lot.days} days of expected sales: (${fmt(perDay.low)} + ${fmt(perDay.high)}) ÷ 2 = ${fmt(Math.round(lot.dailyRunRate * 10) / 10)} a day × ${lot.days} = ${fmt(Math.round(lot.dailyRunRate * lot.days))} → ${fmt(lot.units)} (${rs(lot.atCost)} at cost)`,
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

  /** PP-6: stock at the Pack Point (Samar's received lot) */
  stockAtNode: ({ persona, day }) => {
    const s = persona === lotSeed.persona ? stockAtNode(day, modeOf(persona) === 'packPoint') : null;
    if (!s) return [`Stock shows once a lot is received at the Pack Point (Samar’s: D${lotSeed.day}, ${short(lotSeed.day)}).`];
    const held = s.rows[0]?.daysHeld ?? 0;
    return [
      `${fmt(s.units)} on hand (${s.rows.map((r) => `${r.size ? `UK ${r.size}` : ''} ${fmt(r.units)}`.trim()).join(' · ')}) · held ${fmt(held)} days since D${lotSeed.day}; no later sales are seeded, so on hand = received`,
      `Free storage: D${lotSeed.day} + ${fmt(lotSeed.storage.freeDays)} days = D${s.freeUntilDay} (${short(s.freeUntilDay)}); then ${fmt(s.units)} × ${rs(s.perUnitPerDay)} = ${rs2(s.perDayAfterFree)} a day`,
      s.chargedDays > 0 ? `Charged so far: ${fmt(s.chargedDays)} days × ${rs2(s.perDayAfterFree)} = ${rs2(s.chargedSoFar)}` : 'Nothing charged yet',
    ];
  },
};
