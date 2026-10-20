// Onboarding step 2 · Pickup Address. The saved state replicates reference/screens/onb-pickup.png;
// the entry form wasn't captured and is built from the same fields. C2M: "How will your orders
// ship?" (FO-8) appears once the address is saved; the Pack Point card depends on the pickup city.
import { useEffect, useState, type ReactNode } from 'react';
import { onboarding } from '../../app/paths';
import { Banner, Button, cx } from '../../components/ui';
import nodesData from '../../data/packPointNodes.json';
import { packPointFee } from '../../engine/ui';
import { useOnboarding, usePersona, type Fulfilment, type PersonaRecord } from '../../store/onboarding';
import { useDemo } from '../../store/demo';
import { C2M } from './stepper/copy';
import { Checkbox, DetailList, Spinner, TextField } from './stepper/fields';
import { useDevState, useGo } from './stepper/nav';
import { OnboardingLayout } from './stepper/OnboardingLayout';

type Address = PersonaRecord['address'];
type PackPointNode = { city: string; status: 'live' | 'opening'; makersPooled?: number; opensAtMakers?: number };
const NODES = nodesData.nodes as PackPointNode[];

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

function RadioCard({ checked, muted, onSelect, title, lines, testId }: { checked: boolean; muted?: boolean; onSelect: () => void; title: string; lines: ReactNode[]; testId: string }) {
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
      <span className="flex flex-col">
        <span className={cx('text-xl leading-5 font-button', muted ? 'text-secondary-text' : 'text-primary-text')}>{title}</span>
        {lines.map((l, i) => (
          <span key={i} className={cx('mt-1 text-lg leading-5 font-body', muted ? 'text-tertiary-text' : 'text-secondary-text')}>
            {l}
          </span>
        ))}
      </span>
    </label>
  );
}

function ShipChoice({ address }: { address: Address }) {
  const o = useOnboarding();
  const node = NODES.find((n) => n.city.trim().toLowerCase() === address.city.trim().toLowerCase());
  const live = node?.status === 'live' && node.makersPooled !== undefined;
  const ppValue: Fulfilment = live ? 'packPoint' : 'waitlist';
  const ppLines = live
    ? [C2M.packPointLive(node.city, packPointFee(node.makersPooled!).feePerDeliveredOrder), C2M.packPointBody]
    : node?.status === 'opening' && node.opensAtMakers !== undefined
      ? [C2M.packPointOpening(node.city, node.opensAtMakers)]
      : [C2M.packPointNone(address.pincode)];
  return (
    <section data-c2m="FO-8" className="mt-6">
      <h3 className="m-0 text-xl leading-5 font-button text-primary-text">{C2M.shipHeading}</h3>
      <div className="mt-3 flex flex-col gap-3">
        <RadioCard testId="ship-self" checked={o.fulfilment === 'selfShip'} onSelect={() => o.set({ fulfilment: 'selfShip' })} title={C2M.selfShipTitle} lines={[C2M.selfShipBody]} />
        <RadioCard testId="ship-packpoint" checked={o.fulfilment === ppValue} muted={!live} onSelect={() => o.set({ fulfilment: ppValue })} title={C2M.packPointTitle} lines={ppLines} />
      </div>
      <p className="m-0 mt-3 text-base leading-4 font-body text-secondary-text">{C2M.changeLater}</p>
    </section>
  );
}

export default function PickupAddress() {
  const persona = usePersona();
  const personaId = useDemo((s) => s.persona);
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
      o.set({ pickupSaved: true });
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
            <Button className="h-11 w-full" disabled={!o.fulfilment} onClick={() => go(onboarding.bankDetails)}>
              Continue
            </Button>
          </>
        }
      >
        <Banner tone="success" className="mt-5">
          Pick up address updated successfully
        </Banner>
        <DetailList rows={FIELDS.map((f) => ({ label: f.label, value: addr[f.key] || '-' }))} />
        <ShipChoice address={addr} />
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
