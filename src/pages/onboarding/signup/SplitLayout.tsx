// The sign-up page's split layout (reference/screens/signup.png, measured at 125%):
// left 45% on secondary-bg with the form, right on #F0F1FB with "Already a user? Login".
// Content sits in a centred 1105px row: form column 418px, right column 560px.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '../../../app/paths';
import { Button } from '../../../components/ui';
import { useDemoLink } from './nav';

const IMG = '/brand/local/signup';

export function SignupLogo() {
  return <img src={`${IMG}/meesho-logo.png`} alt="meesho" width="100" height="28" className="block mt-3 -ml-[2.4px] w-[100px] h-[28px]" />;
}

export function SplitLayout({ left, right, leftFooter }: { left: ReactNode; right: ReactNode; leftFooter?: ReactNode }) {
  const { href } = useDemoLink();
  return (
    <div className="relative flex min-h-[calc(100vh-var(--concept-strip-h))] overflow-hidden bg-[#F0F1FB] font-body text-primary-text">
      {/* left half background + dotted decoration */}
      <div className="absolute inset-y-0 left-0 w-[45%] bg-secondary-bg" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-[1105px]">
        <img src={`${IMG}/dots.png`} alt="" aria-hidden className="absolute bottom-0 left-[-70.4px] w-[420px] h-[139.2px] max-w-none pointer-events-none select-none" />
        <img src={`${IMG}/shop.png`} alt="" aria-hidden className="absolute bottom-0 left-[965.6px] w-[136px] h-[103.2px] max-w-none pointer-events-none select-none" />
        {/* left: form column */}
        <div className="relative flex w-[477px] shrink-0 flex-col">
          <div className="flex w-[418px] flex-1 flex-col">
            <SignupLogo />
            {left}
            <div className="mt-auto">{leftFooter}</div>
          </div>
        </div>
        {/* right column */}
        <div className="relative flex-1 pl-[62.4px]">
          <div className="w-[560px]">
            <div className="mt-[16.8px] flex items-center justify-end gap-4">
              <span className="text-xl leading-5">Already a user?</span>
              <Link to={href(paths.home)}>
                <Button variant="outline" className="w-[105.6px] font-button">
                  Login
                </Button>
              </Link>
            </div>
            {right}
          </div>
        </div>
      </div>
    </div>
  );
}
