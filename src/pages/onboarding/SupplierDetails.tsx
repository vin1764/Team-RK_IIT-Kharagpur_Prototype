// Onboarding step 4 · Supplier Details. Replicates reference/screens/onb-supplier-details.png
// minus "What's your business type", which moved to step 1 (FO-6). The WhatsApp opt-in stays
// as today (FO-2 uses its record). Mock only: Submit creates nothing.
// Plain mode ("Today vs ours", c2m off): the business-type question is back here, as captured.
import { useEffect, useState } from 'react';
import { paths } from '../../app/paths';
import { notInPrototype, toast } from '../../components/Toast';
import { Banner, Button } from '../../components/ui';
import { BUSINESS_TYPES } from '../../engine/ui';
import { useDemo } from '../../store/demo';
import { useOnboarding, usePersona } from '../../store/onboarding';
import { C2M } from './stepper/copy';
import { Checkbox, DemoFill, SelectField, TextField } from './stepper/fields';
import { useDevState, useGo } from './stepper/nav';
import { OnboardingLayout } from './stepper/OnboardingLayout';

export default function SupplierDetails() {
  const persona = usePersona();
  const o = useOnboarding();
  const go = useGo();
  const dev = useDevState();
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState(persona.name);
  const [email, setEmail] = useState('');
  const [whatsApp, setWhatsApp] = useState(true);
  const [agree, setAgree] = useState(true);

  const fillDemo = () => {
    setStoreName(persona.storeName);
    setEmail(persona.email);
    if (!useDemo.getState().c2m && !useOnboarding.getState().businessType) o.set({ businessType: persona.businessType });
  };
  useEffect(() => {
    setFullName(persona.name);
    if (dev === 'filled') fillDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, dev]);

  const c2m = useDemo((s) => s.c2m);
  const ready = storeName.trim() !== '' && email.trim() !== '' && fullName.trim() !== '' && agree && (c2m || o.businessType !== null);

  return (
    <OnboardingLayout
      step={3}
      aside="supplier"
      footer={
        <Button
          className="h-11 w-full"
          disabled={!ready}
          onClick={() => {
            o.set({ supplierSubmitted: true });
            toast(C2M.accountCreated);
            go(paths.home);
          }}
        >
          Submit
        </Button>
      }
    >
      <Banner tone="info" className="mt-5">
        Your store name will be visible to all buyers of Meesho.
      </Banner>
      <TextField className="mt-6" label="Store Name" value={storeName} onChange={setStoreName} helper="Eg. Business Name, Trade Name, etc." />
      <TextField className="mt-[35px]" label="Your Full Name" value={fullName} onChange={setFullName} />
      <TextField className="mt-8" label="Email ID" type="email" value={email} onChange={setEmail} />
      {!c2m && (
        <SelectField className="mt-8" label="What's your business type" options={BUSINESS_TYPES} value={o.businessType} onChange={(v) => o.set({ businessType: v })} />
      )}
      <Checkbox className={c2m ? 'mt-4' : 'mt-1'} checked={whatsApp} onChange={setWhatsApp}>
        <span className="inline-flex items-center gap-1">
          I want to receive important updates on
          <img src="/brand/local/onboarding/whatsapp.png" alt="" width="17" height="17" className="size-[17px]" />
          WhatsApp
        </span>
      </Checkbox>
      <Checkbox className="mt-5" checked={agree} onChange={setAgree}>
        I agree to comply with Meesho&rsquo;s{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            notInPrototype('Supplier Agreement');
          }}
          className="font-button text-brand-primary-text no-underline"
        >
          Supplier Agreement
        </a>
      </Checkbox>
      <DemoFill className="mt-4" onClick={fillDemo}>
        {C2M.useDemoSupplier}
      </DemoFill>
    </OnboardingLayout>
  );
}
