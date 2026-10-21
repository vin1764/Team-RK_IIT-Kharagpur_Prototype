// PP-3 · Cluster Pack Point: the Warehouse page's second program, beside Meesho Warehouse (doc p.20).
// PP-4 · fee card (₹ per delivered order, how it is built, the fee by makers pooled) with the maker's
//        own cost stack, and the Pack Point clusters with their status.
// PP-5 · lot inbound: the first lot (≈ 14 days of expected sales), counted, every unit weighed.
// Shown to every Factory-verified maker whose pickup pincode is in a cluster (usePackPointOffer):
// Samar ships through Agra (fee, his cost stack, lot inbound); Jasmeet self-ships in Rajkot and sees
// the offer with her own Pack Point cost stack beside her self-ship one, and "Switch to Pack Point". Every number comes from src/engine/ui.ts or
// the seed JSON (packPointNodes, packPointModel, packPointLot; the size split via sizeSplitFor); none is typed here.
import { useMemo, type ReactNode } from 'react';
import lotSeed from '../../../data/packPointLot.json';
import model from '../../../data/packPointModel.json';
import { Button, Pill, cx } from '../../../components/ui';
import { toast } from '../../../components/Toast';
import {
  costStack,
  dayLabel,
  likelyOrdersPerDay,
  lotInbound,
  packPointFee,
  pctDisplay,
  productTypeName,
  sizeSplitFor,
  suggestedLot,
  type ProductTypeId,
} from '../../../engine/ui';
import { fmt, useT, type T as Tr } from '../../../i18n';
import { useDemo } from '../../../store/demo';
import { usePersona } from '../../../store/onboarding';
import { useScriptedListing } from '../../../store/timeline';
import { PACK_POINT_NODES, packPointOffer, type PackPointNode, type PackPointOffer } from './offer';
import { MerlinTable, type Col } from '../factory-launch/parts';
import { NewTag } from '../promotions/PromoParts';

type Node = PackPointNode;
const NODES = PACK_POINT_NODES;
/** The pool sizes the deck tabulates (20 / 40 / 60 / 80 makers). */
const POOL_SIZES = Object.keys(model.staffByPoolSize).filter((k) => !k.startsWith('_')).map(Number);

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

/** PP-4: ₹ per delivered order, built bottom-up, and the fee at each pool size. */
function FeeCard({ node, t }: { node: Node & { makersPooled: number }; t: Tr }) {
  const f = packPointFee(node.makersPooled);
  const ladder = POOL_SIZES.map((n) => packPointFee(n));
  const cols: Col[] = [
    { key: 'makers', header: t('pp.ladder.makers') },
    { key: 'fee', header: t('pp.ladder.fee') },
  ];
  const rows = ladder.map((l) => ({
    id: String(l.makersPooled),
    makers: (
      <span className="inline-flex items-center gap-2">
        {t('pp.makers', { n: fmt(l.makersPooled) })}
        {l.makersPooled === node.makersPooled && <Pill tone="brand" bordered>{t('pp.ladder.now', { city: node.city })}</Pill>}
      </span>
    ),
    fee: <span className={l.makersPooled === node.makersPooled ? 'font-button' : undefined}>{rupees(l.feePerDeliveredOrder)}</span>,
  }));
  return (
    <Box title={t('pp.fee.title')} c2m="PP-4">
      <div data-fee={f.feePerDeliveredOrder}>
        <p className="m-0 p-0 font-heading text-3xl leading-7 text-primary-text">{t('pp.fee.value', { fee: fmt(f.feePerDeliveredOrder) })}</p>
        <p className={cx(SUB, 'mt-1')}>{t('pp.fee.at', { n: fmt(f.makersPooled), city: node.city })}</p>
      </div>
      <Rule />
      <p className={cx(TEXT, 'font-button')}>{t('pp.fee.how')}</p>
      <div className="flex flex-col gap-1.5" data-fee-build>
        <Line label={t('pp.fee.cost', { cost: fmt(Math.round(f.monthlyCost)), orders: fmt(f.ordersPerMonth) })} value={rupees(Math.round(f.costPerOrderHandled * 100) / 100)} />
        <Line label={t('pp.fee.margin', { pct: fmt(Math.round((model.partnerMarginMultiplier - 1) * 100)) })} value={rupees(Math.round(f.feePerOrderHandled * 100) / 100)} />
        <Line label={t('pp.fee.rto', { rto: pctDisplay(model.blendedRtoRate) })} value={rupees(Math.round(f.feePerDeliveredOrderExact * 10) / 10)} />
        <Line strong label={t('pp.fee.rounded')} value={rupees(f.feePerDeliveredOrder)} />
      </div>
      <Rule />
      <p className={cx(TEXT, 'font-button')}>{t('pp.ladder.title')}</p>
      <div className="overflow-hidden rounded-lg border border-solid border-tertiary-border" data-fee-ladder>
        <MerlinTable cols={cols} rows={rows} label={t('pp.ladder.title')} />
      </div>
      <p className={SUB}>{t('pp.ladder.gate', { n: fmt(model.densityFloorMakers) })}</p>
    </Box>
  );
}

/** PP-4: the maker's cost per unit at their Pack Point (cost stack in Pack Point mode). */
function StackCard({ type, makingCost, marginPct, node, selfShip, t }: { type: ProductTypeId; makingCost: number; marginPct: number; node: Node & { makersPooled: number }; selfShip: boolean; t: Tr }) {
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

/** PP-4: cluster status, the maker's pickup city first. */
function NodesCard({ node, t }: { node: Node; t: Tr }) {
  const ordered = [node, ...NODES.filter((n) => n !== node)];
  const cols: Col[] = [
    { key: 'city', header: t('pp.nodes.city'), width: '30%' },
    { key: 'status', header: t('pp.nodes.status'), width: '20%' },
    { key: 'makers', header: t('pp.nodes.makers'), width: '25%' },
    { key: 'fee', header: t('pp.nodes.fee'), width: '25%' },
  ];
  const rows = ordered.map((n) => {
    const live = n.status === 'live' && n.makersPooled !== undefined;
    const atOpen = n.opensAtMakers !== undefined ? packPointFee(n.opensAtMakers) : null;
    return {
      id: n.city,
      city: (
        <span className="inline-flex items-center gap-2 font-button">
          {n.city}
          {n === node && <Pill tone="brand" bordered>{t('pp.nodes.yours')}</Pill>}
        </span>
      ),
      status: (
        <Pill tone={live ? 'success' : 'warning'} bordered>
          {t(live ? 'pp.nodes.live' : 'pp.nodes.opening')}
        </Pill>
      ),
      makers: live ? t('pp.makers', { n: fmt(n.makersPooled!) }) : t('pp.nodes.opensAt', { n: fmt(n.opensAtMakers ?? 0) }),
      fee: live ? rupees(packPointFee(n.makersPooled!).feePerDeliveredOrder) : atOpen ? t('pp.nodes.feeAtOpen', { fee: fmt(atOpen.feePerDeliveredOrder) }) : '—',
    };
  });
  return (
    <Box title={t('pp.nodes.title')} c2m="PP-4">
      <p className={SUB}>{t('pp.nodes.sub')}</p>
      <div className="overflow-hidden rounded-lg border border-solid border-tertiary-border" data-nodes>
        <MerlinTable cols={cols} rows={rows} label={t('pp.nodes.title')} />
      </div>
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

export function ClusterPackPoint() {
  const t = useT();
  const day = useDemo((s) => s.day);
  const offer = usePackPointOffer();
  if (!offer) return null;
  const { node, usesPackPoint, product } = offer;
  const others = NODES.filter((n) => n !== node);
  const { type, makingCost, marginPct } = product;
  const liveNode = node.status === 'live' && node.makersPooled !== undefined ? (node as Node & { makersPooled: number }) : null;
  const toLot = () => document.getElementById('pp-lot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const arrived = lotSeed.productType === type && day >= lotSeed.day;
  const action = usesPackPoint ? (
    <Button className="shrink-0" variant={arrived ? 'outline' : 'primary'} onClick={toLot}>
      {t(arrived ? 'pp.viewLot' : 'pp.sendLot')}
    </Button>
  ) : liveNode ? (
    <Button className="shrink-0" variant="primary" onClick={() => toast(t('pp.switch.toast', { city: node.city }))} data-pp-switch>
      {t('pp.switch')}
    </Button>
  ) : null;
  return (
    <div className={cx(CARD, 'flex flex-col gap-5')} data-c2m="PP-3" data-c2m-id="PP-3" data-pack-point={usesPackPoint ? 'member' : 'offer'}>
      <div className="flex items-start justify-between gap-6 max-[767px]:flex-col max-[767px]:gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className={H1}>{t('pp.title')}</h1>
            <NewTag />
          </div>
          <p className={SUB}>{t('pp.sub')}</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-1 pt-1">
            <p className={cx(TEXT, 'font-button')}>{t(node.status === 'live' ? 'pp.node.live' : 'pp.node.opening', { city: node.city, n: fmt(node.opensAtMakers ?? 0) })}</p>
            {others.map((n) => (
              <p key={n.city} className={SUB}>
                {t(n.status === 'live' ? 'pp.node.live' : 'pp.node.opening', { city: n.city, n: fmt(n.opensAtMakers ?? 0) })}
              </p>
            ))}
          </div>
          {liveNode ? (
            <p className="m-0 p-0 font-heading text-3xl leading-7 text-primary-text pt-1">{t('pp.fee.value', { fee: fmt(packPointFee(liveNode.makersPooled).feePerDeliveredOrder) })}</p>
          ) : (
            <p className={cx(TEXT, 'pt-1')} data-pp-opening>
              {t('pp.opening.note', { city: node.city, n: fmt(node.opensAtMakers ?? model.densityFloorMakers) })}
            </p>
          )}
          <ul className="m-0 p-0 pl-5 flex flex-col gap-1">
            <li className={TEXT}>{t('pp.storageTerms', { free: fmt(model.storage.freeDays), rate: fmt(model.storage.perUnitPerDayAfter) })}</li>
            <li className={TEXT}>{t('pp.lotWeek')}</li>
            <li className={TEXT}>{t(usesPackPoint ? 'pp.selfShip' : 'pp.selfShipNow')}</li>
          </ul>
        </div>
        {action}
      </div>
      {liveNode && (
        <div className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
          <FeeCard node={liveNode} t={t} />
          <StackCard type={type} makingCost={makingCost} marginPct={marginPct} node={liveNode} selfShip={!usesPackPoint} t={t} />
        </div>
      )}
      <NodesCard node={node} t={t} />
      {usesPackPoint && <LotCard type={type} makingCost={makingCost} node={node} day={day} t={t} />}
    </div>
  );
}
