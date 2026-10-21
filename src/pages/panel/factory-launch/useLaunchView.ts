// Everything the Factory Launch screens show for the current persona and demo day, in one place.
// Numbers come from the engine (src/engine/ui.ts) and the launch seed (./launch.ts); B never does.
import { useMemo } from 'react';
import {
  checkListingPrice,
  costStack,
  demandForType,
  eligibility,
  launchProgress,
  likelyShare,
  productTypeName,
  slots,
  suggestedLot,
  type Eligibility,
  type PriceStatus,
  type ProductTypeId,
} from '../../../engine/ui';
import { useDemo } from '../../../store/demo';
import { usePersona } from '../../../store/onboarding';
import { useAllCommits, useScriptedCommit, useScriptedListing } from '../../../store/timeline';
import { LAUNCH, phaseForDay, slotStatus, type SlotStatus } from './launch';

export interface OrderBookRow {
  typeId: ProductTypeId;
  name: string;
  slots: SlotStatus;
  /** expected orders per listing, a day */
  expected: { low: number; high: number };
  suggestedLot: number;
  /** days of expected sales the suggested lot covers */
  lotDays: number;
  committedUnits: number;
  packPointFee: number | undefined;
}

function orderBookRow(typeId: ProductTypeId, commits: { typeId: ProductTypeId; units: number }[]): OrderBookRow {
  const mine = commits.filter((c) => c.typeId === typeId);
  // The Pack Point fee and the lot in units don't depend on the making cost (atCost isn't shown).
  const lot = suggestedLot(typeId, 0);
  return {
    typeId,
    name: productTypeName(typeId),
    slots: slotStatus(LAUNCH.slotsTakenBefore + mine.length, slots(typeId)),
    expected: likelyShare(typeId).ordersPerDay,
    suggestedLot: lot.units,
    lotDays: lot.days,
    committedUnits: demandForType(typeId).committedUnits + mine.reduce((s, c) => s + c.units, 0),
    packPointFee: costStack(typeId, 0, 0, 'packPoint').fees.packPointFee,
  };
}

export function useLaunchView() {
  const day = useDemo((s) => s.day);
  const persona = useDemo((s) => s.persona);
  const record = usePersona();
  const listing = useScriptedListing();
  const commit = useScriptedCommit();
  const all = useAllCommits();

  return useMemo(() => {
    const phase = phaseForDay(day);
    const rows = LAUNCH.productTypes.map((t) => orderBookRow(t, Object.values(all)));
    const ownType = listing?.typeId ?? record.product?.type ?? null;
    const hasBook = ownType !== null && LAUNCH.productTypes.includes(ownType);
    const elig: Eligibility = eligibility({
      taxId: record.taxId,
      businessType: record.businessType,
      gstNatureOfBusiness: record.gstNatureOfBusiness,
      udyamMajorActivity: record.udyam?.majorActivity ?? null,
    });
    const launchListing = listing && LAUNCH.productTypes.includes(listing.typeId) ? listing : null;
    const priceStatus: PriceStatus | null = launchListing ? checkListingPrice(launchListing.typeId, launchListing.price, launchListing.breakEven) : null;
    const progress = commit ? launchProgress(LAUNCH.dailyOrders, commit.units, day) : null;
    return {
      day,
      persona,
      phase,
      rows,
      ownType,
      hasBook,
      eligibility: elig,
      listing: launchListing,
      priceStatus,
      commit,
      progress,
      packPointMaker: (listing?.fulfilment ?? record.fulfilment) === 'packPoint',
      /** the launch type a maker without a listing would list (her own product type) */
      bookTypeName: productTypeName(LAUNCH.productTypes[0]!),
    };
  }, [day, persona, record, listing, commit, all]);
}

export type LaunchView = ReturnType<typeof useLaunchView>;
