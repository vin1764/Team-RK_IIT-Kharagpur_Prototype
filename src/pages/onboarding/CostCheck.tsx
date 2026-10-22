// /cost-check: the old standalone 5-minute cost check (FO-5), reached from the outreach link. The cost check
// now runs inline on the onboarding finish screen, after the maker has told us what they make
// (onboarding/Finish.tsx), so this route only redirects there (demo params kept).
import { Navigate, useLocation } from 'react-router';
import { onboarding } from '../../app/paths';
import { linkWithDemo } from './signup/nav';

export default function CostCheck() {
  const { search } = useLocation();
  return <Navigate to={linkWithDemo(onboarding.done, search)} replace />;
}
