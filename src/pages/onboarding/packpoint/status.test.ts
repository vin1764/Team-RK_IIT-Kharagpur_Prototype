import { describe, expect, it } from 'vitest';
import lot from '../../../data/packPointLot.json';
import providers from '../../../data/packPointProviders.json';
import { C2M } from '../stepper/copy';
import { nearLine, nodeFee, packPointStatus, packPointStatusLine, packPointsNearPincode } from './status';

// FO-8 Pack Point option and "Pack Points near you": what the seller sees from his pickup pincode.
describe('Pack Point option status (seller view)', () => {
  it('Rajkot (Jasmeet, reseller) and Agra (Samar) are live: "Available near you"', () => {
    for (const [pin, city] of [
      ['360000', 'Rajkot'],
      ['282000', 'Agra'],
    ] as const) {
      const s = packPointStatus(pin);
      expect(s?.kind).toBe('live');
      expect(s?.node.city).toBe(city);
      expect(packPointStatusLine(s)).toBe('Available near you');
    }
  });

  it('Moradabad (244xxx) is opening: just "Opening soon near you", no maker counts', () => {
    const s = packPointStatus('244001');
    expect(s?.kind).toBe('opening');
    expect(packPointStatusLine(s)).toBe('Opening soon near you');
    expect(packPointStatusLine(s)).not.toMatch(/\d/);
  });

  it('a pincode outside every cluster: "No Pack Point near you yet. You’ll be notified when one opens."', () => {
    expect(packPointStatus('110001')).toBeNull();
    expect(packPointStatus('')).toBeNull();
    expect(packPointStatusLine(null)).toBe('No Pack Point near you yet. You’ll be notified when one opens.');
    expect(packPointsNearPincode('110001')).toBeNull();
  });
});

describe('Pack Points near you (drawer, Warehouse)', () => {
  it('Samar (Agra): Agra in his district ₹30, Moradabad 200 km opening (no fee), Rajkot 910 km ₹30', () => {
    const near = packPointsNearPincode('282000')!;
    expect(near.map(nearLine)).toEqual(['Agra · in your district', 'Moradabad · 200 km', 'Rajkot · 910 km']);
    expect(near.map((r) => nodeFee(r.node))).toEqual([30, null, 30]);
    expect(C2M.ppFeeLine(30)).toBe('₹30 per delivered order');
  });

  it('a Moradabad pincode: Moradabad first, opening soon; then Agra and Rajkot', () => {
    const near = packPointsNearPincode('244001')!;
    expect(near.map(nearLine)).toEqual(['Moradabad · in your district', 'Agra · 200 km', 'Rajkot · 1,080 km']);
    expect(near[0]!.node.status).toBe('opening');
  });

  it('storage, providers and the 24 h promise come from the seed', () => {
    expect(C2M.ppStorage(lot.storage.freeDays, lot.storage.perUnitPerDay)).toBe('Storage free for 30 days, then ₹0.29 per unit per day');
    expect(providers.providers.map((p) => [p.name, p.ratePerOrder])).toEqual([
      ['WareIQ', null],
      ['Prozo', null],
      ['Eshopbox', null],
      ['Shiprocket Fulfillment', 24],
    ]);
    expect(providers.howItWorks.shipWithinHours).toBe(24);
  });
});
