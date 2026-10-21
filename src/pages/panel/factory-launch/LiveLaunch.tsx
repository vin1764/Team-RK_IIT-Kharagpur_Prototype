// LW-7 Live launch view (inside Promotions → Factory Launch): orders per day vs the expected band,
// and units sold of the committed lot. Days 21–25 show "Day n of 5"; after D25 the same view keeps
// counting ("Launch week ended · orders continue") through the seeded series.
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { Button, Pill, cx } from '../../../components/ui';
import { dayLabel } from '../../../engine/ui';
import { EventsEmpty, PromoHeader } from '../promotions/PromoParts';
import { FL } from './copy';
import { LAUNCH, liveDayIndex } from './launch';
import { Section, T } from './parts';
import { useLaunchView } from './useLaunchView';
import { chartDays, percent } from './liveSeries';

function Tiles({ tiles }: { tiles: { key: string; label: string; value: string }[] }) {
  return (
    <div className="flex">
      {tiles.map((t) => (
        <div key={t.key} data-tile={t.key} className="flex flex-1 flex-col border border-solid border-neutral-light border-r-0 p-4 first:rounded-l-8 last:rounded-r-8 last:border-r">
          <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t.label}</p>
          <h3 className={cx(T.h2, 'pt-2')}>{t.value}</h3>
        </div>
      ))}
    </div>
  );
}

const W = 1120;
const H = 240;
const PAD = { top: 20, right: 12, bottom: 36, left: 32 };

/** Bars of orders per day so far against the expected band (no chart library). */
function OrdersChart({ day, expected }: { day: number; expected: { low: number; high: number } }) {
  const days = chartDays(LAUNCH.dailyOrders, LAUNCH.liveFromDay, LAUNCH.liveToDay, day);
  const top = Math.max(expected.high, ...days.map((d) => d.orders ?? 0));
  const yMax = Math.ceil((top * 1.25) / 5) * 5;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
  const slot = innerW / days.length;
  const barW = Math.min(36, slot * 0.5);
  const ticks = [0, expected.low, expected.high, yMax];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img" aria-label={FL.ordersPerDay} data-chart>
      {/* expected band */}
      <rect x={PAD.left} y={y(expected.high)} width={innerW} height={y(expected.low) - y(expected.high)} fill="var(--brand-100)" />
      {[expected.low, expected.high].map((v) => (
        <line key={v} x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--brand-300)" strokeDasharray="4 4" />
      ))}
      <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--neutral-200)" />
      {ticks.map((v) => (
        <text key={`t${v}`} x={PAD.left - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--neutral-500)">
          {v}
        </text>
      ))}
      {days.map((d, i) => {
        const cx0 = PAD.left + slot * i + slot / 2;
        const isToday = d.day === day;
        const live = d.day <= LAUNCH.liveToDay;
        return (
          <g key={d.day} data-bar-day={d.day} data-orders={d.orders ?? ''}>
            {d.orders !== null ? (
              <>
                <rect x={cx0 - barW / 2} y={y(d.orders)} width={barW} height={y(0) - y(d.orders)} rx="2" fill={isToday ? 'var(--brand-700)' : live ? 'var(--brand-500)' : 'var(--brand-300)'} />
                <text x={cx0} y={y(d.orders) - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--neutral-700)">
                  {d.orders}
                </text>
              </>
            ) : (
              <rect x={cx0 - barW / 2} y={y(0) - 2} width={barW} height="2" fill="var(--neutral-200)" />
            )}
            <text x={cx0} y={H - PAD.bottom + 16} textAnchor="middle" fontSize="11" fill={isToday ? 'var(--brand-600)' : 'var(--neutral-500)'} fontWeight={isToday ? 600 : 400}>
              {dayLabel(d.day).split(' ').slice(0, 2).join(' ')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ProgressBar({ sold, lot, pct }: { sold: number; lot: number; pct: number }) {
  return (
    <div className="flex flex-col gap-2" data-progress={pct}>
      <div className="flex items-center justify-between">
        <p className={cx(T.bodyMd, 'font-medium')}>{FL.unitsSold}</p>
        <p className={cx(T.bodyMd, 'text-neutral-secondary')}>{FL.soldOfLot(sold, lot, pct)}</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-hover">
        <div className="h-full rounded-full bg-brand-base" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export default function LiveLaunch() {
  const navigate = useNavigate();
  const view = useLaunchView();
  const back = (
    <Button variant="outline" size="sm" onClick={() => navigate(paths.factoryLaunch)}>
      {FL.backToLaunch}
    </Button>
  );

  let body;
  if (!view.commit || !view.progress) {
    body = (
      <div className="flex flex-col items-center gap-4">
        <EventsEmpty title={FL.noCommitTitle} subtitle={FL.noCommitSub} />
        {back}
      </div>
    );
  } else {
    const { progress, commit, day } = view;
    const live = liveDayIndex(day);
    const expected = view.rows.find((r) => r.typeId === commit.typeId)?.expected ?? view.rows[0]!.expected;
    const pct = percent(progress.sellThrough);
    const started = day >= LAUNCH.liveFromDay;
    const ended = day > LAUNCH.liveToDay;
    const heading = live ? FL.dayOf(live.n, live.of, dayLabel(day)) : ended ? FL.endedTitle : FL.goesLive(dayLabel(LAUNCH.liveFromDay));
    const tiles = [
      { key: 'today', label: FL.tile.today, value: progress.today !== null ? String(progress.today) : '—' },
      { key: 'expected', label: FL.tile.expected, value: FL.expectedRange(expected.low, expected.high) },
      { key: 'sold', label: FL.tile.sold, value: FL.ofLot(progress.soldToDate, commit.units) },
      { key: 'left', label: FL.tile.left, value: String(progress.left) },
      ...(ended ? [{ key: 'sellThrough', label: FL.tile.sellThrough, value: `${pct}%` }] : []),
    ];
    body = (
      <Section c2m="LW-7" className="overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="flex flex-col gap-1">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>
              {LAUNCH.name} · {view.listing?.name ?? view.bookTypeName}
            </p>
            <div className="flex items-center gap-2">
              <h2 className={T.h2} data-live-heading>
                {heading}
              </h2>
              {live && <Pill tone="success" bordered>{FL.phase.live}</Pill>}
              {ended && <Pill tone="info" bordered>{FL.phase.ended}</Pill>}
            </div>
          </div>
          {back}
        </div>
        <div className="px-4 pb-4">
          <Tiles tiles={tiles} />
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between pb-2">
            <p className={cx(T.bodyMd, 'font-medium')}>{FL.ordersPerDay}</p>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-3 w-5 rounded-2 bg-brand-light border border-dashed border-brand-light" />
              <p className={cx(T.bodySm, 'text-neutral-secondary')}>{FL.expectedBand(expected.low, expected.high)}</p>
            </div>
          </div>
          {started ? <OrdersChart day={day} expected={expected} /> : <p className={cx(T.bodyMd, 'text-neutral-secondary py-6 text-center')}>{FL.goesLive(dayLabel(LAUNCH.liveFromDay))}</p>}
        </div>
        <div className="px-4 pb-5">
          <ProgressBar sold={progress.soldToDate} lot={commit.units} pct={pct} />
        </div>
      </Section>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-default text-neutral-primary tracking-[-0.1px]">
      <PromoHeader title={FL.liveTitle} />
      <div className="px-4 pb-6">{body}</div>
    </div>
  );
}
