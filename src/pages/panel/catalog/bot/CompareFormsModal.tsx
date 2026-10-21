// "See today's form" (LB-4, for judges): read-only, side by side. Left: today's Add Single Catalog, every mandatory
// field (labels from fields.ts / pricing.ts) and the image slots as empty boxes. Right: the questions on the three
// short screens. All counts are computed (MANDATORY_IDS, TODAY_IMAGE_SLOTS, MAKER_FIELDS, STEP_ROWS).
import { Button, Modal } from '../../../../components/ui';
import { useT } from '../../../../i18n';
import { BOT_STEPS, MAKER_COUNT, makerFieldsOn, MANDATORY_IDS, STEP_ROWS, TODAY_IMAGE_SLOTS } from '../bot';
import { FIELDS } from '../fields';
import { PRICE_COLUMNS } from '../pricing';

const LABEL: Record<string, string> = Object.fromEntries([...FIELDS.map((f) => [f.id, f.label]), ...PRICE_COLUMNS.map((c) => [c.key, c.label])]);
const Q_KEY: Record<string, string> = {
  material: 'q.material',
  capacity: 'q.capacity',
  leakProof: 'q.leakProof',
  addOns: 'q.addOns',
  length: 'q.size',
  netWeight: 'q.weight',
  minRun: 'qty.minRun',
  leadTimeDays: 'qty.leadTime',
  makingCost: 'price.makingCost',
  marginPct: 'price.margin',
  mrp: 'price.mrp',
};

function EmptyBox({ wide = false }: { wide?: boolean }) {
  return <span className={`block h-6 rounded-sm border border-solid border-[rgb(196,196,196)] bg-white ${wide ? 'w-full' : 'w-14'}`} />;
}

export function CompareFormsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const today = [...MANDATORY_IDS.map((id) => LABEL[id] ?? id), ...Array.from({ length: TODAY_IMAGE_SLOTS }, (_, i) => t('compare.image', { n: i + 1 }))];
  const maker = new Set(BOT_STEPS.flatMap(makerFieldsOn));
  return (
    <Modal
      open
      onClose={onClose}
      width="w-[66rem]"
      title={<span data-c2m="LB-4" data-c2m-id="LB-4">{t('compare.title')}</span>}
      footer={<Button onClick={onClose}>{t('compare.close')}</Button>}
    >
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6" data-c2m="LB-4" data-c2m-id="LB-4" data-testid="compareForms">
        <section>
          <p className="m-0 font-button text-xl leading-5 text-primary-text">{t('compare.today', { n: today.length })}</p>
          <p className="m-0 mt-0.5 font-body text-base leading-4 text-secondary-text">{t('compare.todaySub')}</p>
          <ol className="m-0 mt-3 grid list-none grid-cols-3 gap-x-3 gap-y-1.5 p-0" data-testid="compareToday">
            {today.map((label, i) => (
              <li key={i} className="min-w-0">
                <span className="block truncate font-body text-sm leading-4 text-secondary-text" title={label}>
                  {label} <span className="text-error-text">*</span>
                </span>
                <span className="mt-0.5 block">
                  <EmptyBox wide />
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded bg-secondary-bg p-4">
          <p className="m-0 font-button text-xl leading-5 text-primary-text">{t('compare.bot', { n: MAKER_COUNT })}</p>
          <p className="m-0 mt-0.5 font-body text-base leading-4 text-secondary-text">{t('compare.botSub')}</p>
          <div className="mt-3 flex flex-col gap-3" data-testid="compareBot">
            {BOT_STEPS.map((s, i) => (
              <div key={s} className="rounded bg-white px-3 py-2.5">
                <p className="m-0 font-button text-lg leading-5 text-brand-primary-text">
                  {i + 1} · {t(`bot.tab.${s}`)}
                </p>
                {STEP_ROWS[s]
                  .map((row) => row.filter((id) => maker.has(id)))
                  .filter((row) => row.length)
                  .map((row) => (
                    <div key={row.join()} className="mt-2 flex items-center justify-between gap-3">
                      <span className="min-w-0 font-body text-lg leading-5 text-primary-text">{[...new Set(row.map((id) => Q_KEY[id]).filter(Boolean))].map((k) => t(k!)).join(' · ')}</span>
                      <span className="flex shrink-0 gap-1">
                        {row.map((id) => (
                          <EmptyBox key={id} />
                        ))}
                      </span>
                    </div>
                  ))}
              </div>
            ))}
            <p className="m-0 font-body text-base leading-4 text-secondary-text">{t('compare.plusConfirm')}</p>
          </div>
        </section>
      </div>
    </Modal>
  );
}
