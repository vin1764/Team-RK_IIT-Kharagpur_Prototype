// Home right rail: "Complete your account setup" + "Learn & Grow On Meesho".
// Ported from reference/html/meesho-home.html (classes as captured). From D28 the SKU Health Coach
// card (GL-3) is added on top.
import { notInPrototype } from '../../../components/Toast';
import { HomeCoachCard } from '../growth-loop/CoachCard';
import { useGrowth } from '../growth-loop/useGrowth';

function AccountSetupCard() {
  return (
    <div className="flex flex-col p-4 gap-4 bg-white rounded">
      <h4 className="m-0 p-0 font-bold font-heading text-xl leading-5 text-primary-text">Complete your account setup</h4>
      <p className="m-0 p-0 font-normal font-body text-lg leading-5 text-secondary-text">
        Add the below information to improve your selling journey
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 cursor-pointer" role="button" onClick={() => notInPrototype('Set Password')}>
          <img src="/brand/msa/merlin/lined/add-blue.svg" alt="" width="24" height="24" />
          <span className="m-0 p-0 font-semibold font-button text-lg leading-5 text-brand-primary-text">Set Password</span>
        </div>
      </div>
    </div>
  );
}

type LearnRow = { title: string; icon: string; size: number; iconBg: string; pill?: string; sub?: string };

const LEARN: LearnRow[] = [
  {
    title: 'Book free live training',
    icon: '/brand/msa/merlin/lined/support-blue.svg',
    size: 24,
    iconBg: 'bg-tertiary-bg/60',
    pill: 'Expert Led',
    sub: 'Learn to operate and grow your business on meesho.',
  },
  { title: 'Prepare catalogs for meesho', icon: '/brand/msa/merlin/filled/youtube.svg', size: 24, iconBg: 'bg-white' },
  { title: 'Pricing & commission', icon: '/brand/msa/merlin/lined/percentage-blue.svg', size: 13, iconBg: 'bg-tertiary-bg/60' },
  { title: 'Delivery & Returns', icon: '/brand/msa/merlin/filled/truck-blue.svg', size: 18, iconBg: 'bg-tertiary-bg/60' },
];

function LearnGrowCard() {
  return (
    <div className="m-0 pt-4 pb-3 px-3 bg-white rounded-lg">
      <h4 className="m-0 p-0 text-primary-text font-bold font-heading text-xl leading-5">Learn & Grow On Meesho</h4>
      <div className="pl-1 pr-2">
        {LEARN.map((r, i) => (
          <div key={r.title} className="cursor-pointer" role="button" onClick={() => notInPrototype(r.title)}>
            <div className="flex items-start px-1.5 py-4 w-full gap-2.5">
              <div className={`flex items-center justify-center ${r.iconBg} w-7 h-7`}>
                <img src={r.icon} alt="" width={r.size} height={r.size} />
              </div>
              <div className="w-full pr-4 flex-1">
                <div className="m-0 p-0 font-normal font-body text-lg leading-5 flex items-center text-primary-text ml-1 gap-2">
                  {r.title}
                  {r.pill && (
                    <span className="inline-flex items-center justify-center rounded-full gap-1 bg-success-bg text-success-text border border-success-border py-0.5 px-2 text-sm leading-5 border-none">
                      {r.pill}
                    </span>
                  )}
                </div>
                <div className="m-0 p-0 text-primary-text font-normal font-body text-lg leading-5">
                  {r.sub && <p className="m-0 p-0 font-body text-lg leading-5 text-secondary-text ml-0.75 font-medium">{r.sub}</p>}
                </div>
              </div>
              <img src="/brand/msa/merlin/lined/chevron-up-blue.svg" alt="" width="20" height="20" className="rotate-90" />
            </div>
            {i < LEARN.length - 1 && (
              <div
                className="w-full h-[0.0625rem] border-b border-solid border-b-secondary-border border-l-0 border-tertiary-bg"
                role="separator"
                aria-orientation="horizontal"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeRail() {
  // C2M (GL-3): from D28, "This week's one fix" tops the rail once the maker is live.
  const g = useGrowth();
  return (
    <div className="w-[calc(33.333333%-0.375rem)] flex flex-col gap-2.5 max-[767px]:w-full">
      {g && <HomeCoachCard g={g} />}
      <AccountSetupCard />
      <LearnGrowCard />
    </div>
  );
}
