// Onboarding step 2 · Pickup Address. The saved state replicates reference/screens/onb-pickup.png;
// the entry form wasn't captured and is built from the same fields. C2M: "How will your orders
// ship?" (FO-8) appears once the address is saved. The Pack Point option is generic (no fee, city or
// maker numbers) and its status comes from the pickup pincode's cluster; the detail sits behind
// "See details & rate cards" (PackPointDrawer). `?drawer=packpoint` opens the drawer on load (showcase jump).
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { onboarding } from '../../app/paths';
import { Banner, Button, cx } from '../../components/ui';
import { useOnboarding, usePersona, type Fulfilment, type PersonaRecord } from '../../store/onboarding';
import { useDemo } from '../../store/demo';
import { PackPointDrawer } from './packpoint/PackPointDrawer';
import { packPointStatus, packPointStatusLine } from './packpoint/status';
import { C2M } from './stepper/copy';
import { Checkbox, DetailList, Spinner, TextField } from './stepper/fields';
import { useDevState, useGo } from './stepper/nav';
import { OnboardingLayout } from './stepper/OnboardingLayout';

type Address = PersonaRecord['address'];

const FIELDS: { key: keyof Address; label: string }[] = [
  { key: 'building', label: 'Room/ Floor/ Building Number' },
  { key: 'street', label: 'Street/ Locality' },
  { key: 'landmark', label: 'Landmark' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
];
const EMPTY: Address = { building: '', street: '', landmark: '', pincode: '', city: '', state: '' };

// The address the maker saved, kept per persona for the session so going back to this step shows it.
const saved: Partial<Record<string, Address>> = {};

function RadioCard({
  checked,
  muted,
  onSelect,
  title,
  lines,
  action,
  testId,
}: {
  checked: boolean;
  muted?: boolean;
  onSelect: () => void;
  title: string;
  lines: ReactNode[];
  action?: ReactNode;
  testId: string;
}) {
  return (
    <label
      data-testid={testId}
      className={cx(
        'flex cursor-pointer items-start gap-3 rounded-lg border border-solid p-4',
        checked ? 'border-brand-primary-border bg-brand-secondary-bg' : 'border-secondary-border bg-white',
      )}
    >
      <input type="radio" name="fulfilment" checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={cx('mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-solid', checked ? 'border-brand-primary-bg' : 'border-secondary-text')}
      >
        {checked && <span className="size-2 rounded-full bg-brand-primary-bg" />}
      </span>
      <span className="flex flex-col items-start">
        <span className={cx('text-xl leading-5 font-button', muted ? 'text-secondary-text' : 'text-primary-text')}>{title}</span>
        {lines.map((l, i) => (
          <span key={i} className={cx('mt-1 text-lg leading-5 font-body', muted ? 'text-tertiary-text' : 'text-secondary-text')}>
            {l}
          </span>
        ))}
        {action}
      </span>
    </label>
  );
}

function ShipChoice({ address }: { address: Address }) {
  const o = useOnboarding();
  const { search } = useLocation();
  const status = packPointStatus(address.pincode);
  const [drawer, setDrawer] = useState(() => status !== null && new URLSearchParams(search).get('drawer') === 'packpoint');
  const live = status?.kind === 'live';
  // An opening cluster can't be chosen yet: picking the option joins the waitlist (as before).
  const ppValue: Fulfilment = live ? 'packPoint' : 'waitlist';
  return (
    <section data-c2m="FO-8" data-c2m-id="FO-8" className="mt-6">
      <h3 className="m-0 text-xl leading-5 font-button text-primary-text">{C2M.shipHeading}</h3>
      <div className="mt-3 flex flex-col gap-3">
        <RadioCard testId="ship-self" checked={o.fulfilment === 'selfShip'} onSelect={() => o.set({ fulfilment: 'selfShip' })} title={C2M.selfShipTitle} lines={[C2M.selfShipBody]} />
        {status && (
          <RadioCard
            testId="ship-packpoint"
            checked={o.fulfilment === ppValue}
            muted={!live}
            onSelect={() => o.set({ fulfilment: ppValue })}
            title={C2M.packPointTitle}
            lines={[
              C2M.packPointBody,
              <span data-testid="pp-status" data-status={status.kind} className={live ? 'text-success-text' : undefined}>
                {packPointStatusLine(status)}
                {!live && ` · ${C2M.ppJoinWaitlist}`}
              </span>,
            ]}
            action={
              <Button
                variant="text"
                size="sm"
                className="mt-1 !h-auto !px-0 py-0.5"
                data-testid="pp-see-details"
                onClick={(e) => {
                  // Inside the option's <label>: open the drawer without picking the option.
                  e.preventDefault();
                  e.stopPropagation();
                  setDrawer(true);
                }}
              >
                {C2M.ppSeeDetails}
              </Button>
            }
          />
        )}
      </div>
      <p className="m-0 mt-3 text-base leading-4 font-body text-secondary-text">{C2M.changeLater}</p>
      {status && <PackPointDrawer open={drawer} onClose={() => setDrawer(false)} pincode={address.pincode} onChoose={() => o.set({ fulfilment: 'packPoint' })} />}
    </section>
  );
}

export default function PickupAddress() {
  const persona = usePersona();
  const personaId = useDemo((s) => s.persona);
  // Plain mode ("Today vs ours"): no shipping choice (FO-8 hidden), so Continue doesn't wait for one.
  const c2m = useDemo((s) => s.c2m);
  const o = useOnboarding();
  const go = useGo();
  const dev = useDevState();
  const [same, setSame] = useState(true);
  const [addr, setAddr] = useState<Address>(() => saved[personaId] ?? persona.address);
  const [saving, setSaving] = useState(false);

  // Persona switch (or demo reset) starts the step over from the new persona's GST address.
  useEffect(() => {
    setAddr(saved[personaId] ?? persona.address);
    setSame(true);
  }, [personaId, persona]);

  // Dev-only state for the compare script: ?state=saved
  useEffect(() => {
    if (dev === 'saved') useOnboarding.getState().set({ pickupSaved: true });
  }, [dev, personaId]);

  const complete = FIELDS.every((f) => addr[f.key].trim() !== '') && /^\d{6}$/.test(addr.pincode);

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      saved[personaId] = addr;
      // The pincode decides the Pack Point option later too (bot Price screen, restock plan): keep it in the store.
      o.set({ pickupSaved: true, pickupAddress: addr });
    }, 300);
  };

  if (o.pickupSaved) {
    return (
      <OnboardingLayout
        step={1}
        aside="pickup"
        footer={
          <>
            <Button variant="outline" className="h-11 w-full !text-2xl" onClick={() => o.set({ pickupSaved: false, fulfilment: null })}>
              Edit Pickup Address
            </Button>
            <Button className="h-11 w-full" disabled={c2m && !o.fulfilment} onClick={() => go(onboarding.bankDetails)}>
              Continue
            </Button>
          </>
        }
      >
        <Banner tone="success" className="mt-5">
          Pick up address updated successfully
        </Banner>
        <DetailList rows={FIELDS.map((f) => ({ label: f.label, value: addr[f.key] || '-' }))} />
        {c2m && <ShipChoice address={addr} />}
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      step={1}
      aside="pickup"
      footer={
        <Button className="h-11 w-full" disabled={!complete || saving} onClick={save}>
          {saving ? <Spinner /> : 'Save Pickup Address'}
        </Button>
      }
    >
      <Checkbox
        className="mt-6"
        checked={same}
        onChange={(v) => {
          setSame(v);
          setAddr(v ? persona.address : EMPTY);
        }}
      >
        {C2M.sameAsRegistered}
      </Checkbox>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
        {FIELDS.map((f) => (
          <TextField
            key={f.key}
            className={f.key === 'pincode' || f.key === 'city' ? 'col-span-1' : 'col-span-2'}
            label={f.label}
            value={addr[f.key]}
            inputMode={f.key === 'pincode' ? 'numeric' : undefined}
            maxLength={f.key === 'pincode' ? 6 : undefined}
            onChange={(v) => {
              setSame(false);
              setAddr({ ...addr, [f.key]: f.key === 'pincode' ? v.replace(/\D/g, '') : v });
            }}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}
