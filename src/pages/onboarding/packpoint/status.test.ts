import { describe, expect, it } from 'vitest';
import nodesData from '../../../data/packPointNodes.json';
import providers from '../../../data/packPointProviders.json';
import { packPointFee } from '../../../engine/ui';
import { highlightedPoolSize, packPointStatus, packPointStatusLine } from './status';

// FO-8 Pack Point option: status line from the pickup pincode (packPointNodes.json via clusterForPincode).
describe('Pack Point option status', () => {
  it('Rajkot (Jasmeet, reseller) and Agra (Samar) are live: "Available near you", 40-maker row highlighted', () => {
    for (const [pin, city] of [
      ['360000', 'Rajkot'],
      ['282000', 'Agra'],
    ] as const) {
      const s = packPointStatus(pin);
      expect(s?.kind).toBe('live');
      expect(s?.node.city).toBe(city);
      expect(packPointStatusLine(s!)).toBe('Available near you');
      expect(highlightedPoolSize(s)).toBe(40);
    }
  });

  it('Moradabad (244xxx) is opening: "Opening soon near you (32/40 makers)", highlight the row it opens at', () => {
    const s = packPointStatus('244001');
    expect(s).toMatchObject({ kind: 'opening', signedUp: 32, opensAt: 40 });
    expect(packPointStatusLine(s!)).toBe('Opening soon near you (32/40 makers)');
    expect(highlightedPoolSize(s)).toBe(40);
    const node = nodesData.nodes.find((n) => n.city === 'Moradabad')!;
    expect(`${node.makersSignedUp}/${node.opensAtMakers}`).toBe('32/40');
  });

  it('a pincode outside every cluster hides the option', () => {
    expect(packPointStatus('110001')).toBeNull();
    expect(packPointStatus('')).toBeNull();
    expect(highlightedPoolSize(null)).toBeNull();
  });

  it('drawer numbers: fee ladder 20/40/60/80 → ₹44/₹30/₹26/₹23; Shiprocket ₹24, others on request; 24 h', () => {
    expect([20, 40, 60, 80].map((n) => packPointFee(n).feePerDeliveredOrder)).toEqual([44, 30, 26, 23]);
    expect(providers.providers.map((p) => [p.name, p.ratePerOrder])).toEqual([
      ['WareIQ', null],
      ['Prozo', null],
      ['Eshopbox', null],
      ['Shiprocket Fulfillment', 24],
    ]);
    expect(providers.howItWorks.shipWithinHours).toBe(24);
  });
});
