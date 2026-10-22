// Pack Point status for a pickup pincode (FO-8 card, drawer, Warehouse card). Clusters come from
// src/data/packPointNodes.json; the pincode is matched by postal prefix (engine clusterForPincode).
// The seller sees only "Open / Opening soon", the distance and his fee: no maker counts, no opening rule,
// no fee build-up (those are Meesho's view, in the showcase sidebar only).
import model from '../../../data/packPointModel.json';
import nodesData from '../../../data/packPointNodes.json';
import { clusterForPincode, packPointFee, packPointsNear, type GeoPoint, type NearNode } from '../../../engine/ui';
import { C2M } from '../stepper/copy';

export interface PackPointNode {
  city: string;
  status: 'live' | 'opening';
  makersPooled?: number;
  opensAtMakers?: number;
  makersSignedUp?: number;
  pincodePrefixes: string[];
  location: GeoPoint;
}

export const PACK_POINT_NODES = nodesData.nodes as PackPointNode[];

export type PackPointStatus = { kind: 'live'; node: PackPointNode; makersPooled: number } | { kind: 'opening'; node: PackPointNode } | null;

/** Live / opening cluster for the pincode, or null (no cluster in his district). */
export function packPointStatus(pincode: string, nodes: PackPointNode[] = PACK_POINT_NODES): PackPointStatus {
  const node = clusterForPincode(nodes, pincode);
  if (!node) return null;
  if (node.status === 'live' && node.makersPooled !== undefined) return { kind: 'live', node, makersPooled: node.makersPooled };
  if (node.status === 'opening') return { kind: 'opening', node };
  return null;
}

/** The card's status line: "Available near you" / "Opening soon near you" / "No Pack Point near you yet. …". */
export function packPointStatusLine(s: PackPointStatus): string {
  if (!s) return C2M.ppNoneNear;
  return s.kind === 'live' ? C2M.ppAvailable : C2M.ppOpeningSoon;
}

export const isOpen = (n: PackPointNode): n is PackPointNode & { makersPooled: number } => n.status === 'live' && n.makersPooled !== undefined;

/** The maker's fee at an open Pack Point: the engine's fee for that node's pool (the partner's margin is inside it). Null while it isn't open. */
export function nodeFee(n: PackPointNode): number | null {
  return isOpen(n) ? packPointFee(n.makersPooled).feePerDeliveredOrder : null;
}

/** Only Pack Points within this many km are listed (team answer; others aren't shown). */
export const NEAR_RADIUS_KM = model.nearRadiusKm;

/** "Pack Points near you": nodes within NEAR_RADIUS_KM, own district first, then by city-centre distance; null = none near. */
export function packPointsNearPincode(pincode: string, nodes: PackPointNode[] = PACK_POINT_NODES): NearNode<PackPointNode>[] | null {
  const near = packPointsNear(nodes, pincode, NEAR_RADIUS_KM);
  return near && near.length > 0 ? near : null;
}

/** "Agra · in your district" / "Moradabad · 200 km". */
export function nearLine(r: NearNode<PackPointNode>): string {
  return `${r.node.city} · ${r.km === null ? C2M.ppInYourDistrict : C2M.ppKm(r.km)}`;
}
