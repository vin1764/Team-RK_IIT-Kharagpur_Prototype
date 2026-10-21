// FO-3 · Outreach phone mock-up (new). A plain chat screen in the panel's own tokens —
// deliberately not styled like WhatsApp or IndiaMART. Numbers come from the engine.
import { Link } from 'react-router';
import { onboarding } from '../../app/paths';
import { productTypeName } from '../../engine/ui';
import { demandOrNull } from './signup/guards';
import { usePersona } from '../../store/onboarding';
import { plural, rupeeRange, useDemoLink } from './signup/nav';

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
  const product = persona.product;

  let message = null;
  // The message quotes the open gap; a type without one (Samar's sneakers, team Q4) gets no teaser.
  const d = product ? demandOrNull(product.type) : null;
  if (product && d) {
    const band = d.priceBand;
    message = (
      <>
        Hi {firstName}, buyers on Meesho are looking for {plural(productTypeName(product.type))}: about {d.gapPerWeek.low} orders a week go unserved
        {band ? ` at ${rupeeRange(band.low, band.high)}` : ''}. Our next Factory Launch Week is for manufacturers only — no ads, no listing fee. Orders are a
        forecast, not a guarantee.
      </>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--concept-strip-h))] items-center justify-center gap-12 bg-secondary-bg px-4 py-8 font-body text-primary-text" data-c2m="FO-3">
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

            {message ? (
              <div className="max-w-[92%] rounded-lg rounded-tl-none bg-white p-3">
                <p className="m-0 text-lg leading-5">{message}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <LinkButton to={href(onboarding.costCheck)}>See your take-home (5 min)</LinkButton>
                  <LinkButton to={href(onboarding.signupFromOutreach)}>Sign up</LinkButton>
                </div>
              </div>
            ) : (
              <p className="m-0 self-center rounded-lg bg-white px-3 py-2 text-center text-lg leading-5 text-secondary-text">{product ? 'No open demand gap for this product type yet' : 'No matched product type for this persona'}</p>
            )}
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
