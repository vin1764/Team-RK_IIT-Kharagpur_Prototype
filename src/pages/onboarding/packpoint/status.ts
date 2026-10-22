// Pack Point status for a pickup pincode (FO-8 card, drawer). Clusters and counts come from
// src/data/packPointNodes.json; the pincode is matched by postal prefix (engine clusterForPincode).
import nodesData from '../../../data/packPointNodes.json';
import { clusterForPincode } from '../../../engine/ui';
import { C2M } from '../stepper/copy';

export interface PackPointNode {
  city: string;
  status: 'live' | 'opening';
  makersPooled?: number;
  opensAtMakers?: number;
  makersSignedUp?: number;
  pincodePrefixes: string[];
}

export const PACK_POINT_NODES = nodesData.nodes as PackPointNode[];

export type PackPointStatus =
  | { kind: 'live'; node: PackPointNode; makersPooled: number }
  | { kind: 'opening'; node: PackPointNode; signedUp: number; opensAt: number }
  | null;

/** Live / opening cluster for the pincode, or null (no cluster: the Pack Point option is hidden). */
export function packPointStatus(pincode: string, nodes: PackPointNode[] = PACK_POINT_NODES): PackPointStatus {
  const node = clusterForPincode(nodes, pincode);
  if (!node) return null;
  if (node.status === 'live' && node.makersPooled !== undefined) return { kind: 'live', node, makersPooled: node.makersPooled };
  if (node.status === 'opening' && node.opensAtMakers !== undefined && node.makersSignedUp !== undefined)
    return { kind: 'opening', node, signedUp: node.makersSignedUp, opensAt: node.opensAtMakers };
  return null;
}

/** The card's status line: "Available near you" / "Opening soon near you (32/40 makers)". */
export function packPointStatusLine(s: NonNullable<PackPointStatus>): string {
  return s.kind === 'live' ? C2M.ppAvailable : C2M.ppOpeningSoon(s.signedUp, s.opensAt);
}

/** The fee-table row to highlight: the live cluster's size, or the size it opens at. */
export function highlightedPoolSize(s: PackPointStatus): number | null {
  if (!s) return null;
  return s.kind === 'live' ? s.makersPooled : s.opensAt;
}
