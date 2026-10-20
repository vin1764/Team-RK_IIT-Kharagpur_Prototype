import { Navigate, Route, Routes } from 'react-router';
import { ToastHost } from '../components/Toast';
import { ConceptStrip } from '../layout/ConceptStrip';
import { DemoControls, DemoUrlSync } from '../layout/DemoControls';
import { BareShell, PanelShell } from '../layout/PanelShell';
import AddSingleCategory from '../pages/panel/AddSingleCategory';
import AddSingleDetails from '../pages/panel/AddSingleDetails';
import BulkCatalogUpload from '../pages/panel/BulkCatalogUpload';
import BusinessDashboard from '../pages/panel/BusinessDashboard';
import CatalogUploads from '../pages/panel/CatalogUploads';
import Claims from '../pages/panel/Claims';
import Home from '../pages/panel/Home';
import ImageBulkUpload from '../pages/panel/ImageBulkUpload';
import InfluencerMarketing from '../pages/panel/InfluencerMarketing';
import InstantCash from '../pages/panel/InstantCash';
import Inventory from '../pages/panel/Inventory';
import ManagePricing from '../pages/panel/ManagePricing';
import Notices from '../pages/panel/Notices';
import OfferOptIn from '../pages/panel/OfferOptIn';
import Orders from '../pages/panel/Orders';
import Payments from '../pages/panel/Payments';
import Promotions from '../pages/panel/Promotions';
import Quality from '../pages/panel/Quality';
import ReduceRto from '../pages/panel/ReduceRto';
import Returns from '../pages/panel/Returns';
import SaleOptIn from '../pages/panel/SaleOptIn';
import Warehouse from '../pages/panel/Warehouse';
import Outreach from '../pages/onboarding/Outreach';
import Signup from '../pages/onboarding/Signup';
import CostCheck from '../pages/onboarding/CostCheck';
import BusinessDetails from '../pages/onboarding/BusinessDetails';
import PickupAddress from '../pages/onboarding/PickupAddress';
import BankDetails from '../pages/onboarding/BankDetails';
import SupplierDetails from '../pages/onboarding/SupplierDetails';
import { onboarding, paths, SID } from './paths';

const P = '/panel/v3/new';

export function App() {
  return (
    <>
      <ConceptStrip />
      <DemoUrlSync />
      <Routes>
        <Route element={<PanelShell />}>
          <Route path={`${P}/growth/${SID}/home`} element={<Home />} />
          <Route path={`${P}/growth/${SID}/notices`} element={<Notices />} />
          <Route path={`${P}/fulfillment/${SID}/orders/:tab`} element={<Orders />} />
          <Route path={`${P}/fulfillment/${SID}/returns/:tab`} element={<Returns />} />
          <Route path={`${P}/fulfillment/${SID}/claims`} element={<Claims />} />
          <Route path={`${P}/fulfillment/${SID}/warehouse/*`} element={<Warehouse />} />
          <Route path={`${P}/services/${SID}/ipp/reduce-rto-and-returns/:tab`} element={<ReduceRto />} />
          <Route path={`${P}/services/${SID}/ipp/:tab`} element={<ManagePricing />} />
          <Route path={`${P}/services/${SID}/inventory`} element={<Inventory />} />
          <Route path={`${P}/cataloging/${SID}/product-optimiser`} element={<Quality />} />
          <Route path={`${P}/cataloging/${SID}/catalogs/:kind`} element={<CatalogUploads />} />
          <Route path={`${P}/cataloging/${SID}/images-bulk-upload`} element={<ImageBulkUpload />} />
          <Route path={`${P}/payouts/${SID}/payments`} element={<Payments />} />
          <Route path={`${P}/livecommerce/${SID}/influencer-marketing`} element={<InfluencerMarketing />} />
          <Route path={`${P}/promotions/${SID}/list`} element={<Promotions />} />
          <Route path={`${P}/promotions/${SID}/sale/list`} element={<SaleOptIn />} />
          <Route path={`${P}/promotions/${SID}/offer/list`} element={<OfferOptIn />} />
          <Route path={`${P}/finance/${SID}/home`} element={<InstantCash />} />
          <Route path={`${P}/insights/${SID}/business-dashboard`} element={<BusinessDashboard />} />
        </Route>
        <Route element={<BareShell />}>
          <Route path={`${P}/cataloging/${SID}/catalogs/single/select-category`} element={<AddSingleCategory />} />
          <Route path={`${P}/cataloging/${SID}/catalogs/single/add-product-details`} element={<AddSingleDetails />} />
          <Route path={`${P}/cataloging/${SID}/catalogs/bulk/add`} element={<BulkCatalogUpload />} />
        </Route>
        {/* Onboarding: full-page layouts of their own (no panel shell) */}
        <Route path={onboarding.outreach} element={<Outreach />} />
        <Route path={onboarding.signup} element={<Signup />} />
        <Route path={onboarding.costCheck} element={<CostCheck />} />
        <Route path={onboarding.businessDetails} element={<BusinessDetails />} />
        <Route path={onboarding.pickupAddress} element={<PickupAddress />} />
        <Route path={onboarding.bankDetails} element={<BankDetails />} />
        <Route path={onboarding.supplierDetails} element={<SupplierDetails />} />
        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Routes>
      <DemoControls />
      <ToastHost />
    </>
  );
}
