// Promotions - Offers (reference/html/meesho-offer-opt-in.html): Deals (NEW) with the
// Mega Offers / Daily Deals carousel and the empty deal list.
import { PromotionsLayout } from './promotions/PromotionsLayout';
import { OFFER_OPT_IN_TABS } from './promotions/tabs';

export default function OfferOptIn() {
  return <PromotionsLayout title="Promotions - Offers" tabs={OFFER_OPT_IN_TABS} />;
}
