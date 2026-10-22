// PP-3 · Cluster Pack Point: the Warehouse page's second program, beside Meesho Warehouse (doc p.20).
// PP-4 · "Pack Points near you" (sorted by distance from his pickup pincode; his fee at each open one, storage,
//        services; "Use this Pack Point" / "Join waitlist") beside his own cost stack at his Pack Point.
// PP-5 · lot inbound: Samar's first lot (≈ 14 days of expected sales), counted, every unit weighed; after a switch
//        here, "Plan first lot" (FirstLotPanel).
// Seller view only: no cluster economics (fee by size, opening rule, fee build-up, maker counts) — those are
// Meesho's view, in the showcase sidebar. Shown to every Factory-verified maker whose pickup pincode is in a cluster
// (usePackPointOffer). "Use this Pack Point" / "Switch to Pack Point" open a confirm panel in place (SwitchConfirm):
// apply to all or chosen live listings, with each one's take-home and launch status after the switch; confirming
// stores the switch per persona (src/store/fulfilmentSwitch.ts) and sends those listings back to "Needs your review"
// (Packer details change). Samar is on Pack Point · Agra from onboarding; Jasmeet self-ships in Rajkot and sees the
// offer. Every number comes from src/engine/ui.ts or the seed JSON; none is typed here.
// URL (showcase jumps): ?drawer=packpoint opens the drawer; ?pp=confirm opens the confirm panel (switch to his own
// open Pack Point, or switch back when he is on one); ?pp=lot opens the first-lot planner after a switch.
import { useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import lotSeed from '../../../data/packPointLot.json';
import model from '../../../data/packPointModel.json';
import { Button, Pill, cx } from '../../../components/ui';
import { toast } from '../../../components/Toast';
import { costStack, dayLabel, likelyOrdersPerDay, lotInbound, productTypeName, sizeSplitFor, suggestedLot, typicalForType, type ProductTypeId } from '../../../engine/ui';
import { fmt, useT, type T as Tr } from '../../../i18n';
import { useDemo } from '../../../store/demo';
import { useShipSwitch, type ShipMode } from '../../../store/fulfilmentSwitch';
import { usePersona } from '../../../store/onboarding';
import { usePriceEdits } from '../../../store/priceEdits';
import { useScriptedListing } from '../../../store/timeline';
import { NearList } from '../../onboarding/packpoint/NearList';
import { PackPointDrawer } from '../../onboarding/packpoint/PackPointDrawer';
import { C2M } from '../../onboarding/stepper/copy';
import { useLiveListings } from '../catalog-uploads/liveListings';
import { LAUNCH } from '../factory-launch/launch';
import { MerlinTable, type Col } from '../factory-launch/parts';
import { effectivePriceEdit } from '../manage-pricing/priceHold';
import { NewTag } from '../promotions/PromoParts';
import { FirstLotPanel, type LotProduct } from './FirstLotPanel';
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
const sameCity = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function Box({ title, children, c2m, id }: { title: ReactNode; children: ReactNode; c2m: string; id?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-solid border-tertiary-border p-4" data-c2m={c2m} data-c2m-id={c2m} id={id}>
      <h3 className={H3}>{title}</h3>
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

/** PP-4: the maker's cost per unit at their Pack Point (cost stack in Pack Point mode). */
function StackCard({ type, makingCost, marginPct, node, selfShip, t }: { type: ProductTypeId; makingCost: number; marginPct: number; node: LiveNode; selfShip: boolean; t: Tr }) {
  const s = costStack(type, makingCost, marginPct, 'packPoint', node.makersPooled);
  const own = selfShip ? costStack(type, makingCost, marginPct, 'selfShip') : null;
  return (
    <Box title={t('pp.stack.title', { city: node.city })} c2m="PP-4">
      <p className={SUB}>{productTypeName(type)}</p>
      <div className="flex flex-col gap-1.5" data-stack>
        <Line label={t('pp.stack.making')} value={rupees(s.makingCost)} />
        <Line label={t('pp.stack.fee')} value={rupees(s.fees.packPointFee ?? 0)} />
        <Line label={t('pp.stack.shipping')} value={rupees(s.fees.shippingAndFixed)} />
        <Line label={t('pp.stack.returns')} value={rupees(s.fees.returnsBuffer)} />
        <Rule />
        <Line strong label={t('pp.stack.breakEven', { pct: fmt(Math.round(s.gstRate * 100)) })} value={rupees(s.breakEven)} />
        <Line label={t('pp.stack.takeHome')} value={rupees(s.takeHome)} />
        <Line strong label={t('pp.stack.list')} value={rupees(s.listPrice)} />
        <Line label={t('pp.stack.gst')} value={rupees(s.fees.gst)} />
      </div>
      {own && (
        <p className={cx(TEXT, 'font-button')} data-stack-selfship>
          {t('pp.stack.selfShipNow', { breakEven: fmt(own.breakEven), list: fmt(own.listPrice) })}
        </p>
      )}
      <p className={SUB}>{t('pp.stack.note')}</p>
    </Box>
  );
}

/** PP-5: the first lot — planned before the inbound day, then received, counted and weighed. */
function LotCard({ type, makingCost, node, day, t }: { type: ProductTypeId; makingCost: number; node: Node; day: number; t: Tr }) {
  const lot = suggestedLot(type, makingCost);
  const perDay = likelyOrdersPerDay(type);
  const split = sizeSplitFor(type, lot.units) ?? [];
  const seeded = lotSeed.productType === type && sameCity(lotSeed.node, node.city);
  const arrived = seeded && day >= lotSeed.day;
  const r = seeded ? lotInbound(lotSeed) : null;
  const cols: Col[] = [{ key: 'label', header: t('pp.lot.size') }, ...split.map((s) => ({ key: s.size, header: t('pp.lot.uk', { size: s.size }) }))];
  const sizeRow = { id: 'units', label: t('pp.lot.pairs'), ...Object.fromEntries(split.map((s) => [s.size, fmt(s.units)])) };
  return (
    <Box title={t('pp.lot.title', { days: fmt(lot.days) })} c2m="PP-5" id="pp-lot">
      {arrived && r ? (
        <>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-2" data-lot="received">
            <p className={TEXT}>{t('pp.lot.expected', { n: fmt(r.expected) })}</p>
            <p className={TEXT}>{t('pp.lot.received', { n: fmt(r.received) })}</p>
            <p className={TEXT}>{t('pp.lot.weighedAll', { n: fmt(r.received), of: fmt(r.received) })}</p>
            <Pill tone="success" bordered className="!text-body-small">
              {t('pp.lot.stocked', { city: node.city })}
            </Pill>
          </div>
          <p className={SUB} data-weight-rule>
            {t('pp.lot.weightRule', { w: fmt(lotSeed.packedWeightG), tol: fmt(lotSeed.weightTolerancePct), low: fmt(r.weightRangeG.low), high: fmt(r.weightRangeG.high) })}
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-1" data-lot="planned">
          <div className="flex items-center gap-3">
            <p className={cx(TEXT, 'font-button')}>{t('pp.lot.planned', { n: fmt(lot.units) })}</p>
            <Pill tone="info" bordered>
              {t('pp.lot.plannedPill')}
            </Pill>
          </div>
          {seeded && <p className={SUB}>{t('pp.lot.inboundOn', { city: node.city, date: dayLabel(lotSeed.day) })}</p>}
        </div>
      )}
      <p className={SUB}>{t('pp.lot.basis', { n: fmt(lot.units), days: fmt(lot.days), low: fmt(perDay.low), high: fmt(perDay.high), cost: fmt(lot.atCost) })}</p>
      {split.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-solid border-tertiary-border" data-size-split>
          <MerlinTable cols={cols} rows={[sizeRow]} label={t('pp.lot.size')} />
        </div>
      )}
      {arrived && r && (
        <p className={TEXT} data-storage>
          {t('pp.lot.storage', { date: dayLabel(r.storageFreeUntilDay), rate: fmt(lotSeed.storage.perUnitPerDay), perDay: r.storagePerDayAfterFree.toFixed(2), n: fmt(r.received) })}
        </p>
      )}
    </Box>
  );
}

/** The current persona's Pack Point offer (gating in ./offer.ts). */
export function usePackPointOffer(): PackPointOffer | null {
  const p = usePersona();
  const listing = useScriptedListing();
  return useMemo(() => packPointOffer(p, listing), [p, listing]);
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

export function ClusterPackPoint() {
  const t = useT();
  const day = useDemo((s) => s.day);
  const persona = useDemo((s) => s.persona);
  const p = usePersona();
  const offer = usePackPointOffer();
  const sw = useShipSwitch((s) => s.switches[persona]);
  const firstLot = useShipSwitch((s) => s.firstLots[persona]);
  const applySwitch = useShipSwitch((s) => s.applySwitch);
  const saveFirstLot = useShipSwitch((s) => s.saveFirstLot);
  const { listings, lotProducts } = useSwitchListings();
  const params = new URLSearchParams(useLocation().search);
  const ship = offer ? warehouseShip(p.fulfilment, offer.node.city, sw) : null;
  const onNode = ship?.node ? (NODES.find((n) => n.city === ship.node) ?? null) : null;
  const onPP = ship?.mode === 'packPoint' && !!onNode;

  const initialConfirm = (): { to: ShipMode; node: Node } | null => {
    if (!offer || params.get('pp') !== 'confirm') return null;
    if (onPP) return { to: 'selfShip', node: onNode! };
    return isLive(offer.node) ? { to: 'packPoint', node: offer.node } : null;
  };
  const [confirm, setConfirm] = useState(initialConfirm);
  const [drawer, setDrawer] = useState(() => params.get('drawer') === 'packpoint');
  const [lotOpen, setLotOpen] = useState(() => params.get('pp') === 'lot');

  if (!offer || !ship) return null;
  const { node, product } = offer;
  const { type, makingCost, marginPct } = product;
  // Samar's onboarding Pack Point (his seeded D50 lot story) vs a switch made here.
  const seededMember = onPP && !ship.switched;
  const stackNode = isLive(onNode) ? onNode : isLive(node) ? node : null;
  const toLot = () => document.getElementById('pp-lot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const arrived = lotSeed.productType === type && day >= lotSeed.day;
  const openConfirm = (to: ShipMode, n: Node) => {
    setConfirm({ to, node: n });
    requestAnimationFrame(() => document.getElementById('pp-confirm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };
  const switchBack = onPP ? () => openConfirm('selfShip', onNode!) : undefined;
  const switchedKeys = sw?.mode === 'packPoint' ? sw.listings : [];

  const action = seededMember ? (
    <Button className="shrink-0" variant={arrived ? 'outline' : 'primary'} onClick={toLot}>
      {t(arrived ? 'pp.viewLot' : 'pp.sendLot')}
    </Button>
  ) : onPP ? (
    <Button className="shrink-0" variant={firstLot ? 'outline' : 'primary'} onClick={() => setLotOpen(true)} data-pp-plan-lot>
      {firstLot ? C2M.ppEditLot : C2M.ppPlanLot}
    </Button>
  ) : isLive(node) ? (
    <Button className="shrink-0" variant="primary" onClick={() => openConfirm('packPoint', node)} data-pp-switch>
      {t('pp.switch')}
    </Button>
  ) : null;

  const lotTotal = firstLot ? firstLot.lines.reduce((s, l) => s + l.units, 0) : 0;
  const statusLine = onPP ? (
    <p className={cx(TEXT, 'font-button')} data-pp-on={onNode!.city}>
      {C2M.ppOnNode(onNode!.city)}
      {ship.switched && ` · ${firstLot ? C2M.ppLotPlanned(fmt(lotTotal), dayLabel(firstLot.sendDay)) : C2M.ppNoLotYet}`}
    </p>
  ) : null;

  return (
    <div className={cx(CARD, 'flex flex-col gap-5')} data-c2m="PP-3" data-c2m-id="PP-3" data-pack-point={onPP ? 'member' : 'offer'}>
      <div className="flex items-start justify-between gap-6 max-[767px]:flex-col max-[767px]:gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className={H1}>{t('pp.title')}</h1>
            <NewTag />
          </div>
          <p className={SUB}>{t('pp.sub')}</p>
          {statusLine}
          {stackNode ? (
            <p className="m-0 p-0 font-heading text-3xl leading-7 text-primary-text pt-1" data-pp-fee-line>
              {C2M.ppFeeLine(costStack(type, makingCost, marginPct, 'packPoint', stackNode.makersPooled).fees.packPointFee ?? 0)}
            </p>
          ) : (
            <p className={cx(TEXT, 'pt-1')} data-pp-opening>
              {C2M.ppOpeningNote(node.city)}
            </p>
          )}
          <ul className="m-0 p-0 pl-5 flex flex-col gap-1">
            <li className={TEXT}>{t('pp.storageTerms', { free: fmt(model.storage.freeDays), rate: fmt(model.storage.perUnitPerDayAfter) })}</li>
            <li className={TEXT}>{t('pp.lotWeek')}</li>
            <li className={TEXT}>{t(onPP ? 'pp.selfShip' : 'pp.selfShipNow')}</li>
          </ul>
          <div className="flex flex-wrap items-center gap-x-4 pt-1">
            <Button variant="text" size="sm" className="!h-auto !px-0 py-0.5" onClick={() => setDrawer(true)} data-pp-details>
              {C2M.ppSeeDetails}
            </Button>
            {switchBack && (
              <Button variant="text" size="sm" className="!h-auto !px-0 py-0.5" onClick={switchBack} data-pp-switch-back>
                {C2M.ppSwitchBack}
              </Button>
            )}
          </div>
        </div>
        {action}
      </div>
      {confirm && (
        <SwitchConfirm
          key={`${confirm.to}:${confirm.node.city}`}
          to={confirm.to}
          city={confirm.node.city}
          makersPooled={isLive(confirm.node) ? confirm.node.makersPooled : stackNode?.makersPooled ?? model.densityFloorMakers}
          listings={listings}
          productType={type}
          onCancel={() => setConfirm(null)}
          onConfirm={(keys) => {
            applySwitch(persona, { mode: confirm.to, node: confirm.to === 'packPoint' ? confirm.node.city : null, listings: keys, day });
            toast(confirm.to === 'packPoint' ? C2M.ppSwitchedToast(confirm.node.city, keys.length) : C2M.ppSwitchedBackToast(keys.length));
            setConfirm(null);
          }}
        />
      )}
      <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
        <Box title={C2M.ppNearHeading} c2m="PP-4">
          <NearList
            pincode={p.address.pincode}
            current={onPP ? onNode!.city : null}
            onUse={(n) => openConfirm('packPoint', n)}
            onSwitchBack={switchBack}
            onWaitlist={(n) => toast(C2M.ppWaitlistToast(n.city))}
          />
        </Box>
        {stackNode && <StackCard type={type} makingCost={makingCost} marginPct={marginPct} node={stackNode} selfShip={!onPP} t={t} />}
      </div>
      {seededMember && <LotCard type={type} makingCost={makingCost} node={node} day={day} t={t} />}
      <PackPointDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        pincode={p.address.pincode}
        context="warehouse"
        current={onPP ? onNode!.city : null}
        onUse={(n) => openConfirm('packPoint', n)}
        onSwitchBack={switchBack}
        onWaitlist={(n) => toast(C2M.ppWaitlistToast(n.city))}
      />
      {lotOpen && onPP && ship.switched && (
        <FirstLotPanel
          city={onNode!.city}
          day={day}
          products={lotProducts(switchedKeys)}
          initial={firstLot ?? null}
          onClose={() => setLotOpen(false)}
          onSave={(lot) => {
            saveFirstLot(persona, lot);
            setLotOpen(false);
            toast(C2M.ppLotSaved);
          }}
        />
      )}
    </div>
  );
}
