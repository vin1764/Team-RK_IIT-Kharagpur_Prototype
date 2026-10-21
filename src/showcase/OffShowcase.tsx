import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

/** The showcase path. */
export const SHOWCASE_PATH = '/';

/**
 * Renders its children everywhere except on the showcase page itself, so the prototype's own
 * DemoUrlSync (which writes ?persona=&day=&lang=) and its controls pill leave "/" alone.
 */
export function OffShowcase({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return pathname === SHOWCASE_PATH ? null : <>{children}</>;
}
