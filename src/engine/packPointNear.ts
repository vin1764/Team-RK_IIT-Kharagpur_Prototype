// "Pack Points near you" (FO-8 drawer, PP-3 Warehouse card): every Pack Point, sorted by distance from the
// maker's pickup pincode. There is no distance data, so distances are approximations:
//  - a pincode resolves to its 3-digit postal district (the nodes' pincodePrefixes);
//  - a node's location is its city's public city-centre coordinates (src/data/packPointNodes.json);
//  - the maker's own district → "in your district" (we can't measure within a district, km = null);
//    other nodes → great-circle distance between the two city centres, rounded to the nearest 10 km.
// A pincode outside every node's district has no known location: null ("No Pack Point near you yet").

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface LocatedNode {
  city: string;
  pincodePrefixes?: string[];
  location: GeoPoint;
}

export interface NearNode<N> {
  node: N;
  /** the maker's pickup pincode is in this node's postal district */
  own: boolean;
  /** city-centre distance rounded to the nearest 10 km; null for the maker's own district */
  km: number | null;
}

/** Mean Earth radius (IUGG), km. */
const EARTH_KM = 6371.0088;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle (haversine) distance between two points, km, unrounded. */
export function greatCircleKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Nearest 10 km. */
export const roundTo10Km = (km: number) => Math.round(km / 10) * 10;

/** The node whose postal district holds the pincode (3-digit prefix), or null. */
export function districtNode<N extends LocatedNode>(nodes: N[], pincode: string): N | null {
  const pin = pincode.replace(/\s/g, '');
  if (!/^\d{6}$/.test(pin)) return null;
  return nodes.find((n) => (n.pincodePrefixes ?? []).some((p) => pin.startsWith(p))) ?? null;
}

/**
 * Every node with its distance from the pickup pincode's district centre: own district first, then nearest first
 * (ties by city name). Null when the pincode's district isn't a Pack Point district (no location to measure from).
 */
export function packPointsNear<N extends LocatedNode>(nodes: N[], pincode: string): NearNode<N>[] | null {
  const home = districtNode(nodes, pincode);
  if (!home) return null;
  return nodes
    .map((node) => (node === home ? { node, own: true, km: null } : { node, own: false, km: roundTo10Km(greatCircleKm(home.location, node.location)) }))
    .sort((a, b) => (a.own !== b.own ? (a.own ? -1 : 1) : (a.km ?? 0) - (b.km ?? 0) || a.node.city.localeCompare(b.node.city)));
}
