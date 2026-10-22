import { describe, expect, it } from 'vitest';
import lot from '../../../data/packPointLot.json';
import providers from '../../../data/packPointProviders.json';
import { C2M } from '../stepper/copy';
import { packPointsNear } from '../../../engine/ui';
import { NEAR_RADIUS_KM, PACK_POINT_NODES, nearLine, nodeFee, packPointStatus, packPointStatusLine, packPointsNearPincode } from './status';

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
  it('only Pack Points within 150 km (team): Samar (Agra) sees Agra only; Moradabad (200 km) and Rajkot (910 km) are left out', () => {
    expect(NEAR_RADIUS_KM).toBe(150);
    const near = packPointsNearPincode('282000')!;
    expect(near.map(nearLine)).toEqual(['Agra · in your district']);
    expect(near.map((r) => nodeFee(r.node))).toEqual([30]);
    // the distances still exist, they're just beyond the radius
    expect(packPointsNear(PACK_POINT_NODES, '282000')!.map(nearLine)).toEqual(['Agra · in your district', 'Moradabad · 200 km', 'Rajkot · 910 km']);
    expect(packPointsNear(PACK_POINT_NODES, '282000', 200)!.map(nearLine)).toEqual(['Agra · in your district', 'Moradabad · 200 km']);
  });

  it('fee line: “₹30 + GST per delivered order” with the input-credit note (Q20); prices still use ₹30', () => {
    expect(C2M.ppFeeLine(30)).toBe('₹30 + GST per delivered order');
    expect(C2M.ppFeeGstTip).toBe('18% GST on this service. GST-registered sellers claim it back as input credit, so it isn’t counted in your cost.');
  });

  it('a Moradabad pincode: Moradabad (opening soon) only; Agra is 200 km away', () => {
    const near = packPointsNearPincode('244001')!;
    expect(near.map(nearLine)).toEqual(['Moradabad · in your district']);
    expect(near[0]!.node.status).toBe('opening');
  });

  it('Jasmeet (Rajkot) sees Rajkot only; a pincode outside every district sees none', () => {
    expect(packPointsNearPincode('360001')!.map(nearLine)).toEqual(['Rajkot · in your district']);
    expect(packPointsNearPincode('110001')).toBeNull();
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
