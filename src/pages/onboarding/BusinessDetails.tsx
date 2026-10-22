// Onboarding step 1 · Business Details (FO-1 exists). C2M: the business-type question moves here
// from step 4 (FO-6) and is checked silently against GST and Udyam (FO-7: the Factory verified badge only). Replicates
// reference/screens/onb-business-details.png (GSTIN variant) + onb-business-type-dropdown.png.
import { useEffect, useState } from 'react';
import { onboarding } from '../../app/paths';
import { notInPrototype } from '../../components/Toast';
import { Banner, Button } from '../../components/ui';
import { BUSINESS_TYPES, MANUFACTURER_TYPES, eligibility, type BusinessType } from '../../engine/ui';
import { useDemo } from '../../store/demo';
import { useOnboarding, usePersona, type PersonaRecord } from '../../store/onboarding';
import { C2M } from './stepper/copy';
import { formatAddress, taxIdKind } from './stepper/format';
import { DemoFill, RuledList, SelectField, Spinner, TextField } from './stepper/fields';
import { useDevState, useGo } from './stepper/nav';
import { OnboardingLayout } from './stepper/OnboardingLayout';

const TAX_ID_LEN = 15; // GSTIN and Enrolment ID / UIN are both 15 characters


/**
 * FO-7 · The seller-type + GST + Udyam checks run silently (team, 22 Oct 2026). They decide only the "Factory
 * verified" badge (buyer-side "Direct from the maker" label, Pack Point access), not Factory Launch: that is open to
 * every seller whose price qualifies. Only a declared manufacturer sees a result:
 *  - all checks agree → one compact green line, "Factory verified ✓";
 *  - only the Udyam number is missing → exactly that (a genuine gap);
 *  - otherwise → a neutral note, no itemised reasons.
 * Any other business type (a reseller) sees nothing: the page is Meesho's as today. The itemised results are in
 * the showcase sidebar's "Behind it" only.
 */
function FactoryCheck({ persona, businessType }: { persona: PersonaRecord; businessType: BusinessType }) {
  if (!MANUFACTURER_TYPES.includes(businessType)) return null;
  const result = eligibility({
    taxId: persona.taxId,
    businessType,
    gstNatureOfBusiness: persona.gstNatureOfBusiness,
    udyamMajorActivity: persona.udyam?.majorActivity ?? null,
  });
  if (result.status === 'eligible') {
    return (
      <p className="m-0 mt-5 text-lg leading-5 font-button text-success-text" data-c2m="FO-7" data-c2m-id="FO-7" data-eligibility="eligible" data-factory-verified>
        {C2M.factoryVerified}
      </p>
    );
  }
  const udyamOnly = result.status === 'pending';
  return (
    <div className="mt-5" data-c2m="FO-7" data-c2m-id="FO-7" data-eligibility={result.status}>
      <Banner tone="info">
        <span data-factory-note={udyamOnly ? 'udyam' : 'general'}>{udyamOnly ? C2M.udyamMissing : C2M.notVerified}</span>
      </Banner>
      <div className="mt-2 flex flex-wrap gap-4">
        <button type="button" onClick={() => notInPrototype('Udyam registration')} className="bg-transparent border-0 p-0 cursor-pointer text-lg font-button text-brand-primary-text">
          {C2M.addUdyam}
        </button>
        {!udyamOnly && (
          <button type="button" onClick={() => notInPrototype('Supplier support')} className="bg-transparent border-0 p-0 cursor-pointer text-lg font-button text-brand-primary-text">
            {C2M.contactSupport}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BusinessDetails() {
  const persona = usePersona();
  const o = useOnboarding();
  const go = useGo();
  const dev = useDevState();
  const [loading, setLoading] = useState(false);
  const kind = taxIdKind(persona);

  // Dev-only states for the compare script: ?state=fetched | checked
  useEffect(() => {
    if (dev === 'fetched' || dev === 'checked') {
      useOnboarding.getState().set({ taxIdInput: persona.gstin, businessFetched: true, businessType: dev === 'checked' ? persona.businessType : null });
    }
  }, [dev, persona]);

  const verify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      o.set({ businessFetched: true });
    }, 300);
  };

  // Plain mode ("Today vs ours"): today's step 1 has no business-type question (it is on Supplier Details) and no
  // checks; the FO-6/FO-7 sections are hidden (data-c2m-id) and Continue only needs the fetched details.
  const c2m = useDemo((s) => s.c2m);
  const ready = o.businessFetched && (!c2m || o.businessType !== null);

  return (
    <OnboardingLayout
      step={0}
      aside="business"
      footer={
        <Button className="h-11 w-full" disabled={!ready} onClick={() => go(onboarding.pickupAddress)}>
          Continue
        </Button>
      }
    >
      {!o.businessFetched ? (
        <div className="mt-6 flex flex-col">
          <TextField
            label={`Enter ${kind}`}
            value={o.taxIdInput}
            maxLength={TAX_ID_LEN}
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(v) => o.set({ taxIdInput: v.toUpperCase().replace(/\s/g, '') })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && o.taxIdInput.length === TAX_ID_LEN && !loading) verify();
            }}
            trailing={
              <Button variant="text" size="sm" disabled={o.taxIdInput.length !== TAX_ID_LEN || loading} onClick={verify} className="min-w-16">
                {loading ? <Spinner /> : 'Verify'}
              </Button>
            }
          />
          <DemoFill className="mt-3" onClick={() => o.set({ taxIdInput: persona.gstin })}>
            {C2M.useDemoTaxId(kind)}
          </DemoFill>
        </div>
      ) : (
        <>
          <Banner tone="success" className="mt-5">
            {kind} details added successfully
          </Banner>
          <p className="m-0 mt-4 text-xl leading-6 font-button text-primary-text">Below details are linked to your {persona.taxId === 'GSTIN' ? 'GSTIN' : 'enrolment ID'}</p>
          <RuledList
            rows={[
              { label: kind, value: o.taxIdInput || persona.gstin },
              { label: 'Legal Name', value: persona.legalName },
              { label: 'PAN Number', value: persona.pan },
              { label: 'Registered Business Address', value: formatAddress(persona.address) },
              // FO-7: shown only once he declares a manufacturing type (a reseller's page stays Meesho's as today)
              ...(c2m && o.businessType && MANUFACTURER_TYPES.includes(o.businessType)
                ? [{ label: C2M.natureRowLabel, value: persona.gstNatureOfBusiness.join(', '), c2m: 'FO-7' }]
                : []),
            ]}
          />

          <section data-c2m="FO-6" data-c2m-id="FO-6" className="mt-6">
            <h3 className="m-0 mb-4 text-xl leading-5 font-button text-primary-text">{C2M.businessTypeHeading}</h3>
            <SelectField
              label={C2M.businessTypeLabel}
              options={BUSINESS_TYPES}
              value={o.businessType}
              onChange={(v) => o.set({ businessType: v })}
              placeholder={C2M.select}
            />
            {/* Unprompted on purpose: Meesho's 7 options in Meesho's order, nothing pre-chosen or marked. The maker
                declares; eligibility is decided only afterwards by the GST nature-of-business and Udyam checks. */}
            <DemoFill className="mt-3" onClick={() => o.set({ businessType: persona.businessType })}>
              {C2M.useDemoBusinessType}
            </DemoFill>
          </section>

          {c2m && o.businessType && <FactoryCheck persona={persona} businessType={o.businessType} />}
        </>
      )}
    </OnboardingLayout>
  );
}
