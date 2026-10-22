// FO-3 · Outreach phone mock-up (new). A plain chat screen in the panel's own tokens —
// deliberately not styled like WhatsApp or IndiaMART. Category-level only: we can't trust Udyam or
// IndiaMART data to know a maker's exact product, so the message names the launch's category and no
// product or demand numbers. The maker tells us what they make after onboarding (finish screen), where
// the demand teaser (FO-4) and the cost check (FO-5) now sit.
import { Link } from 'react-router';
import { onboarding } from '../../app/paths';
import { usePersona } from '../../store/onboarding';
import { LAUNCH } from '../panel/factory-launch/launch';
import { useDemoLink } from './signup/nav';

function LinkButton({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="flex h-9 items-center justify-center rounded-sm border border-solid border-brand-primary-border bg-white font-button text-lg text-brand-primary-text no-underline"
    >
      {children}
    </Link>
  );
}

export default function Outreach() {
  const persona = usePersona();
  const { href } = useDemoLink();
  const firstName = persona.name.split(' ')[0];
  // "Factory Launch Week 1" → the programme name "Factory Launch Week"; category from launch.json.
  const programme = LAUNCH.name.replace(/\s+\d+$/, '');
  const message = (
    <>
      Hi {firstName}, Meesho is inviting {LAUNCH.category} manufacturers to {programme} · no ads, no listing fee · sign up to check your eligibility.
    </>
  );

  return (
    <div className="flex min-h-[calc(100vh-var(--concept-strip-h))] items-center justify-center gap-12 bg-secondary-bg px-4 py-8 font-body text-primary-text max-[639px]:flex-col max-[639px]:gap-6 max-[639px]:pb-[var(--demo-controls-room)]" data-c2m="FO-3" data-c2m-id="FO-3">
      {/* phone */}
      <div className="w-[300px] shrink-0 rounded-[36px] border-[10px] border-solid border-primary-text bg-primary-text">
        <div className="flex h-[580px] flex-col overflow-hidden rounded-[26px] bg-tertiary-bg">
          <div className="flex items-center gap-2.5 bg-white px-4 pb-3 pt-5 border-0 border-b border-solid border-tertiary-border">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-secondary-bg">
              <img src="/brand/msa/merlin/filled/meesho-logo-lowercase-greymid.svg" alt="" width="22" height="6" className="w-[22px]" />
            </div>
            <div className="min-w-0">
              <p className="m-0 truncate font-button text-lg leading-5">Meesho Supplier Team (concept)</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            <p className="m-0 self-center rounded-lg bg-info-bg px-2.5 py-1 text-center text-sm leading-4 text-secondary-text">
              Sent as a reply to an IndiaMART inquiry · WhatsApp only after opt-in
            </p>

            <div className="max-w-[92%] rounded-lg rounded-tl-none bg-white p-3" data-outreach-message>
              <p className="m-0 text-lg leading-5">{message}</p>
              <div className="mt-3 flex flex-col gap-2">
                <LinkButton to={href(onboarding.signup)}>Sign up</LinkButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* caption */}
      <p className="m-0 max-w-[260px] text-lg leading-5 text-secondary-text">
        <span className="font-button text-primary-text">Outreach mock-up (FO-3):</span> first contact by IndiaMART inquiry or email; WhatsApp only after opt-in.
      </p>
    </div>
  );
}
