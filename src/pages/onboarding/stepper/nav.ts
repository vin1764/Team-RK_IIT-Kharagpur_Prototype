import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

/** Navigate while keeping the demo query params (?persona=&day=&lang=). Drops our dev-only ?state= and the ?drawer= jump. */
export function useGo() {
  const navigate = useNavigate();
  const { search } = useLocation();
  return useCallback(
    (path: string) => {
      const q = new URLSearchParams(search);
      q.delete('state');
      q.delete('drawer');
      const s = q.toString();
      navigate(s ? `${path}?${s}` : path);
    },
    [navigate, search],
  );
}

/**
 * Dev-only `?state=` hook so the compare script (and reviewers) can open a step in a
 * given state without clicking through, e.g. `?state=fetched` or `?state=saved`.
 * Harmless: it only prefills the same mock state the buttons would produce.
 */
export function useDevState(): string | null {
  const { search } = useLocation();
  return new URLSearchParams(search).get('state');
}
