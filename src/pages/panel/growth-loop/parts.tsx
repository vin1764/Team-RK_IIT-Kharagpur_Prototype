// Small pieces shared by the growth-loop inserts. Only the panel's own primitives and classes:
// the Pill, the Business Dashboard's joined funnel tiles, the crystal (i) tooltip.
import type { ReactNode } from 'react';
import { Pill, cx } from '../../../components/ui';
import type { Verdict, VerdictReason } from '../../../engine/ui';
import type { T as Tr } from '../../../i18n';
import { useCoachFix } from '../../../store/coachFix';
import { useDemo } from '../../../store/demo';
import { CrystalTip, T } from '../manage-pricing/crystal';

const VERDICT_TONE: Record<Verdict, 'success' | 'info' | 'warning' | 'error' | 'brand'> = {
  makeMore: 'success',
  keep: 'info',
  fix: 'warning',
  stop: 'error',
  switch: 'brand',
};

/** GL-5: the verdict chip and its one-line reason (no numbers, team Q5). */
export function VerdictChip({ verdict, reason, t }: { verdict: Verdict; reason: VerdictReason; t: Tr }) {
  return (
    <div className="flex flex-col items-start gap-1" data-c2m="GL-5" data-c2m-id="GL-5" data-verdict={verdict}>
      <Pill tone={VERDICT_TONE[verdict]} bordered className="!text-body-small whitespace-nowrap">
        {t(`gl.verdict.${verdict}`)}
      </Pill>
      <p className={cx(T.bodySm, 'text-neutral-secondary')} data-reason={reason}>
        {t(`gl.reason.${reason}`)}
      </p>
    </div>
  );
}

export interface Tile {
  key: string;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  info?: string;
}

/** A row of joined tiles, the Business Dashboard funnel-tile markup (FunnelTiles.tsx). */
export function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="flex justify-center">
      {tiles.map((t) => (
        <div key={t.key} data-tile={t.key} className="flex flex-1 flex-col border border-solid border-neutral-light border-r-0 p-4 first:rounded-l-8 last:rounded-r-8 last:border-r">
          <div className="flex items-center gap-1">
            <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t.label}</p>
            {t.info && <CrystalTip icon="blue" text={t.info} />}
          </div>
          <div className="flex items-baseline gap-2 pt-2">
            <h3 className={T.h3}>{t.value}</h3>
            {t.sub && <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Product thumbnail: the listing's cleaned cover for the bottle, the panel's image placeholder otherwise. */
export function Thumb({ src }: { src?: string }) {
  return (
    <div className="flex items-center justify-center shrink-0 size-12 rounded-sm border border-solid border-neutral-light bg-neutral-base overflow-hidden">
      <img src={src ?? '/brand/msa/merlin/filled/image-v2.svg'} alt="" className={src ? 'size-12 object-contain' : 'size-6 opacity-60'} />
    </div>
  );
}

/** Seeded SKU photos: the bottle (the bot's cleaned cover) and the lunch box's current main photo (placeholder). */
export const THUMBS: Record<string, string> = {
  bottle: '/brand/local/catalog/demo-product-bottle-cleaned.png',
  lunchbox: '/brand/local/catalog/demo-lunchbox-now.svg',
};

/** The coach's suggested main photo: the same photo cleaned offline to a white background (placeholder). */
export const SUGGESTED_PHOTOS: Record<string, string> = { lunchbox: '/brand/local/catalog/demo-lunchbox-cleaned.svg' };

/** A SKU's main image now: the photo he applied through the coach (from its day on), else the seeded one. */
export function useSkuImage(skuId: string): string | undefined {
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const applied = useCoachFix((s) => s.applied[persona]);
  return applied && applied.sku === skuId && applied.day <= day ? applied.image : THUMBS[skuId];
}
