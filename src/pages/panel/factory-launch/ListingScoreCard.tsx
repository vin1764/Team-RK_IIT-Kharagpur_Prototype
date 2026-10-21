// LW-8: on Quality, from the first live day, a listing-level score for the launched listing.
// Label only ("Building"), one line, no counts. Before D21 the page stays as captured.
import { Pill } from '../../../components/ui';
import { FL } from './copy';
import { LAUNCH } from './launch';
import { useLaunchView } from './useLaunchView';

export function ListingScoreCard() {
  const v = useLaunchView();
  if (!v.commit || v.day < LAUNCH.liveFromDay) return null;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-solid border-tertiary-border p-4" data-c2m="LW-8" data-listing-score>
      <div className="flex flex-col gap-1">
        <h3 className="m-0 p-0 text-primary-text font-bold font-heading text-2xl leading-6">{FL.scoreTitle(v.bookTypeName)}</h3>
        <p className="m-0 p-0 font-normal font-body text-base leading-4 text-secondary-text">{FL.scoreLine}</p>
      </div>
      <Pill tone="warning" bordered className="!px-3 !py-1 !text-lg font-button">
        {LAUNCH.listingScoreLabel}
      </Pill>
    </div>
  );
}
