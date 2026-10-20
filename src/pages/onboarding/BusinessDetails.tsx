// Onboarding step 1 · Business Details (FO-1 exists). C2M: the business-type question moves here
// from step 4 (FO-6) and is checked live against GST and Udyam (FO-7). Replicates
// reference/screens/onb-business-details.png (GSTIN variant) + onb-business-type-dropdown.png.
import { useEffect, useState } from 'react';
import { onboarding } from '../../app/paths';
import { notInPrototype } from '../../components/Toast';
import { Banner, Button, Pill, cx } from '../../components/ui';
import { BUSINESS_TYPES, eligibility, type BusinessType, type EligibilityCheck } from '../../engine/ui';
import { useOnboarding, usePersona, type PersonaRecord } from '../../store/onboarding';
import { C2M } from './stepper/copy';
import { formatAddress, taxIdKind } from './stepper/format';
import { DemoFill, RuledList, SelectField, Spinner, TextField } from './stepper/fields';
import { useDevState, useGo } from './stepper/nav';
import { OnboardingLayout } from './stepper/OnboardingLayout';

const TAX_ID_LEN = 15; // GSTIN and Enrolment ID / UIN are both 15 characters


function Check({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className="flex items-start gap-2 text-lg leading-5 font-body text-primary-text">
      <span aria-label={ok ? 'passed' : 'failed'} className={cx('w-3 shrink-0 font-heading', ok ? 'text-success-text' : 'text-error-text')}>
        {ok ? '✓' : '✗'}
      </span>
      {children}
    </li>
  );
}

function AutomaticChecks({ persona, businessType }: { persona: PersonaRecord; businessType: BusinessType }) {
  const udyamActivity = persona.udyam?.majorActivity ?? null;
  const result = eligibility({
    taxId: persona.taxId,
    businessType,
    gstNatureOfBusiness: persona.gstNatureOfBusiness,
    udyamMajorActivity: udyamActivity,
  });
  const ok = (c: EligibilityCheck) => !result.failedChecks.includes(c);
  const gstinFailed = !ok('gstin');
  return (
    <section data-c2m="FO-7" className="mt-6">
      <h3 className="m-0 text-xl leading-5 font-button text-primary-text">{C2M.checksHeading}</h3>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
        {gstinFailed ? (
          <Check ok={false}>{C2M.gstinRow}</Check>
        ) : (
          <>
            <Check ok={ok('sellerType')}>{C2M.sellerType(ok('sellerType'))}</Check>
            <Check ok={ok('gstNature')}>{C2M.gstNature(persona.gstNatureOfBusiness)}</Check>
            <Check ok={ok('udyam')}>{C2M.udyam(udyamActivity, persona.udyam?.number ?? null)}</Check>
          </>
        )}
      </ul>
      <div className="mt-3" data-eligibility={result.status}>
        {result.status === 'eligible' && (
          <Pill tone="success" bordered className="!px-3 !py-1 !text-lg font-button">
            {C2M.eligible}
          </Pill>
        )}
        {result.status === 'pending' && (
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="info" bordered className="!px-3 !py-1 !text-lg font-button">
              {C2M.pending}
            </Pill>
            <button type="button" onClick={() => notInPrototype('Udyam registration')} className="bg-transparent border-0 p-0 cursor-pointer text-lg font-button text-brand-primary-text">
              {C2M.registerUdyam}
            </button>
          </div>
        )}
        {result.status === 'notEligible' && (
          <>
            <Pill className="!px-3 !py-1 !text-lg font-button !bg-tertiary-bg !text-secondary-text !border-secondary-border" bordered>
              {C2M.notEligible}
            </Pill>
            <p className="m-0 mt-2 text-lg leading-5 font-body text-primary-text">{C2M.stillSells}</p>
            <p className="m-0 mt-1 text-lg leading-5 font-body text-secondary-text">{C2M.why}</p>
            <ul className="m-0 mt-0.5 list-disc pl-5 text-lg leading-5 font-body text-secondary-text">
              {result.failedChecks.map((c) => (
                <li key={c} data-failed-check={c}>
                  {C2M.failed(c, udyamActivity)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
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

  const ready = o.businessFetched && o.businessType !== null;

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
              { label: C2M.natureRowLabel, value: persona.gstNatureOfBusiness.join(', '), c2m: 'FO-7' },
            ]}
          />

          <section data-c2m="FO-6" className="mt-6">
            <h3 className="m-0 mb-4 text-xl leading-5 font-button text-primary-text">{C2M.businessTypeHeading}</h3>
            <SelectField
              label={C2M.businessTypeLabel}
              options={BUSINESS_TYPES}
              value={o.businessType}
              onChange={(v) => o.set({ businessType: v })}
              badge={(v) =>
                v === persona.businessType ? (
                  <Pill tone="brand" className="shrink-0">
                    {C2M.suggested}
                  </Pill>
                ) : null
              }
            />
          </section>

          {o.businessType && <AutomaticChecks persona={persona} businessType={o.businessType} />}
        </>
      )}
    </OnboardingLayout>
  );
}
