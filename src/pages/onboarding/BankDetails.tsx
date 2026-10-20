// Onboarding step 3 · Bank Details (no C2M change). Replicates reference/screens/onb-bank.png
// and onb-bank-filled.png. Mock only: nothing is verified or sent anywhere.
import { useEffect, useState } from 'react';
import { onboarding } from '../../app/paths';
import { notInPrototype } from '../../components/Toast';
import { Banner, Button } from '../../components/ui';
import { useOnboarding, usePersona } from '../../store/onboarding';
import { C2M } from './stepper/copy';
import { DemoFill, Spinner, TextField } from './stepper/fields';
import { taxIdKind } from './stepper/format';
import { useDevState, useGo } from './stepper/nav';
import { OnboardingLayout } from './stepper/OnboardingLayout';

const IFSC_LEN = 11;

export default function BankDetails() {
  const persona = usePersona();
  const o = useOnboarding();
  const go = useGo();
  const dev = useDevState();
  const [account, setAccount] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fillDemo = () => {
    setAccount(persona.bank.account);
    setConfirm(persona.bank.account);
    setIfsc(persona.bank.ifsc);
  };
  // Dev-only state for the compare script: ?state=filled
  useEffect(() => {
    if (dev === 'filled') fillDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dev, persona]);

  const mismatch = confirm !== '' && account !== '' && confirm !== account;
  const ready = account !== '' && confirm === account && ifsc.length === IFSC_LEN && !verifying;

  const verify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      o.set({ bankVerified: true });
      go(onboarding.supplierDetails);
    }, 300);
  };

  return (
    <OnboardingLayout
      step={2}
      aside="bank"
      footer={
        <Button className="h-11 w-full" disabled={!ready} onClick={verify}>
          {verifying ? <Spinner /> : 'Verify Bank Details'}
        </Button>
      }
    >
      <Banner tone="info" className="mt-5">
        Bank account should be in the name as per on {taxIdKind(persona)}
      </Banner>
      <div className="mt-6 flex flex-col gap-6">
        <TextField
          label="Account Number"
          type="password"
          autoComplete="off"
          inputMode="numeric"
          value={account}
          onChange={(v) => setAccount(v.replace(/\D/g, ''))}
        />
        <TextField label="Confirm Account Number" autoComplete="off" inputMode="numeric" value={confirm} onChange={(v) => setConfirm(v.replace(/\D/g, ''))} error={mismatch ? C2M.accountMismatch : null} />
        <TextField label="IFSC Code" autoComplete="off" maxLength={IFSC_LEN} value={ifsc} onChange={(v) => setIfsc(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
      </div>
      <p className="m-0 mt-6 text-lg leading-5 font-body text-secondary-text">
        Don&rsquo;t remember IFSC Code?{' '}
        <button type="button" onClick={() => notInPrototype('Find IFSC Code')} className="bg-transparent border-0 p-0 cursor-pointer text-lg leading-5 font-button text-brand-primary-text">
          Find IFSC Code
        </button>
      </p>
      <DemoFill className="mt-3" onClick={fillDemo}>
        {C2M.useDemoBank}
      </DemoFill>
    </OnboardingLayout>
  );
}
