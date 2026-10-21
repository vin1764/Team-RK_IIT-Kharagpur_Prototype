// "Today vs ours" on a screen that exists only in our solution: the nearest page Meesho has today.
import { onboarding, paths } from '../app/paths';

const RULES: [RegExp, string][] = [
  [/^\/(outreach|cost-check)([/?#]|$)/, onboarding.signup],
  [/\/promotions\/[^/]+\/factory-launch\//, paths.promotions],
  [/\/promotions\/[^/]+\/list\?(.*&)?tab=FACTORY_LAUNCH/, paths.promotions],
  [/\/ipp\/price-position/, paths.managePricing],
  [/\/catalogs\/single\/add-product-details/, paths.addSingleCategory],
];

/** The Meesho page to send the frame to, or undefined when there's no sensible one. */
export function nearestMeeshoRoute(route: string): string | undefined {
  for (const [re, to] of RULES) if (re.test(route)) return to;
  return undefined;
}
