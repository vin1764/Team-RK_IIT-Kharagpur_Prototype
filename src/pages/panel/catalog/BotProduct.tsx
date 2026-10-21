// "Create from photos" · screen 1, Product (LB-4, doc p.14 mock-up): the maker's photos, the category the
// bot recognised (maker confirms the breadcrumb; no tree clicking) and the cover cleaned for QC.
import { Button } from '../../../components/ui';
import { useT } from '../../../i18n';
import { cleanedFor, MAX_PHOTOS } from './bot';
import type { DraftImage } from './draftStore';

function ShotList({ cleaned }: { cleaned: boolean }) {
  const t = useT();
  const item = (label: string, done: boolean) => (
    <span className="whitespace-nowrap">
      {label} {done ? '✓' : '+'}
    </span>
  );
  return (
    <p className="m-0 mt-3 flex flex-wrap gap-x-1.5 font-body text-base leading-4 text-secondary-text">
      <span>{t('bot.shot.title')}:</span>
      {item(t('bot.shot.main'), cleaned)}
      <span>·</span>
      {item(t('bot.shot.inHand'), false)}
      <span>·</span>
      {item(t('bot.shot.inUse'), false)}
    </p>
  );
}

export function BotProduct({
  photos,
  name,
  categoryPath,
  confirmed,
  onConfirm,
  onEditPhotos,
  onChooseCategory,
  onContinue,
}: {
  photos: DraftImage[];
  name: string;
  categoryPath: string[];
  confirmed: boolean;
  onConfirm: () => void;
  onEditPhotos: () => void;
  onChooseCategory: () => void;
  onContinue: () => void;
}) {
  const t = useT();
  const cover = photos[0];
  const cleaned = cleanedFor(cover);
  return (
    <div className="mt-2.5 mb-24 rounded bg-white p-6" data-c2m="LB-4" data-bot-anchor="product" data-testid="botProduct">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10">
        <div>
          <p className="m-0 font-button text-xl leading-5 text-primary-text">{t('bot.photos.title')}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <div key={p.id} className="w-24">
                <img src={p.url} alt={p.name} className="block size-24 rounded-sm border border-solid border-tertiary-border object-cover" />
                {i === 0 && <p className="m-0 mt-1 text-center font-body text-base leading-4 text-secondary-text">{t('bot.photos.cover')}</p>}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-body text-lg leading-5 text-secondary-text">{t('bot.photos.count', { n: photos.length, max: MAX_PHOTOS })}</span>
            <Button variant="text" size="sm" className="px-0" onClick={onEditPhotos}>
              {t('bot.photos.edit')}
            </Button>
          </div>

          <p className="m-0 mt-6 font-button text-xl leading-5 text-primary-text">{t('bot.cleaned.title')}</p>
          <div className="mt-3 flex items-center gap-4" data-testid="cleanedImage">
            <figure className="m-0 w-24">
              {cover && <img src={cover.url} alt="" className="block size-24 rounded-sm object-cover" />}
              <figcaption className="mt-1 text-center font-body text-base leading-4 text-secondary-text">{t('bot.cleaned.before')}</figcaption>
            </figure>
            <img src="/brand/msa/merlin/lined/chevron-right-grey.svg" alt="" width="24" height="24" className="size-6" />
            <figure className="m-0 w-24">
              <img src={(cleaned ?? cover)?.url} alt="" className="box-border block size-24 rounded-sm border border-solid border-tertiary-border bg-white object-contain" />
              <figcaption className="mt-1 text-center font-body text-base leading-4 text-secondary-text">{t('bot.cleaned.after')}</figcaption>
            </figure>
            <p className="m-0 max-w-40 font-body text-lg leading-5 text-secondary-text">{cleaned ? t('bot.cleaned.note') : t('bot.cleaned.demoOnly')}</p>
          </div>
          <ShotList cleaned={!!cleaned} />
        </div>

        <div className="flex flex-col">
          <div className="rounded-lg border border-solid border-brand-secondary-border bg-brand-secondary-bg p-4" data-testid="recognised">
            <p className="m-0 font-button text-xl leading-5 text-primary-text">{t('bot.recognised.title', { name })}</p>
            <p className="m-0 mt-1.5 font-body text-lg leading-5 text-secondary-text">{categoryPath.join(' / ')}</p>
            <div className="mt-4 flex items-center gap-4">
              {confirmed ? (
                <span className="flex items-center gap-1.5 font-button text-lg leading-5 text-success-text">
                  <img src="/brand/msa/merlin/filled/success-green.svg" alt="" width="20" height="20" className="size-5" />
                  {t('bot.recognised.confirmed')}
                </span>
              ) : (
                <Button size="sm" onClick={onConfirm}>
                  {t('bot.recognised.confirm')}
                </Button>
              )}
              <Button variant="text" size="sm" className="px-0" onClick={onChooseCategory}>
                {t('bot.recognised.change')}
              </Button>
            </div>
          </div>
          <div className="mt-auto flex justify-end pt-6">
            <Button disabled={!confirmed || !photos.length} onClick={onContinue}>
              {t('bot.continue')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
