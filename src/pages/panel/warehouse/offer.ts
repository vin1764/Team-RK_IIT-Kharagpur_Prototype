// PP-3 gating (team decision, Phase 6 review): the Cluster Pack Point card shows to every
// Factory-verified maker (eligibility 'eligible') whose pickup pincode is in a Pack Point cluster,
// live or opening. A self-shipping maker sees it once she has a product listed (her cost stack
// needs one); a Pack Point maker already ships through it. Everyone else: Meesho's page unchanged.
import nodesSeed from '../../../data/packPointNodes.json';
import { clusterForPincode, eligibility, type ProductTypeId } from '../../../engine/ui';
import type { PersonaRecord } from '../../../store/onboarding';

export type PackPointNode = { city: string; status: 'live' | 'opening'; makersPooled?: number; opensAtMakers?: number; pincodePrefixes?: string[] };
export const PACK_POINT_NODES = nodesSeed.nodes as PackPointNode[];

export interface PackPointOffer {
  node: PackPointNode;
  /** true = already ships through this Pack Point (Samar); false = self-ships today (Jasmeet) */
  usesPackPoint: boolean;
  product: { type: ProductTypeId; makingCost: number; marginPct: number };
}

type Rec = Pick<PersonaRecord, 'taxId' | 'businessType' | 'gstNatureOfBusiness' | 'udyam' | 'address' | 'fulfilment' | 'product'>;
type ListingLike = { typeId: ProductTypeId; makingCost: number; marginPct: number } | null;

export function packPointOffer(p: Rec, listing: ListingLike, nodes: PackPointNode[] = PACK_POINT_NODES): PackPointOffer | null {
  const elig = eligibility({
    taxId: p.taxId,
    businessType: p.businessType,
    gstNatureOfBusiness: p.gstNatureOfBusiness,
    udyamMajorActivity: p.udyam?.majorActivity ?? null,
  });
  if (elig.status !== 'eligible') return null;
  const node = clusterForPincode(nodes, p.address.pincode);
  if (!node) return null;
  const usesPackPoint = p.fulfilment === 'packPoint';
  const product = usesPackPoint ? p.product : listing ? { type: listing.typeId, makingCost: listing.makingCost, marginPct: listing.marginPct } : null;
  if (!product) return null;
  return { node, usesPackPoint, product };
}
