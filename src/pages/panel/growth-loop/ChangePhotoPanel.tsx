// GL-3 · SKU Health Coach → "Change main photo" (the lunch box). Side panel (the growth-loop plan panels' frame):
// left, the current main photo with its click-through; right, the suggested one (the same photo cleaned offline to a
// white background, centred, no props — a neutral placeholder in this prototype) and the shot tip. Options:
// "Use suggested photo" · "Upload another photo" (file picker; cleaned the same way in the browser, ./cleanPhoto.ts) ·
// Cancel. "Apply" stores the new main image (src/store/coachFix.ts): Inventory and the coach cards show it from
// then on. Nothing else about the listing changes, so its bot-details review stays as it is.
import { useRef, useState } from 'react';
import { Button, cx } from '../../../components/ui';
import { useT } from '../../../i18n';
import { useCoachFix } from '../../../store/coachFix';
import { useDemo } from '../../../store/demo';
import { T } from '../manage-pricing/crystal';
import { cleanPhoto } from './cleanPhoto';
import { SUGGESTED_PHOTOS, useSkuImage } from './parts';
import { Row, SidePanel } from './SidePanel';

type Choice = { source: 'suggested' | 'upload'; image: string } | null;

function Photo({ src, label, sub, selected, testId }: { src: string | undefined; label: string; sub?: string; selected?: boolean; testId: string }) {
  return (
    <figure className="m-0 flex flex-col gap-2" data-photo={testId}>
      <figcaption className={cx(T.bodySm, 'font-medium text-neutral-primary')}>{label}</figcaption>
      <div className={cx('aspect-square overflow-hidden rounded-8 border border-solid bg-neutral-base', selected ? 'border-2 border-brand-base' : 'border-neutral-light')}>
        {src ? <img src={src} alt={label} className="size-full object-contain" /> : null}
      </div>
      {sub && <p className={cx(T.bodySm, 'text-neutral-secondary')}>{sub}</p>}
    </figure>
  );
}

export function ChangePhotoPanel({ skuId, skuName, ctrDisplay, onClose }: { skuId: string; skuName: string; ctrDisplay: string; onClose: () => void }) {
  const t = useT();
  const persona = useDemo((s) => s.persona);
  const day = useDemo((s) => s.day);
  const apply = useCoachFix((s) => s.apply);
  const now = useSkuImage(skuId);
  const suggested = SUGGESTED_PHOTOS[skuId];
  const [choice, setChoice] = useState<Choice>(null);
  const [upload, setUpload] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError(false);
    try {
      const cleaned = await cleanPhoto(f);
      setUpload(cleaned);
      setChoice({ source: 'upload', image: cleaned });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const right = choice?.source === 'upload' && upload ? upload : suggested;
  return (
    <SidePanel
      title={t('gl.photo.title', { sku: skuName })}
      closeLabel={t('gl.photo.cancel')}
      onClose={onClose}
      c2m="GL-3"
      rootAttrs={{ 'data-photo-root': true }}
      panelAttrs={{ 'data-photo-panel': skuId }}
      footer={
        <>
          <Button variant="outline" onClick={onClose} data-photo-cancel>
            {t('gl.photo.cancel')}
          </Button>
          <Button
            disabled={!choice || busy}
            data-photo-apply
            onClick={() => {
              if (!choice) return;
              apply(persona, { sku: skuId, day, image: choice.image, source: choice.source });
              onClose();
            }}
          >
            {t('gl.photo.apply')}
          </Button>
        </>
      }
    >
      <Row label={t('gl.photo.compare')}>
        <div className="grid grid-cols-2 gap-4">
          <Photo src={now} label={t('gl.photo.now', { ctr: ctrDisplay })} testId="now" />
          <Photo
            src={right}
            label={t(choice?.source === 'upload' ? 'gl.photo.yours' : 'gl.photo.suggested')}
            sub={t('gl.photo.tip')}
            selected={!!choice}
            testId={choice?.source === 'upload' ? 'upload' : 'suggested'}
          />
        </div>
      </Row>
      <Row label={t('gl.photo.options')}>
        <div className="flex flex-wrap gap-3">
          <Button variant={choice?.source === 'suggested' ? 'primary' : 'outline'} size="sm" onClick={() => suggested && setChoice({ source: 'suggested', image: suggested })} data-photo-use-suggested>
            {t('gl.photo.useSuggested')}
          </Button>
          <Button variant={choice?.source === 'upload' ? 'primary' : 'outline'} size="sm" onClick={() => file.current?.click()} disabled={busy} data-photo-upload>
            {t('gl.photo.upload')}
          </Button>
          <input
            ref={file}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            data-photo-file
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        {busy && <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.photo.cleaning')}</p>}
        {error && <p className={cx(T.bodySm, 'text-error-text')}>{t('gl.photo.unreadable')}</p>}
        <p className={cx(T.bodySm, 'text-neutral-secondary')}>{t('gl.photo.note')}</p>
      </Row>
    </SidePanel>
  );
}
