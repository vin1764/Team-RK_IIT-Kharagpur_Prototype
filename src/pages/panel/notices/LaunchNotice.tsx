// LW-6 · Pinned notice "Factory Launch Week · Home & Kitchen", at the top of the notice board for makers who
// passed the seller-type + GST/Udyam checks (counted in the sidebar's "Notices (n)"). Laid out like Meesho's sale
// notices: the creative on top (the team's banner, public/brand/local/notices/factory-launch-week-banner.png,
// original in reference/), then text and the CMS's orange button. Dates from the calendar, slots and orders from
// the order book (useLaunchEntry → useLaunchView, the same source as the Home banner and the Factory Launch tab).
import { useNavigate } from 'react-router';
import { paths } from '../../../app/paths';
import { dayToDate } from '../../../engine/ui';
import { useDemo } from '../../../store/demo';
import { LAUNCH, liveDatesShort, shortDay } from '../factory-launch/launch';
import { useLaunchEntry } from '../factory-launch/useLaunchEntry';
import { noticeCopy } from './launchNoticeCopy';
import { CTA_STYLE } from './noticeList';

export const LAUNCH_NOTICE_IMAGE = '/brand/local/notices/factory-launch-week-banner.png';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** The notice board's own date format: "Oct 24 2026". */
const noticeDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${MONTHS[m - 1]} ${String(d).padStart(2, '0')} ${y}`;
};

export function LaunchNotice() {
  const navigate = useNavigate();
  const lang = useDemo((s) => s.lang);
  const c = noticeCopy(lang);
  const { model, view, row, productName } = useLaunchEntry();
  const event = LAUNCH.name.replace(/\s+\d+$/, ''); // "Factory Launch Week"
  const type = row?.name ?? productName ?? '';

  // The status line and the button follow the maker's state, like the Home banner.
  let status: string | null = null;
  let button: { label: string; to: string } | null = null;
  switch (model?.state) {
    case 'choose':
      button = { label: c.check, to: `${paths.home}?fl=open` };
      break;
    case 'join':
      if (model.priceNotEligible) {
        // Listed above the cap: the listing is live; the launch needs a lower price (Price position).
        status = c.priceNotEligible;
        button = { label: c.viewPricePosition, to: paths.pricePosition };
        break;
      }
      status = row ? (row.slots.crowded ? c.slotsFull(type) : c.slots(row.slots.left, type)) : null;
      // Only the commit is left → straight to the order book; otherwise the Home checklist.
      button = { label: c.check, to: model.next?.key === 'stock' ? paths.factoryLaunch : `${paths.home}?fl=open` };
      break;
    case 'in':
      status = c.in(LAUNCH.name, shortDay(LAUNCH.stockAtNodeDay));
      button = { label: c.viewFactoryLaunch, to: paths.factoryLaunch };
      break;
    case 'live':
      status = c.live(view.progress?.today ?? 0);
      button = { label: c.viewLive, to: paths.factoryLaunchLive };
      break;
    case 'ended':
      status = c.ended;
      button = { label: c.results, to: paths.factoryLaunchLive };
      break;
    case 'slotRemoved':
      status = c.slotRemoved;
      button = { label: c.viewPricePosition, to: paths.pricePosition };
      break;
    case 'closed':
      status = c.closed(shortDay(LAUNCH.commitmentsCloseDay));
      break;
    case 'noBook':
      status = type ? c.noBook(type) : null;
      button = { label: c.viewFactoryLaunch, to: paths.factoryLaunch };
      break;
    default:
      // No banner model (e.g. the window closed before the maker told us his product): announcement only.
      break;
  }
  const go = () => button && navigate(button.to);

  return (
    <div className="bg-white rounded-lg p-4 mt-0 mx-0 mb-2" data-c2m="LW-6" data-c2m-id="LW-6" data-fl-notice data-fl-notice-state={model?.state ?? 'none'}>
      <div className="mb-1 flex items-center gap-2">
        <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">{c.title(event, LAUNCH.category, liveDatesShort())}</h3>
        <span className="inline-flex shrink-0 items-center rounded-full bg-brand-secondary-bg px-2 py-0.5 text-sm leading-4 text-brand-primary-text">{c.pinned}</span>
      </div>
      {/* Announced on the demo's day 0 (calendar.json d0). */}
      <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text">{noticeDate(dayToDate(0))}</p>
      <div className="mt-4 text-primary-text text-xl leading-[1.5]">
        {/* Full width of the card, never cropped or stretched. */}
        <img src={LAUNCH_NOTICE_IMAGE} alt={c.creativeAlt} className="block w-full h-auto rounded" data-fl-notice-creative />
        <p className="m-0 mt-4">{c.body(shortDay(LAUNCH.commitmentsCloseDay))}</p>
        {status && (
          <p className={`m-0 mt-2 font-heading font-bold ${model?.state === 'slotRemoved' ? 'text-error-text' : ''}`} data-fl-notice-status>
            {status}
          </p>
        )}
        {button && (
          <a role="button" tabIndex={0} style={CTA_STYLE} onClick={go} onKeyDown={(e) => e.key === 'Enter' && go()} data-fl-notice-cta>
            {button.label}
          </a>
        )}
      </div>
    </div>
  );
}
