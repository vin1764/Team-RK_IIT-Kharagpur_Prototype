// Onboarding finish screen (C2M; ours-only), after Supplier Details → Submit, for verified manufacturers only
// (seller type + GST nature of business + Udyam passed, FO-7). Resellers and non-factory sellers go straight
// to the dashboard as today. We can't trust Udyam or IndiaMART data to know the exact product, so the maker
// tells us here, then sees the demand teaser (FO-4) and runs the 5-minute cost check (FO-5) for it.
//   1. What do you make? Meesho's category search + tree (the Add Single Catalog components and data), or
//      one product photo the bot recognises ("Recognised: … — Correct? Yes / Change").
//   2. FO-4 teaser for the chosen type: open gap and price band from demandForType, or a neutral line.
//   3. FO-5 cost check inline, with the maker's Pickup Address shipping choice (FO-8).
// "Check my eligibility" opens Home with the Factory Launch banner expanded; "Skip for now" opens Home.
import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { paths } from '../../app/paths';
import { Button } from '../../components/ui';
import { eligibility, productTypeName, type ProductTypeId } from '../../engine/ui';
import { useDemo } from '../../store/demo';
import { useMakerProduct, useMakerProductType } from '../../store/makerProduct';
import { useOnboarding, usePersona } from '../../store/onboarding';
import { CategorySearch } from '../panel/catalog/CategorySearch';
import { CategoryTree } from '../panel/catalog/CategoryTree';
import { isLeafPath } from '../panel/catalog/categories';
import { DEMO_IMAGE } from '../panel/catalog/draftStore';
import { ProductsModal } from '../panel/catalog/ProductsModal';
import { FIN } from './finish/copy';
import { CostCheckInline, finishMode, hasFeeCard } from './finish/CostCheckInline';
import { pathForType, recognisedType, searchProducts, typeForPath } from './finish/productPick';
import { demandOrNull } from './signup/guards';
import { linkWithDemo, rupeeRange, useDemoLink } from './signup/nav';
import { DemoFill } from './stepper/fields';
import { useDevState } from './stepper/nav';
import { OnboardingDoneLayout } from './stepper/OnboardingLayout';

/** Where the leaf sits, as the bot's Product screen shows it: "Kitchen Storage / Water Bottles". */
const where = (path: string[]) => path.slice(-2).join(' / ');

/** Whether the current persona passed the factory-track checks (with the business type they answered). */
export function useFinishEligible(): boolean {
  const record = usePersona();
  const answered = useOnboarding((s) => s.businessType);
  const e = eligibility({
    taxId: record.taxId,
    businessType: answered ?? record.businessType,
    gstNatureOfBusiness: record.gstNatureOfBusiness,
    udyamMajorActivity: record.udyam?.majorActivity ?? null,
  });
  return e.status === 'eligible';
}

function Teaser({ type }: { type: ProductTypeId }) {
  const d = demandOrNull(type);
  const band = d?.priceBand ?? null;
  return (
    <section className="mt-4 rounded border border-solid border-brand-primary-border bg-white p-6" data-c2m="FO-4" data-c2m-id="FO-4" data-teaser={d ? 'demand' : 'none'}>
      <h2 className="m-0 font-heading text-2xl leading-6 text-primary-text">{FIN.teaserTitle(productTypeName(type))}</h2>
      {d ? (
        <>
          <p className="m-0 mt-2 text-xl leading-6 text-primary-text" data-gap>
            {FIN.gap(d.gapPerWeek.low, band ? rupeeRange(band.low, band.high) : null)}
          </p>
          <div className="mt-2 text-lg leading-5">
            <p className="m-0 font-button">{FIN.launchLine}</p>
            <p className="m-0 text-tertiary-text">{FIN.forecast}</p>
          </div>
        </>
      ) : (
        <p className="m-0 mt-2 text-lg leading-5 text-secondary-text">{FIN.noDemand}</p>
      )}
    </section>
  );
}

function FinishPage() {
  const persona = usePersona();
  const personaId = useDemo((s) => s.persona);
  const fulfilment = useOnboarding((s) => s.fulfilment);
  const maker = useMakerProductType();
  const choose = useMakerProduct((s) => s.choose);
  const clear = useMakerProduct((s) => s.clear);
  const { go } = useDemoLink();
  const dev = useDevState();
  const search = useRef<HTMLInputElement>(null);

  const own = persona.product;
  const [treePath, setTreePath] = useState<string[]>(maker.choice?.categoryPath ?? []);
  const [photoOpen, setPhotoOpen] = useState(false);
  /** a photo the bot has recognised, awaiting "Correct?" */
  const [pending, setPending] = useState<ProductTypeId | null>(null);
  const [unrecognised, setUnrecognised] = useState(false);
  const [making, setMaking] = useState('');

  const choice = maker.source === 'chosen' ? maker.choice : null;
  const type = choice?.type ?? null;

  const pickPath = (path: string[]) => {
    setTreePath(path);
    setPending(null);
    setUnrecognised(false);
    const t = typeForPath(path);
    // A tree leaf (4 levels) or a product type's own path (search hit outside the captured tree) is an answer.
    if (isLeafPath(path) || t) {
      choose(personaId, { categoryPath: path, type: t, via: 'category' });
      setMaking('');
    }
  };

  const demoFill = () => {
    if (!own) return;
    const path = pathForType(own.type);
    if (!path) return;
    setTreePath(path);
    setPending(null);
    choose(personaId, { categoryPath: path, type: own.type, via: 'category' });
    setMaking(String(own.makingCost));
  };

  // Dev / showcase `?state=picked`: the persona's own product picked and its making cost filled.
  useEffect(() => {
    if (dev === 'picked') demoFill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dev, personaId]);

  const changeAnswer = () => {
    clear(personaId);
    setPending(null);
    setMaking('');
    setTimeout(() => search.current?.focus(), 0);
  };

  const mode = type && hasFeeCard(type) ? finishMode(fulfilment, persona, type) : null;
  const marginPct = type && own?.type === type ? own.marginPct : 0;

  return (
    <OnboardingDoneLayout
      footer={
        <>
          <Button className="h-11 px-6" onClick={() => go(`${paths.home}?fl=open`)} data-finish-check>
            {FIN.check}
          </Button>
          <Button variant="outline" className="h-11 px-6" onClick={() => go(paths.home)} data-finish-skip>
            {FIN.skip}
          </Button>
        </>
      }
    >
      <div data-c2m="FO-7" data-c2m-id="FO-7" data-finish>
        <div className="mt-6 flex items-start gap-3">
          <img src="/brand/msa/merlin/filled/success-green.svg" alt="" width="32" height="32" className="mt-0.5 size-8 shrink-0" />
          <div>
            <h1 className="m-0 font-heading text-4xl leading-7 text-primary-text">{FIN.title}</h1>
            <p className="m-0 mt-1 text-xl leading-5 text-secondary-text">{FIN.sub}</p>
          </div>
        </div>

        {/* 1 · What do you make? */}
        <section className="mt-5 rounded bg-white p-6" data-product-pick>
          {choice ? (
            <div className="flex items-center justify-between gap-4" data-picked={choice.type ?? 'none'}>
              <div className="min-w-0">
                <p className="m-0 text-base leading-4 text-secondary-text">{FIN.yourProduct}</p>
                <p className="m-0 mt-1 font-heading text-xl leading-6 text-primary-text">
                  {choice.type ? productTypeName(choice.type) : choice.categoryPath.at(-1)}{' '}
                  <span className="font-body text-lg text-secondary-text">· {choice.categoryPath.join(' › ')}</span>
                </p>
                {!choice.type && <p className="m-0 mt-1 text-lg leading-5 text-secondary-text">{FIN.noTypeForLeaf(choice.categoryPath.at(-1)!)}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={changeAnswer} data-change>
                {FIN.change}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className="m-0 mb-2 font-heading text-2xl leading-6 text-secondary-text">{FIN.pickHeading}</h3>
                  <CategorySearch ref={search} onPick={pickPath} search={searchProducts} placeholder={FIN.searchPlaceholder} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg text-tertiary-text">{FIN.or}</span>
                  <Button variant="outline" className="h-11" onClick={() => setPhotoOpen(true)} data-photo-open>
                    {FIN.photo}
                  </Button>
                </div>
              </div>
              {pending && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-solid border-brand-secondary-border bg-brand-secondary-bg px-4 py-3" data-recognised={pending}>
                  <p className="m-0 flex-1 text-lg leading-5 text-primary-text">
                    <span className="font-button">{FIN.recognised(productTypeName(pending), where(pathForType(pending) ?? []))}</span> — {FIN.correct}
                  </p>
                  <Button size="sm" onClick={() => pickPath(pathForType(pending) ?? [])} data-recognised-yes>
                    {FIN.yes}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPending(null);
                      search.current?.focus();
                    }}
                  >
                    {FIN.change}
                  </Button>
                </div>
              )}
              {unrecognised && <p className="m-0 mt-4 text-lg leading-5 text-secondary-text">{FIN.notRecognised}</p>}
              <div className="mt-6 overflow-x-auto">
                <CategoryTree path={treePath} onChange={pickPath} variant="single" onSearchCategory={() => search.current?.focus()} />
              </div>
              {own && (
                <DemoFill className="mt-4" onClick={demoFill}>
                  {FIN.demo}
                </DemoFill>
              )}
            </>
          )}
        </section>

        {/* 2 · FO-4 teaser and 3 · FO-5 cost check, for the chosen type */}
        {type && <Teaser type={type} />}
        {type && (
          <div className="mt-4">
            {mode ? (
              <CostCheckInline key={type} type={type} mode={mode} marginPct={marginPct} making={making} onMaking={setMaking} />
            ) : (
              <section className="rounded bg-white p-6 text-lg leading-5 text-secondary-text" data-c2m="FO-5" data-c2m-id="FO-5">
                {FIN.noFeeCard}
              </section>
            )}
          </div>
        )}
      </div>

      {photoOpen && (
        <ProductsModal
          initial={[DEMO_IMAGE]}
          photos={{ ...FIN.photoModal, addLabel: FIN.photoModal.add, max: 1 }}
          onCancel={() => setPhotoOpen(false)}
          onContinue={() => {
            setPhotoOpen(false);
            const t = recognisedType(own?.type);
            setPending(t);
            setUnrecognised(!t);
          }}
        />
      )}
    </OnboardingDoneLayout>
  );
}

/**
 * Ours-only: verified manufacturers; anyone else is sent to the dashboard, as Submit does today. In plain mode
 * ("Today vs ours") the screen's content is hidden like every C2M element; Submit never comes here then.
 */
export default function Finish() {
  const ok = useFinishEligible();
  const persona = useDemo((s) => s.persona);
  const { search } = useLocation();
  if (!ok) return <Navigate to={linkWithDemo(paths.home, search)} replace />;
  return <FinishPage key={persona} />;
}
