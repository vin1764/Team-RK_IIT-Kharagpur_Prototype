// Sign-up (existing page, replicated from reference/screens/signup.png).
// Mock only: nothing is sent; any 6 digits work as the OTP.
// From the outreach link (?ref=outreach) the right panel shows the FO-4 teaser instead.
import { useRef } from 'react';
import { useSearchParams } from 'react-router';
import { onboarding } from '../../app/paths';
import { Button } from '../../components/ui';
import { notInPrototype, toast } from '../../components/Toast';
import { useDemo } from '../../store/demo';
import { useOnboarding, usePersona } from '../../store/onboarding';
import { Field } from './signup/Field';
import { GenericPanel } from './signup/GenericPanel';
import { useDemoLink } from './signup/nav';
import { OutreachPanel } from './signup/OutreachPanel';
import { SplitLayout } from './signup/SplitLayout';

const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

export default function Signup() {
  const [params] = useSearchParams();
  const fromOutreach = params.get('ref') === 'outreach';
  // Plain mode ("Today vs ours"): today's right panel, no demand teaser.
  const c2m = useDemo((s) => s.c2m);
  const persona = usePersona();
  const { phone, otpSent, otp, set } = useOnboarding();
  const { go } = useDemoLink();
  const phoneRef = useRef<HTMLInputElement>(null);

  // Placeholder shows the persona's fake number format, e.g. "90000 00001"
  const phonePlaceholder = persona.phone.replace(/^\+91\s*/, '');
  const canSend = phone.length === 10;
  const canCreate = otpSent && otp.length === 6;

  const left = (
    <>
      <h1 className="m-0 mt-[37px] font-heading text-4xl leading-7">Welcome to Meesho</h1>
      <p className="m-0 mt-[3.6px] text-xl leading-5 text-tertiary-text">Create your account to start selling</p>

      <div className="mt-[27.4px] flex gap-3">
        <Field
          label="Enter Mobile Number"
          alwaysFloat
          prefix="+91 -"
          inputRef={phoneRef}
          inputMode="numeric"
          autoComplete="off"
          placeholder={phonePlaceholder}
          value={phone}
          onChange={(e) => set({ phone: digits(e.target.value, 10) })}
          className="flex-1"
        />
        <Button
          className="h-11 w-[96.8px] px-0 whitespace-nowrap"
          disabled={!canSend}
          onClick={() => {
            set({ otpSent: true });
            toast('OTP sent (prototype: any 6 digits work)');
          }}
        >
          {otpSent ? 'Resend OTP' : 'Send OTP'}
        </Button>
      </div>

      <Field
        label="Enter OTP"
        className="mt-[28.8px]"
        inputMode="numeric"
        autoComplete="off"
        value={otp}
        onChange={(e) => set({ otp: digits(e.target.value, 6) })}
      />
    </>
  );

  const footer = (
    <div className="pb-[59px]">
      <Button
        className="h-11 w-full"
        disabled={!canCreate}
        onClick={() => {
          set({ accountCreated: true });
          go(onboarding.businessDetails);
        }}
      >
        Create Account
      </Button>
      <p className="m-0 mt-[18px] text-center text-sm leading-4 text-tertiary-text">
        By clicking you agree to our{' '}
        <button type="button" className="cursor-pointer border-none bg-transparent p-0 font-body text-sm text-brand-primary-text" onClick={() => notInPrototype('Terms & Conditions')}>
          Terms &amp; Conditions
        </button>{' '}
        and{' '}
        <button type="button" className="cursor-pointer border-none bg-transparent p-0 font-body text-sm text-brand-primary-text" onClick={() => notInPrototype('Privacy Policy')}>
          Privacy Policy
        </button>
      </p>
    </div>
  );

  return (
    <SplitLayout
      left={left}
      leftFooter={footer}
      right={fromOutreach && c2m ? <OutreachPanel onContinue={() => phoneRef.current?.focus()} /> : <GenericPanel />}
    />
  );
}
