// Home (growth/home). Two captured states:
//   default    → reference/screens/home.png: step 1 "Upload catalogs to get started"
//   ?state=qc  → reference/html/meesho-home.html: step 2 with the QC status table
//   live       → (C2M, LB-8) after "Go live" from photos: step 2 shows the live catalog
// Later phases will pick the state from the demo day instead of the query string.
import { useSearchParams } from 'react-router';
import { notInPrototype } from '../../components/Toast';
import { useDemo } from '../../store/demo';
import { useScriptedListing } from '../../store/timeline';
import { LAUNCH } from './factory-launch/launch';
import { HomeRail } from './home/HomeRail';
import { HomeSteps, type HomeState } from './home/HomeSteps';

function WelcomeHeader() {
  return (
    <div className="flex justify-between items-start rounded bg-white p-4 pe-6">
      <div className="flex">
        <div>
          <h1 className="m-0 p-0 text-primary-text font-bold font-heading text-4xl leading-7">Welcome Team RK</h1>
          <div className="flex gap-1 flex-wrap items-center">
            <p className="m-0 p-0 font-normal font-body text-xl leading-5 text-secondary-text mt-1">Let's get your business started in 3 steps</p>
          </div>
        </div>
      </div>
      <div
        className="flex items-center border border-solid rounded-lg cursor-pointer border-brand-secondary-border p-1 pe-2.75"
        role="button"
        onClick={() => notInPrototype('Need Help?')}
      >
        <img src="/brand/msa/merlin/filled/support-blue.svg" alt="" width="30" height="30" />
        <span className="m-0 p-0 font-semibold font-button text-lg leading-5 ml-2.5 text-brand-primary-text">Need Help?</span>
      </div>
    </div>
  );
}

export function HomeView({ state }: { state: HomeState }) {
  return (
    <>
      <WelcomeHeader />
      <div className="flex justify-between m-3">
        <HomeSteps key={state} state={state} />
        <HomeRail />
      </div>
    </>
  );
}

export default function Home() {
  const [params] = useSearchParams();
  const day = useDemo((s) => s.day);
  const listing = useScriptedListing();
  // A real go-live listing of this persona; or, once the listing day is behind (presenter jumped
  // ahead), the scripted one. On the listing day itself Home keeps the upload choice for the demo.
  const live = !!listing && (!listing.scripted || day > LAUNCH.listingDay);
  return <HomeView state={params.get('state') === 'qc' ? 'qc' : live ? 'live' : 'start'} />;
}
