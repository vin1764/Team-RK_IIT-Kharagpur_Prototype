import { describe, expect, it } from 'vitest';
import nodesSeed from '../data/packPointNodes.json';
import { greatCircleKm, packPointsNear, roundTo10Km } from './packPointNear';

const NODES = nodesSeed.nodes;
const loc = (city: string) => NODES.find((n) => n.city === city)!.location;
const view = (pin: string) => packPointsNear(NODES, pin)?.map((r) => [r.node.city, r.own ? 'in your district' : `${r.km} km`]);

// Distances are city-centre approximations (public city coordinates), rounded to the nearest 10 km.
describe('Pack Points near you: distance from the pickup district', () => {
  it('great-circle distances between the city centres', () => {
    expect(greatCircleKm(loc('Agra'), loc('Moradabad'))).toBeCloseTo(199.5, 0);
    expect(greatCircleKm(loc('Rajkot'), loc('Agra'))).toBeCloseTo(906.9, 0);
    expect(greatCircleKm(loc('Agra'), loc('Agra'))).toBe(0);
    expect([199.48, 906.92, 1079.75, 5].map(roundTo10Km)).toEqual([200, 910, 1080, 10]);
  });

  it('Samar (282000, Agra): Agra in his district, then Moradabad 200 km, Rajkot 910 km', () => {
    expect(view('282000')).toEqual([
      ['Agra', 'in your district'],
      ['Moradabad', '200 km'],
      ['Rajkot', '910 km'],
    ]);
  });

  it('Jasmeet (360000, Rajkot): Rajkot in her district, then Agra 910 km, Moradabad 1,080 km', () => {
    expect(view('360000')).toEqual([
      ['Rajkot', 'in your district'],
      ['Agra', '910 km'],
      ['Moradabad', '1080 km'],
    ]);
  });

  it('a Moradabad pincode (244001): Moradabad in the district, Agra 200 km, Rajkot 1,080 km', () => {
    expect(view('244001')).toEqual([
      ['Moradabad', 'in your district'],
      ['Agra', '200 km'],
      ['Rajkot', '1080 km'],
    ]);
  });

  it('a pincode outside every Pack Point district has no location: null', () => {
    expect(packPointsNear(NODES, '110001')).toBeNull();
    expect(packPointsNear(NODES, '')).toBeNull();
    expect(packPointsNear(NODES, '2820')).toBeNull();
  });

  it('every node is seeded with public city-centre coordinates', () => {
    expect(nodesSeed._locationSource).toMatch(/public city coordinates/);
    for (const n of NODES) {
      expect(n.location.lat).toBeGreaterThan(6);
      expect(n.location.lat).toBeLessThan(37);
      expect(n.location.lon).toBeGreaterThan(68);
      expect(n.location.lon).toBeLessThan(98);
    }
  });
});
