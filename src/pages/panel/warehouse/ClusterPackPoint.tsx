// Warehouse → "Cluster Pack Point" tab (the page's second tab, beside Meesho Warehouse; Warehouse.tsx decides who gets
// the tabs). Header: "Cluster Pack Point" NEW, one line, his status, the main action. Before he joins he sees only
// the Overview; once he ships through a Pack Point, four sub-tabs:
//   Overview (PP-3, PP-4)  Pack Points near you (within 150 km, sorted by distance; "₹30 + GST per delivered order"
//                          at each open one, "Use this Pack Point" / "Join waitlist"), his own cost at the Pack Point
//                          beside self-ship, each with its Factory Launch status (never B), storage terms, and the
//                          switch: "Switch to Pack Point" opens a confirm panel in place (SwitchConfirm).
//   Lots (PP-5)            every lot as a row (Planned / In transit / Received), newest first, "Plan a lot"; a row
//                          opens its detail (Samar's D50 lot: counted, every pair weighed, size split).
//   Stock at Pack Point (PP-6)  per product and size: on hand, days held, free storage end, then ₹0.29 per unit per day.
//   Returns (PP-8)         returns received at the node with weight check and grade (empty until he has returns).
// Seller view only: no cluster economics (fee by size, opening rule, fee build-up, maker counts) — Meesho's view, in
// the showcase sidebar. Every number comes from src/engine/ui.ts or the seed JSON; none is typed here.
// URL (showcase jumps): ?view=overview|lots|stock|returns, &lot=<id> opens a lot; ?drawer=packpoint opens the drawer;
// ?pp=confirm opens the confirm panel; ?pp=lot opens the lot planner (Lots tab).
import { useMemo, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import lotSeed from '../../../data/packPointLot.json';
import model from '../../../data/packPointModel.json';
import { Button, InfoTip, Pill, cx } from '../../../components/ui';
import { checkListingPrice, costStack, dayLabel, likelyOrdersPerDay, lotInbound, productTypeName, sizeSplitFor, suggestedLot, typicalForType, type ProductTypeId } from '../../../engine/ui';
import { fmt, useT, type T as Tr } from '../../../i18n';
import { useDemo } from '../../../store/demo';
import { useShipSwitch, type PlannedLot, type ShipMode } from '../../../store/fulfilmentSwitch';
import { usePersona } from '../../../store/onboarding';
import { usePriceEdits } from '../../../store/priceEdits';
import { useScriptedListing } from '../../../store/timeline';
import { NearList } from '../../onboarding/packpoint/NearList';
import { PackPointDrawer } from '../../onboarding/packpoint/PackPointDrawer';
import { C2M } from '../../onboarding/stepper/copy';
import { useLiveListings } from '../catalog-uploads/liveListings';
import { SubTabs } from '../catalog-uploads/parts';
import { LAUNCH } from '../factory-launch/launch';
import { MerlinTable, type Col } from '../factory-launch/parts';
import { effectivePriceEdit } from '../manage-pricing/priceHold';
import { NewTag } from '../promotions/PromoParts';
import { FirstLotPanel, type LotProduct } from './FirstLotPanel';
import { lotRows, stockAtNode, type LotRow, type LotStatus } from './lots';
import { PACK_POINT_NODES, packPointOffer, type PackPointNode, type PackPointOffer } from './offer';
import { SwitchConfirm } from './SwitchConfirm';
import { warehouseShip, type SwitchListing } from './switch';

type Node = PackPointNode;
type LiveNode = Node & { makersPooled: number };
const NODES = PACK_POINT_NODES;
const isLive = (n: Node | undefined | null): n is LiveNode => !!n && n.status === 'live' && n.makersPooled !== undefined;

const CARD = 'bg-white py-7 px-8 rounded-lg border-2 border-solid border-secondary-bg my-4';
const H1 = 'm-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7';
const H3 = 'm-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6';
const TEXT = 'm-0 p-0 text-primary-text font-normal font-body text-lg leading-5';
const SUB = 'm-0 p-0 text-secondary-text font-normal font-body text-lg leading-5';

const rupees = (n: number) => `₹${fmt(n)}`;

export type PackPointView = 'overview' | 'lots' | 'stock' | 'returns';
export const PACK_POINT_VIEWS: PackPointView[] = ['overview', 'lots', 'stock', 'returns'];

function Box({ title, children, c2m, id, right }: { title: ReactNode; children: ReactNode; c2m: string; id?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-solid border-tertiary-border p-4" data-c2m={c2m} data-c2m-id={c2m} id={id}>
      <div className="flex items-center justify-between gap-3">
        <h3 className={H3}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Line({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className={cx('flex justify-between gap-4', strong ? 'font-heading text-xl leading-6 text-primary-text' : 'text-lg leading-5')}>
      <span className={strong ? undefined : 'text-secondary-text'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const Rule = () => <hr className="m-0 border-0 border-t border-solid border-tertiary-border" />;

/** Self-ship stack for the type, or null when the type has no self-ship packaging cost. */
function selfShipStack(type: ProductTypeId, makingCost: number, marginPct: number) {
  try {
    return costStack(type, makingCost, marginPct, 'selfShip');
  } catch {
    return null;
  }
}

/** Factory Launch status of a list price (engine: checkListingPrice; B stays inside). Only for launch product types. */
function LaunchStatus({ type, price, breakEven, t }: { type: ProductTypeId; price: number; breakEven: number; t: Tr }) {
  if (!LAUNCH.productTypes.includes(type)) return null;
  const ok = checkListingPrice(type, price, breakEven) === 'qualifies';
  return (
    <span className="inline-flex shrink-0" data-pp-fl={ok ? 'qualifies' : 'notEligible'}>
      <Pill tone={ok ? 'success' : 'warning'} className="!text-body-small">
        {t(ok ? 'pp.fl.qualifies' : 'pp.fl.notEligible')}
      </Pill>
    </span>
  );
}

/** PP-4: his own cost per unit at the Pack Point (cost stack in Pack Point mode), with self-ship below it. */
function StackCard({ type, makingCost, marginPct, node, onPP, t }: { type: ProductTypeId; makingCost: number; marginPct: number; node: LiveNode; onPP: boolean; t: Tr }) {
  const s = costStack(type, makingCost, marginPct, 'packPoint', node.makersPooled);
  const own = selfShipStack(type, makingCost, marginPct);
  return (
    <Box title={t('pp.stack.title', { city: node.city })} c2m="PP-4">
      <p className={SUB}>{productTypeName(type)}</p>
      <div className="flex flex-col gap-1.5" data-stack>
        <Line label={t('pp.stack.making')} value={rupees(s.makingCost)} />
        <Line
          label={
            <span className="inline-flex items-center gap-1">
              {t('pp.stack.fee')} <InfoTip text={C2M.ppFeeGstTip} />
            </span>
          }
          value={rupees(s.fees.packPointFee ?? 0)}
        />
        <Line label={t('pp.stack.shipping')} value={rupees(s.fees.shippingAndFixed)} />
        <Line label={t('pp.stack.returns')} value={rupees(s.fees.returnsBuffer)} />
        <Rule />
        <Line strong label={t('pp.stack.breakEven', { pct: fmt(Math.round(s.gstRate * 100)) })} value={rupees(s.breakEven)} />
        <Line label={t('pp.stack.takeHome')} value={rupees(s.takeHome)} />
        <Line strong label={t('pp.stack.list')} value={rupees(s.listPrice)} />
      </div>
      <div className="flex" data-stack-fl>
        <LaunchStatus type={type} price={s.listPrice} breakEven={s.breakEven} t={t} />
      </div>
      {own && (
        <>
          <Rule />
          <div className="flex flex-wrap items-center justify-between gap-2" data-stack-selfship>
            <p className={cx(TEXT, 'font-button')}>{t(onPP ? 'pp.stack.selfShipAlt' : 'pp.stack.selfShipNow', { breakEven: fmt(own.breakEven), list: fmt(own.listPrice) })}</p>
            <LaunchStatus type={type} price={own.listPrice} breakEven={own.breakEven} t={t} />
          </div>
        </>
      )}
    </Box>
  );
}

// ── Lots (PP-5) ────────────────────────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<LotStatus, 'info' | 'warning' | 'success'> = { planned: 'info', inTransit: 'warning', received: 'success' };

function LotStatusPill({ status, t }: { status: LotStatus; t: Tr }) {
  return (
    <span className="inline-flex" data-lot-status={status}>
      <Pill tone={STATUS_TONE[status]} bordered className="!text-body-small">
        {t(`pp.lots.status.${status}`)}
      </Pill>
    </span>
  );
}

/** "First lot", "Lot 2"… in the order they were planned (the seeded lot is his first). */
function lotName(row: LotRow, all: LotRow[], t: Tr) {
  const ordered = [...all].sort((a, b) => a.day - b.day || (a.seeded ? -1 : b.seeded ? 1 : a.id.localeCompare(b.id, undefined, { numeric: true })));
  const n = ordered.findIndex((r) => r.id === row.id) + 1;
  return n === 1 ? t('pp.lots.first') : t('pp.lots.lotN', { n: fmt(n) });
}

function productsLine(row: LotRow) {
  return row.lines.map((l) => productTypeName(l.type)).join(', ');
}

function LotsList({ rows, onOpen, t }: { rows: LotRow[]; onOpen: (id: string) => void; t: Tr }) {
  const cols: Col[] = [
    { key: 'lot', header: t('pp.lots.col.lot'), width: '18%' },
    { key: 'products', header: t('pp.lots.col.products') },
    { key: 'units', header: t('pp.lots.col.units'), width: '12%' },
    { key: 'date', header: t('pp.lots.col.date'), width: '22%' },
    { key: 'status', header: t('pp.lots.col.status'), width: '16%' },
  ];
  const data = rows.map((r) => ({
    id: r.id,
    lot: (
      <Button variant="text" size="sm" className="!h-auto !px-0 py-0.5" onClick={() => onOpen(r.id)} data-lot-open={r.id}>
        {lotName(r, rows, t)}
      </Button>
    ),
    products: <span className={TEXT}>{productsLine(r)}</span>,
    units: <span className={TEXT}>{fmt(r.units)}</span>,
    date: <span className={TEXT}>{t(r.seeded ? 'pp.lots.inbound' : 'pp.lots.send', { date: dayLabel(r.day) })}</span>,
    status: <LotStatusPill status={r.status} t={t} />,
  }));
  return (
    <div className="overflow-hidden rounded-lg border border-solid border-tertiary-border" data-lots-table>
      <MerlinTable cols={cols} rows={data} label={t('pp.sub.lots')} />
    </div>
  );
}

function SizeTable({ type, units, t }: { type: ProductTypeId; units: number; t: Tr }) {
  const split = sizeSplitFor(type, units) ?? [];
  if (!split.length) return null;
  const cols: Col[] = [{ key: 'label', header: t('pp.lot.size') }, ...split.map((s) => ({ key: s.size, header: t('pp.lot.uk', { size: s.size }) }))];
  const row = { id: 'units', label: t('pp.lot.pairs'), ...Object.fromEntries(split.map((s) => [s.size, fmt(s.units)])) };
  return (
    <div className="overflow-hidden rounded-lg border border-solid border-tertiary-border" data-size-split>
      <MerlinTable cols={cols} rows={[row]} label={t('pp.lot.size')} />
    </div>
  );
}

/** The seeded lot (Samar, Agra, D50): counted and every pair weighed, the size split, and how it was sized. */
function SeededLotDetail({ row, makingCost, t }: { row: LotRow; makingCost: number; t: Tr }) {
  const type = row.lines[0]!.type;
  const lot = suggestedLot(type, makingCost);
  const perDay = likelyOrdersPerDay(type);
  const r = lotInbound(lotSeed);
  return (
    <>
      {row.status === 'received' ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-lot="received">
          <p className={TEXT}>{t('pp.lot.expectedN', { n: fmt(r.expected) })}</p>
          <span className={SUB}>·</span>
          <p className={TEXT}>{t('pp.lot.received', { n: fmt(r.received) })}</p>
          <span className={SUB}>·</span>
          <p className={cx(TEXT, 'inline-flex items-center gap-1')} data-weighed>
            {t('pp.lot.weighed', { n: fmt(r.received), of: fmt(r.received) })}
            <InfoTip
              text={t('pp.lot.weightRule', { w: fmt(lotSeed.packedWeightG), tol: fmt(lotSeed.weightTolerancePct), low: fmt(r.weightRangeG.low), high: fmt(r.weightRangeG.high) })}
            />
          </p>
          <span className={SUB}>·</span>
          <Pill tone="success" bordered className="!text-body-small">
            {t('pp.lot.stocked', { city: row.node })}
          </Pill>
        </div>
      ) : (
        <p className={TEXT} data-lot="planned">
          {t('pp.lot.inboundOn', { city: row.node, date: dayLabel(row.day) })}
        </p>
      )}
      <SizeTable type={type} units={row.units} t={t} />
      <p className={SUB}>{t('pp.lot.basisShort', { days: fmt(lot.days), low: fmt(perDay.low), high: fmt(perDay.high), cost: fmt(lot.atCost) })}</p>
    </>
  );
}

/** A lot he planned: what goes, when, and its cost at making cost. */
function PlannedLotDetail({ row, makingCostOf, t }: { row: LotRow; makingCostOf: (listing: string | undefined, type: ProductTypeId) => number | null; t: Tr }) {
  const costs = row.lines.map((l) => makingCostOf(l.listing, l.type));
  const cost = costs.every((c) => c !== null) ? row.lines.reduce((s, l, i) => s + l.units * costs[i]!, 0) : null;
  return (
    <>
      <div className="flex flex-col gap-1.5" data-lot={row.status}>
        {row.lines.map((l) => (
          <Line key={`${l.listing ?? l.type}`} label={productTypeName(l.type)} value={t('pp.lots.unitsN', { n: fmt(l.units) })} />
        ))}
      </div>
      {row.lines.map((l) => (
        <SizeTable key={`split-${l.listing ?? l.type}`} type={l.type} units={l.units} t={t} />
      ))}
      <p className={TEXT}>{t(row.status === 'planned' ? 'pp.lot.sendOn' : 'pp.lot.sentOn', { city: row.node, date: dayLabel(row.day) })}</p>
      {cost !== null && <p className={SUB}>{t('pp.lot.atCost', { cost: fmt(cost) })}</p>}
    </>
  );
}

// ── Stock at Pack Point (PP-6) and Returns (PP-8) ────────────────────────────────────────────────

function StockPanel({ day, seeded, t }: { day: number; seeded: boolean; t: Tr }) {
  const s = stockAtNode(day, seeded);
  if (!s) {
    return (
      <Box title={t('pp.sub.stock')} c2m="PP-6">
        <p className={SUB} data-stock-empty>
          {t('pp.stock.empty')}
        </p>
      </Box>
    );
  }
  const cols: Col[] = [
    { key: 'product', header: t('pp.stock.col.product') },
    { key: 'size', header: t('pp.stock.col.size'), width: '10%' },
    { key: 'units', header: t('pp.stock.col.units'), width: '12%' },
    { key: 'held', header: t('pp.stock.col.held'), width: '13%' },
    { key: 'free', header: t('pp.stock.col.free'), width: '19%' },
    { key: 'then', header: t('pp.stock.col.then'), width: '20%' },
  ];
  const rows = s.rows.map((r) => ({
    id: `${r.type}-${r.size ?? 'all'}`,
    product: <span className={TEXT}>{productTypeName(r.type)}</span>,
    size: <span className={TEXT}>{r.size ? t('pp.lot.uk', { size: r.size }) : '—'}</span>,
    units: <span className={TEXT}>{fmt(r.units)}</span>,
    held: <span className={TEXT}>{t('pp.stock.days', { n: fmt(r.daysHeld) })}</span>,
    free: <span className={TEXT}>{dayLabel(s.freeUntilDay)}</span>,
    then: <span className={TEXT}>{t('pp.stock.rate', { rate: fmt(s.perUnitPerDay) })}</span>,
  }));
  return (
    <Box title={t('pp.stock.title', { city: s.node })} c2m="PP-6">
      <div className="overflow-hidden rounded-lg border border-solid border-tertiary-border" data-stock-table>
        <MerlinTable cols={cols} rows={rows} label={t('pp.sub.stock')} />
      </div>
      <p className={TEXT} data-stock-summary>
        {t('pp.stock.summary', { n: fmt(s.units), date: dayLabel(s.freeUntilDay), perDay: s.perDayAfterFree.toFixed(2) })}
      </p>
      {s.chargedDays > 0 && (
        <p className={cx(TEXT, 'font-button')} data-stock-charged>
          {t('pp.stock.charged', { amount: s.chargedSoFar.toFixed(2), days: fmt(s.chargedDays) })}
        </p>
      )}
    </Box>
  );
}

function ReturnsPanel({ t }: { t: Tr }) {
  return (
    <Box title={t('pp.sub.returns')} c2m="PP-8">
      <div className="flex flex-col items-center gap-2 py-6 text-center" data-returns-empty>
        <img src="/brand/msa/merlin/lined/empty-catalog.svg" alt="" width="64" height="64" />
        <p className={cx(TEXT, 'font-button')}>{t('pp.returns.emptyTitle')}</p>
        <p className={cx(SUB, 'max-w-[480px]')}>{t('pp.returns.emptyBody')}</p>
      </div>
    </Box>
  );
}

// ── hooks ──────────────────────────────────────────────────────────────────────────────────────────

/** The current persona's Pack Point offer (gating in ./offer.ts). */
export function usePackPointOffer(): PackPointOffer | null {
  const p = usePersona();
  const listing = useScriptedListing();
  return useMemo(() => packPointOffer(p, listing), [p, listing]);
}

/** His Pack Point state: the offer, how he ships now (onboarding choice or a Warehouse switch) and the node he is on. */
export function usePackPointShip() {
  const persona = useDemo((s) => s.persona);
  const p = usePersona();
  const offer = usePackPointOffer();
  const sw = useShipSwitch((s) => s.switches[persona]);
  const ship = offer ? warehouseShip(p.fulfilment, offer.node.city, sw) : null;
  const onNode = ship?.node ? (NODES.find((n) => n.city === ship.node) ?? null) : null;
  return { offer, ship, sw, onNode, onPP: ship?.mode === 'packPoint' && !!onNode };
}

/** His live listings as the confirm panel prices them: current mode (after any switch) and current price (after a price edit). */
function useSwitchListings(): { listings: SwitchListing[]; lotProducts: (keys: string[]) => LotProduct[] } {
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const live = useLiveListings();
  const overlay = useShipSwitch((s) => s.listings);
  const realEdit = usePriceEdits((s) => s.edits[persona]);
  return useMemo(() => {
    const edit = effectivePriceEdit(realEdit, day, persona);
    const launchKey = live.find((l) => LAUNCH.productTypes.includes(l.typeId))?.key;
    const listings = live.map((l) => ({
      key: l.key,
      id: l.id,
      name: l.name,
      typeId: l.typeId,
      price: edit && l.key === launchKey ? edit.price : l.price,
      makingCost: l.makingCost,
      marginPct: l.marginPct,
      mode: overlay[`${persona}:${l.key}`]?.fulfilment ?? l.fulfilment,
    }));
    const lotProducts = (keys: string[]) =>
      live.filter((l) => keys.includes(l.key)).map((l) => ({ key: l.key, name: l.name, type: l.typeId, makingCost: l.makingCost, minRun: l.minRun || (typicalForType(l.typeId)?.minRun ?? 0) }));
    return { listings, lotProducts };
  }, [live, overlay, realEdit, day, persona]);
}

const EMPTY_LOTS: PlannedLot[] = [];

// ── the tab ────────────────────────────────────────────────────────────────────────────────────────

export function ClusterPackPoint() {
  const t = useT();
  const day = useDemo((s) => s.day);
  const persona = useDemo((s) => s.persona);
  const p = usePersona();
  const { offer, ship, sw, onNode, onPP } = usePackPointShip();
  const planned = useShipSwitch((s) => s.lots[persona]) ?? EMPTY_LOTS;
  const applySwitch = useShipSwitch((s) => s.applySwitch);
  const saveLot = useShipSwitch((s) => s.saveLot);
  const { listings, lotProducts } = useSwitchListings();
  const [params, setParams] = useSearchParams();
  const search = new URLSearchParams(useLocation().search);

  const initialConfirm = (): { to: ShipMode; node: Node } | null => {
    if (!offer || search.get('pp') !== 'confirm') return null;
    if (onPP) return { to: 'selfShip', node: onNode! };
    return isLive(offer.node) ? { to: 'packPoint', node: offer.node } : null;
  };
  const [confirm, setConfirm] = useState(initialConfirm);
  const [drawer, setDrawer] = useState(() => search.get('drawer') === 'packpoint');
  const [lotPanel, setLotPanel] = useState<'new' | 'first' | null>(() => (search.get('pp') === 'lot' ? 'new' : null));

  if (!offer || !ship) return null;
  const { node, product } = offer;
  const { type, makingCost, marginPct } = product;
  // Samar's onboarding Pack Point (his seeded D50 lot) vs a switch made here.
  const seededMember = onPP && !ship.switched && lotSeed.persona === persona && lotSeed.productType === type;
  const stackNode = isLive(onNode) ? onNode : isLive(node) ? node : null;
  const switchedKeys = sw?.mode === 'packPoint' ? sw.listings : [];

  // Sub-tabs only once he ships through a Pack Point; before that the Overview is all he sees.
  const askedView = params.get('view') as PackPointView | null;
  const view: PackPointView = onPP && askedView && PACK_POINT_VIEWS.includes(askedView) ? askedView : search.get('pp') === 'lot' && onPP ? 'lots' : 'overview';
  const openLot = view === 'lots' ? params.get('lot') : null;
  const setView = (v: PackPointView, lot?: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'pack-point');
        next.set('view', v);
        if (lot) next.set('lot', lot);
        else next.delete('lot');
        next.delete('pp');
        next.delete('drawer');
        return next;
      },
      { replace: true },
    );

  const openConfirm = (to: ShipMode, n: Node) => {
    setConfirm({ to, node: n });
    requestAnimationFrame(() => {
      document.getElementById('pp-confirm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };
  const switchBack = onPP ? () => openConfirm('selfShip', onNode!) : undefined;

  // Products a lot can carry: the listings he switched here, or (Samar, on a Pack Point from onboarding) his product.
  const products: LotProduct[] = ship.switched
    ? lotProducts(switchedKeys)
    : [{ key: `scripted-${type}`, name: productTypeName(type), type, makingCost, minRun: typicalForType(type)?.minRun ?? 0 }];
  const makingCostOf = (listing: string | undefined, lt: ProductTypeId) => products.find((x) => x.key === listing)?.makingCost ?? (lt === type ? makingCost : null);
  const rows = lotRows({ seeded: seededMember, planned, day });
  // No live listings in the demo for a maker on a Pack Point from onboarding (Samar): his own product, at its list
  // price in his current mode, is what the switch applies to.
  const switchListings: SwitchListing[] =
    listings.length > 0
      ? listings
      : [
          {
            key: `scripted-${type}`,
            id: '',
            name: productTypeName(type),
            typeId: type,
            price: costStack(type, makingCost, marginPct, onPP ? 'packPoint' : 'selfShip', isLive(onNode) ? onNode.makersPooled : undefined).listPrice,
            makingCost,
            marginPct,
            mode: onPP ? 'packPoint' : 'selfShip',
          },
        ];
  const lotDetail = openLot ? rows.find((r) => r.id === openLot) : undefined;

  const firstPlanned = planned[0];
  const action = !onPP ? (
    isLive(node) ? (
      <Button className="shrink-0" variant="primary" onClick={() => openConfirm('packPoint', node)} data-pp-switch>
        {t('pp.switch')}
      </Button>
    ) : null
  ) : ship.switched && planned.length === 0 ? (
    <Button
      className="shrink-0"
      variant="primary"
      onClick={() => {
        setView('lots');
        setLotPanel('first');
      }}
      data-pp-plan-lot
    >
      {C2M.ppPlanLot}
    </Button>
  ) : null;

  const statusLine = onPP ? (
    <p className={cx(TEXT, 'font-button')} data-pp-on={onNode!.city}>
      {C2M.ppOnNode(onNode!.city)}
      {ship.switched && !firstPlanned && ` · ${C2M.ppNoLotYet}`}
      {ship.switched && firstPlanned && day < firstPlanned.sendDay && ` · ${C2M.ppLotPlanned(fmt(firstPlanned.lines.reduce((s, l) => s + l.units, 0)), dayLabel(firstPlanned.sendDay))}`}
    </p>
  ) : null;

  const subTabs = [
    { id: 'overview', label: t('pp.sub.overview') },
    { id: 'lots', label: t('pp.sub.lots') },
    { id: 'stock', label: t('pp.sub.stock') },
    { id: 'returns', label: t('pp.sub.returns') },
  ];

  return (
    <div className={cx(CARD, 'flex flex-col gap-5')} data-c2m="PP-3" data-c2m-id="PP-3" data-pack-point={onPP ? 'member' : 'offer'} data-pp-view={view}>
      <div className="flex items-start justify-between gap-6 max-[767px]:flex-col max-[767px]:gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className={H1}>{t('pp.title')}</h1>
            <NewTag />
          </div>
          <p className={SUB}>{t('pp.sub')}</p>
          {statusLine}
          {!stackNode && (
            <p className={TEXT} data-pp-opening>
              {C2M.ppOpeningNote(node.city)}
            </p>
          )}
        </div>
        {action}
      </div>

      {onPP && (
        <div className="-mx-8 -mb-1" data-pp-subtabs>
          <SubTabs tabs={subTabs} active={view} onSelect={(id) => setView(id as PackPointView)} />
        </div>
      )}

      {view === 'overview' && (
        <>
          {confirm && (
            <SwitchConfirm
              key={`${confirm.to}:${confirm.node.city}`}
              to={confirm.to}
              city={confirm.node.city}
              makersPooled={isLive(confirm.node) ? confirm.node.makersPooled : (stackNode?.makersPooled ?? model.densityFloorMakers)}
              listings={switchListings}
              productType={type}
              onCancel={() => setConfirm(null)}
              onConfirm={(keys) => {
                // No toast: the header's status line ("You're on Pack Point · <city> · first lot not sent yet") shows the result.
                applySwitch(persona, { mode: confirm.to, node: confirm.to === 'packPoint' ? confirm.node.city : null, listings: keys, day });
                setConfirm(null);
              }}
            />
          )}
          <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
            <Box title={C2M.ppNearHeading} c2m="PP-4">
              <NearList compact pincode={p.address.pincode} current={onPP ? onNode!.city : null} onUse={(n) => openConfirm('packPoint', n)} onSwitchBack={switchBack} />
              <div>
                <Button variant="text" size="sm" className="!h-auto !px-0 py-0.5" onClick={() => setDrawer(true)} data-pp-details>
                  {C2M.ppSeeDetails}
                </Button>
              </div>
            </Box>
            {stackNode && <StackCard type={type} makingCost={makingCost} marginPct={marginPct} node={stackNode} onPP={onPP} t={t} />}
          </div>
          <p className={TEXT} data-pp-storage>
            <span className="font-button">{t('pp.storage')}:</span> {t('pp.storageTerms', { free: fmt(model.storage.freeDays), rate: fmt(model.storage.perUnitPerDayAfter) })}
          </p>
        </>
      )}

      {view === 'lots' && (
        <Box
          title={lotDetail ? lotName(lotDetail, rows, t) : t('pp.sub.lots')}
          c2m="PP-5"
          id="pp-lot"
          right={
            lotDetail ? (
              <div className="flex items-center gap-3">
                <LotStatusPill status={lotDetail.status} t={t} />
                <Button variant="text" size="sm" className="!h-auto !px-0 py-0.5" onClick={() => setView('lots')} data-lot-back>
                  {t('pp.lots.back')}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setLotPanel(rows.length ? 'new' : 'first')} disabled={!products.length} data-pp-plan-a-lot>
                {t('pp.lots.plan')}
              </Button>
            )
          }
        >
          {lotDetail ? (
            <div className="flex flex-col gap-3" data-lot-detail={lotDetail.id}>
              <p className={SUB}>
                {productsLine(lotDetail)} · {t(lotDetail.seeded ? 'pp.lots.inbound' : 'pp.lots.send', { date: dayLabel(lotDetail.day) })}
              </p>
              {lotDetail.seeded ? <SeededLotDetail row={lotDetail} makingCost={makingCost} t={t} /> : <PlannedLotDetail row={lotDetail} makingCostOf={makingCostOf} t={t} />}
            </div>
          ) : rows.length ? (
            <LotsList rows={rows} onOpen={(id) => setView('lots', id)} t={t} />
          ) : (
            <p className={SUB} data-lots-empty>
              {t('pp.lots.empty', { city: onNode?.city ?? node.city })}
            </p>
          )}
        </Box>
      )}

      {view === 'stock' && <StockPanel day={day} seeded={seededMember} t={t} />}
      {view === 'returns' && <ReturnsPanel t={t} />}

      <PackPointDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        pincode={p.address.pincode}
        context="warehouse"
        current={onPP ? onNode!.city : null}
        onUse={(n) => openConfirm('packPoint', n)}
        onSwitchBack={switchBack}
      />
      {lotPanel && onPP && (
        <FirstLotPanel
          city={onNode!.city}
          day={day}
          products={products}
          initial={null}
          title={lotPanel === 'first' ? undefined : C2M.ppLotTitleNext(onNode!.city)}
          onClose={() => setLotPanel(null)}
          onSave={(lot) => {
            saveLot(persona, lot, day);
            setLotPanel(null);
          }}
        />
      )}
    </div>
  );
}
