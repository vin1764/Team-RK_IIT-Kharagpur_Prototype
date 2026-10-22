// Presenter's demo guide (Prototype controls → Demo guide): the 8-step script of plan §10, each step a
// one-click jump that sets persona + day + EN and opens the right page. Presenter-facing, so English only.
// Every number in the step text is computed here from the engine (src/engine/ui.ts) or the seed JSON;
// demoGuide.test.ts recomputes each one so the script can't drift from the screens.
import calendar from '../data/calendar.json';
import launch from '../data/launch.json';
import lotSeed from '../data/packPointLot.json';
import personas from '../data/personas.json';
import { onboarding, paths } from '../app/paths';
import {
  checkListingPrice,
  costStack,
  dayLabel,
  demandForType,
  productTypeName,
  eligibility,
  formatDate,
  growthAt,
  launchProgress,
  likelyOrdersPerDay,
  listingPricePosition,
  lotInbound,
  suggestedLot,
  typicalForType,
  type MakerRecords,
  type ProductTypeId,
} from '../engine/ui';
import { BOT_FILLED_COUNT, MAKER_COUNT } from '../pages/panel/catalog/bot';
import { withDemoParams, type Lang, type Persona } from '../store/demo';

const J = personas.jasmeet;
const S = personas.samar;
const R = personas.reseller;
const J_TYPE = J.product.type as ProductTypeId;
const S_TYPE = S.product.type as ProductTypeId;
const D = calendar.jumps;

const shortDate = (iso: string) => formatDate(iso).split(' ').slice(0, 2).join(' ');
const firstName = (name: string) => name.split(' ')[0]!;
const POSITION_LABEL = { low: 'Low', mid: 'Mid', high: 'High' } as const;

function makerRecords(p: typeof J | typeof R): MakerRecords {
  return { taxId: p.taxId, businessType: p.businessType, gstNatureOfBusiness: p.gstNatureOfBusiness, udyamMajorActivity: p.udyam.majorActivity } as MakerRecords;
}

/** The reseller's cost check (team, 22 Oct 2026): his bought-in bottle at his own margin, self-ship. */
function resellerNumbers() {
  const p = R.product!;
  const s = costStack(p.type as ProductTypeId, p.makingCost, p.marginPct, 'selfShip');
  return {
    resellerCost: p.makingCost,
    resellerEarn: s.takeHome,
    resellerPrice: s.listPrice,
    resellerQualifies: checkListingPrice(p.type as ProductTypeId, s.listPrice, s.breakEven) === 'qualifies',
  };
}

/** Every value the guide quotes, from the engine and the seed. */
export function guideNumbers() {
  const stack = costStack(J_TYPE, J.product.makingCost, J.product.marginPct, 'selfShip');
  const typical = typicalForType(J_TYPE)!;
  const lot = launch.commit.jasmeet.units;
  const live = launchProgress(launch.dailyOrders, lot, D.liveLaunch);
  const expected = likelyOrdersPerDay(J_TYPE);
  const g = growthAt(D.restock, {
    lot,
    leadTimeDays: typical.leadTimeDays,
    minRun: typical.minRun,
    makingCost: J.product.makingCost,
    listPrice: stack.listPrice,
  })!;
  const editPrice = launch.priceEdit.price;
  const inbound = lotInbound(lotSeed);
  return {
    listPrice: stack.listPrice,
    takeHome: stack.takeHome,
    makingCost: stack.makingCost,
    breakEven: stack.breakEven,
    listQualifies: checkListingPrice(J_TYPE, stack.listPrice, stack.breakEven) === 'qualifies',
    category: launch.category,
    jasmeetType: productTypeName(J_TYPE),
    gapLow: demandForType(J_TYPE).gapPerWeek.low,
    bandLow: demandForType(J_TYPE).priceBand!.low,
    bandHigh: demandForType(J_TYPE).priceBand!.high,
    jasmeetEligible: eligibility(makerRecords(J)).status,
    ...resellerNumbers(),
    botFills: BOT_FILLED_COUNT,
    makerAdds: MAKER_COUNT,
    suggestedLot: suggestedLot(J_TYPE, J.product.makingCost).units,
    lot,
    ordersToday: live.today,
    expectedLow: expected.low,
    expectedHigh: expected.high,
    soldToDate: live.soldToDate,
    listingScore: launch.listingScoreLabel,
    restockBatch: g.restock.nextBatch,
    restockStartBy: shortDate(g.restock.startBy),
    coachSku: g.coach?.skuId ?? null,
    coachFix: g.coach?.fix.fix ?? null,
    switchFor: Object.keys(g.switchTo),
    editPrice,
    editQualifies: checkListingPrice(J_TYPE, editPrice, stack.breakEven) === 'qualifies',
    editPosition: POSITION_LABEL[listingPricePosition(J_TYPE, editPrice)],
    samarCity: S.address.city,
    samarLot: suggestedLot(S_TYPE, S.product.makingCost).units,
    samarReceived: inbound.received,
  };
}

export interface GuideJump {
  label: string;
  persona: Persona;
  day: number;
  /** route, possibly with its own query (e.g. ?tab=FACTORY_LAUNCH) */
  path: string;
  /** language to land in (showcase jumps); guide jumps land in English */
  lang?: Lang;
}

export interface GuideStep {
  n: number;
  day: number;
  persona: Persona;
  title: string;
  body: string;
  jump: GuideJump;
  /** secondary links for the same step */
  also: GuideJump[];
}

/** The route plus ?persona=&day=&lang=en, keeping the route's own query. */
export function jumpHref(j: GuideJump): string {
  const [path, query = ''] = j.path.split('?') as [string, string?];
  return `${path}${withDemoParams(query, { persona: j.persona, day: j.day, lang: 'en' })}`;
}

export function buildGuide(): GuideStep[] {
  const n = guideNumbers();
  const jn = firstName(J.name);
  const sn = firstName(S.name);
  const yes = (b: boolean, y: string, no: string) => (b ? y : no);
  const step = (
    i: number,
    day: number,
    persona: Persona,
    title: string,
    body: string,
    jump: Omit<GuideJump, 'persona' | 'day'> & Partial<GuideJump>,
    also: GuideJump[] = [],
  ): GuideStep => ({ n: i, day, persona, title, body, jump: { persona, day, ...jump }, also });

  return [
    step(
      1,
      D.onboarding,
      'jasmeet',
      'Outreach, onboarding, what she makes',
      `${jn} gets a ${n.category} invitation (no product named) → Meesho’s own sign-up → onboarding → finish screen: she picks the ${n.jasmeetType} → teaser “about ${n.gapLow} orders a week at ₹${n.bandLow}–${n.bandHigh}” → cost check: she types ₹${n.makingCost} cost and ₹${n.takeHome} to earn → “Your price: ₹${n.listPrice} · you earn ₹${n.takeHome}” → Check price: ${yes(n.listQualifies, 'qualifies', 'doesn’t qualify')} → Check my eligibility opens the checklist drawer.`,
      { label: 'Open outreach', persona: 'jasmeet', day: D.onboarding, path: onboarding.outreach },
      [
        { label: 'Sign-up', persona: 'jasmeet', day: D.onboarding, path: onboarding.signup },
        { label: 'Finish screen: what she makes', persona: 'jasmeet', day: D.onboarding, path: `${onboarding.done}?state=picked` },
      ],
    ),
    step(
      2,
      D.onboarding,
      'jasmeet',
      'Factory verified · resellers can join, but their margin prices them out',
      `Business Details: GST + Udyam checks run silently → ${yes(n.jasmeetEligible === 'eligible', 'Factory verified ✓', 'no badge')} (the “Direct from the maker” label and Pack Point access; not a launch gate). As Reseller: cost check ₹${n.resellerCost} + ₹${n.resellerEarn} to earn → “Your price: ₹${n.resellerPrice}” → Check price: ${yes(n.resellerQualifies, 'qualifies', 'not eligible at this price')}. He can still list and sell at ₹${n.resellerPrice}.`,
      { label: 'Open Business Details', path: onboarding.businessDetails },
      [{ label: 'Reseller’s cost check', persona: 'reseller', day: D.onboarding, path: `${onboarding.done}?state=checked` }],
    ),
    step(
      3,
      D.listing,
      'jasmeet',
      'Create from photos',
      `Create from photos → three short screens: Meesho fills ${n.botFills}, she adds ${n.makerAdds} → Price: List at ₹${n.listPrice} · take home ₹${n.takeHome}, ${yes(n.listQualifies, 'Qualifies', 'Doesn’t qualify')} → Go live.`,
      { label: 'Open Home', path: paths.home },
    ),
    step(
      4,
      D.commit,
      'jasmeet',
      'Factory Launch commit',
      `Promotions → Factory Launch → commits ${n.lot} units → Commit.`,
      { label: 'Open Factory Launch', path: paths.factoryLaunch },
    ),
    step(
      5,
      D.liveLaunch,
      'jasmeet',
      'Live launch',
      `Live launch: ${n.ordersToday} orders today, expected ${n.expectedLow}–${n.expectedHigh}, ${n.soldToDate} of ${n.lot} sold; listing score ${n.listingScore}.`,
      { label: 'Open live launch', path: paths.factoryLaunchLive },
      [{ label: 'Listing score (Quality)', persona: 'jasmeet', day: D.liveLaunch, path: paths.quality }],
    ),
    step(
      6,
      D.restock,
      'jasmeet',
      'Growth loop',
      `Inventory: restock “Start ${n.restockBatch} by ${n.restockStartBy}”; Business Dashboard coach (lunch box): change the main photo; sipper: what to make instead.`,
      { label: 'Open Inventory', path: paths.inventory },
      [{ label: 'Business Dashboard', persona: 'jasmeet', day: D.restock, path: paths.businessDashboard }],
    ),
    step(
      7,
      D.priceEdit,
      'jasmeet',
      'Price position',
      `Manage Pricing → Price position: price raised to ₹${n.editPrice} → “${yes(n.editQualifies, 'Qualifies', 'Doesn’t qualify · slot removed')}”, position ${n.editPosition}.`,
      { label: 'Open Price position', path: paths.pricePosition },
    ),
    step(
      8,
      D.packPointLot,
      'samar',
      'Cluster Pack Point lot',
      `${sn} (${n.samarCity}): Warehouse → Cluster Pack Point → first lot of ${n.samarReceived} pairs in, every pair weighed.`,
      { label: `Open Warehouse as ${sn}`, path: paths.warehouse },
    ),
  ];
}

export const DEMO_GUIDE: GuideStep[] = buildGuide();

/** "D23 · 16 Nov" */
export const stepDayLabel = (day: number) => `D${day} · ${dayLabel(day).split(' ').slice(0, 2).join(' ')}`;
