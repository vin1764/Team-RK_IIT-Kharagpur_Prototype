// "Pack Points near you" (FO-8 drawer, PP-3/PP-4 Warehouse card): every Pack Point sorted by distance from the
// pickup pincode (city-centre approximations, src/engine/packPointNear.ts). Open ones: his fee (the engine's fee for
// that node's pool; the partner's margin is inside it), storage terms (packPointLot.json), services, and "Use this Pack Point".
// Opening ones: "Join waitlist" (persisted per persona + node; Reset demo clears). No maker counts, no opening
// rule, no fee build-up: those stay Meesho's view (showcase sidebar).
import lotData from '../../../data/packPointLot.json';
import { Button, Pill, cx } from '../../../components/ui';
import { useDemo } from '../../../store/demo';
import { useShipSwitch, waitlistKey } from '../../../store/fulfilmentSwitch';
import { C2M } from '../stepper/copy';
import { nearLine, nodeFee, packPointsNearPincode, type PackPointNode } from './status';

const BODY = 'm-0 text-lg leading-5 font-body text-primary-text';
const SUB = 'm-0 text-base leading-4 font-body text-secondary-text';

export function NearList({
  pincode,
  current,
  onUse,
  onSwitchBack,
  onWaitlist,
}: {
  pincode: string;
  /** the Pack Point he is on now (city), if any */
  current?: string | null;
  /** "Use this Pack Point" (no button without it) */
  onUse?: (node: PackPointNode) => void;
  /** "Switch back to self-ship" beside the Pack Point he is on (no link without it) */
  onSwitchBack?: () => void;
  /** also called on "Join waitlist" (the waitlist itself is stored here) */
  onWaitlist?: (node: PackPointNode) => void;
}) {
  const persona = useDemo((s) => s.persona);
  const waitlist = useShipSwitch((s) => s.waitlist);
  const join = useShipSwitch((s) => s.joinWaitlist);
  const near = packPointsNearPincode(pincode);
  const storage = lotData.storage;

  if (!near) {
    return (
      <p className={cx(BODY, 'text-secondary-text')} data-testid="pp-none-near">
        {C2M.ppNoneNear}
      </p>
    );
  }
  return (
    <>
      <ul className="m-0 flex list-none flex-col gap-2 p-0" data-testid="pp-nodes">
        {near.map((r) => {
          const n = r.node;
          const fee = nodeFee(n);
          const onIt = current === n.city;
          const listed = !!waitlist[waitlistKey(persona, n.city)];
          return (
            <li
              key={n.city}
              data-testid={`pp-node-${n.city}`}
              data-own={r.own}
              data-km={r.km ?? 'district'}
              className={cx('flex flex-col gap-1.5 rounded-lg border border-solid px-3 py-2.5', r.own ? 'border-brand-primary-border bg-brand-secondary-bg' : 'border-tertiary-border bg-white')}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={cx(BODY, 'font-button')}>{nearLine(r)}</span>
                {fee !== null ? <Pill tone="success">{C2M.ppOpen}</Pill> : <Pill tone="warning">{C2M.ppOpeningSoonPill}</Pill>}
              </div>
              {fee !== null ? (
                <>
                  <p className={BODY} data-pp-fee={fee}>
                    {C2M.ppFeeLine(fee)}
                  </p>
                  <p className={SUB}>{C2M.ppStorage(storage.freeDays, storage.perUnitPerDay)}</p>
                  <p className={SUB}>{C2M.ppServicesLine}</p>
                  {onIt ? (
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <Pill tone="brand" bordered>
                        {C2M.ppInUse}
                      </Pill>
                      {onSwitchBack && (
                        <Button variant="text" size="sm" className="!h-auto !px-0 py-0.5" onClick={onSwitchBack} data-testid="pp-switch-back">
                          {C2M.ppSwitchBack}
                        </Button>
                      )}
                    </div>
                  ) : (
                    onUse && (
                      <div className="mt-1">
                        <Button variant="outline" size="sm" onClick={() => onUse(n)} data-testid={`pp-use-${n.city}`}>
                          {C2M.ppUse}
                        </Button>
                      </div>
                    )
                  )}
                </>
              ) : listed ? (
                <p className={cx(BODY, 'text-success-text')} data-testid={`pp-waitlisted-${n.city}`}>
                  {C2M.ppOnWaitlist}
                </p>
              ) : (
                <div className="mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`pp-waitlist-${n.city}`}
                    onClick={() => {
                      join(persona, n.city);
                      onWaitlist?.(n);
                    }}
                  >
                    {C2M.ppJoinWaitlistBtn}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className={cx(SUB, 'mt-2')}>{C2M.ppNearNote}</p>
    </>
  );
}
