// LW-6 · Pinned notice "Factory Launch Week · Home & Kitchen", at the top of the notice board for makers who
// passed the seller-type + GST/Udyam checks (counted in the sidebar's "Notices (n)"). Same card as Meesho's
// notices (Notices.tsx), with the CMS's orange CTA. Dates from the calendar, slots from the order book.
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { dayToDate } from '../../../engine/ui';
import { FL } from '../factory-launch/copy';
import { LAUNCH, liveDatesShort, shortDay } from '../factory-launch/launch';
import { useLaunchEntry } from '../factory-launch/useLaunchEntry';
import { CTA_STYLE } from './noticeList';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** The notice board's own date format: "Oct 24 2026". */
const noticeDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${MONTHS[m - 1]} ${String(d).padStart(2, '0')} ${y}`;
};

export function LaunchNotice() {
  const navigate = useNavigate();
  const { model, row } = useLaunchEntry();
  // "Check my eligibility" opens the Home banner's checklist; a maker with no banner (no order book for
  // their product type) goes to the Factory Launch tab instead.
  const target = model?.hasChecklist ? `${paths.home}?fl=open` : paths.factoryLaunch;
  const slots = row ? FL.banner.slotsFor(row.slots.crowded ? FL.slotsFull : FL.slotsLeft(row.slots.left), row.name) : null;
  const open = () => navigate(target);
  return (
    <div className="bg-white rounded-lg p-4 mt-0 mx-0 mb-2" data-c2m="LW-6" data-c2m-id="LW-6" data-fl-notice>
      <div className="mb-1 flex items-center gap-2">
        <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">{FL.eventTitle(LAUNCH.name.replace(/\s+\d+$/, ''), LAUNCH.category)}</h3>
        <span className="inline-flex items-center rounded-full bg-brand-secondary-bg px-2 py-0.5 text-sm leading-4 text-brand-primary-text">{FL.notice.pinned}</span>
      </div>
      {/* Announced on the demo's day 0 (calendar.json d0). */}
      <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text">{noticeDate(dayToDate(0))}</p>
      <div className="mt-4 text-primary-text text-xl leading-[1.5]">
        <p className="m-0">
          <strong className="font-heading">{LAUNCH.name}</strong> · {FL.banner.manufacturersOnly} · {FL.banner.noAds}
        </p>
        <p className="m-0 mt-2">{FL.notice.body}</p>
        <p className="m-0 mt-2">{FL.notice.dates(shortDay(LAUNCH.commitmentsCloseDay), shortDay(LAUNCH.stockAtNodeDay), liveDatesShort())}</p>
        {slots && model?.state === 'join' && <p className="m-0 mt-2">{slots}</p>}
        <a role="button" tabIndex={0} style={CTA_STYLE} onClick={open} onKeyDown={(e) => e.key === 'Enter' && open()} data-fl-notice-cta>
          {FL.banner.check}
        </a>
      </div>
    </div>
  );
}
