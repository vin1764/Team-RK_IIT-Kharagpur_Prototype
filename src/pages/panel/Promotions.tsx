// Promotions (reference/html/meesho-promotions.html): Sale Events / Deals (NEW) / Flash Events,
// empty in every captured state, with the "Introducing Mega Combo Offer" popover on first load.
import { PromotionsLayout } from './promotions/PromotionsLayout';
import { PROMOTIONS_TABS } from './promotions/tabs';

export default function Promotions() {
  return <PromotionsLayout title="Promotions" tabs={PROMOTIONS_TABS} megaCombo />;
}
