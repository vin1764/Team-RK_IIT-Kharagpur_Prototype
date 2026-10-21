// D28+ (C2M, GL-1 inputs): the Orders / Sales trend for the snapshot week, drawn as a plain inline
// SVG line in the panel's brand colour (no chart library). Values come from ./series.ts.
import { fmt } from '../../../i18n';
import { shortDate } from '../growth-loop/useGrowth';
import { niceAxis, type Metric, type SeriesPoint } from './series';

const W = 1100;
const H = 250;
const PAD = { top: 24, right: 40, bottom: 32, left: 56 };

const label = (metric: Metric, v: number) => (metric === 'sales' ? `₹${fmt(v)}` : fmt(v));

export function WeekChart({ points, metric }: { points: SeriesPoint[]; metric: Metric }) {
  const { top, step } = niceAxis(Math.max(...points.map((p) => p.value)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length > 1 ? (innerW * i) / (points.length - 1) : innerW / 2);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img" aria-label={metric} data-c2m="GL-1" data-chart={metric}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--neutral-200)" strokeDasharray={v ? '4 4' : undefined} />
          <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--neutral-500)">
            {label(metric, v)}
          </text>
        </g>
      ))}
      <path d={line} fill="none" stroke="var(--brand-500)" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.date} data-point={p.date} data-value={p.value}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill="var(--white)" stroke="var(--brand-500)" strokeWidth="2" />
          <text x={x(i)} y={y(p.value) - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--neutral-700)">
            {label(metric, p.value)}
          </text>
          <text x={x(i)} y={H - PAD.bottom + 20} textAnchor="middle" fontSize="11" fill="var(--neutral-500)">
            {shortDate(p.date)}
          </text>
        </g>
      ))}
    </svg>
  );
}
