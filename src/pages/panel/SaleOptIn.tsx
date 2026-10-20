// Promotions - Sales (reference/html/meesho-sale-opt-in.html): Sale Events / Flash Events.
import { PromotionsLayout } from './promotions/PromotionsLayout';
import { SALE_OPT_IN_TABS } from './promotions/tabs';

export default function SaleOptIn() {
  return <PromotionsLayout title="Promotions - Sales" tabs={SALE_OPT_IN_TABS} />;
}
