// The app's base path: '' at a site root (Netlify), '/Team-RK_IIT-Kharagpur' on GitHub Pages (vite --base).
// Routes stay root-relative everywhere; only the few places that read or write the browser URL directly
// (outside React Router, which gets the basename) go through these helpers.
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** "/panel/…" → "<base>/panel/…" for the address bar, an iframe src or window.open. */
export const withBase = (path: string) => (path.startsWith('/') ? `${BASE}${path}` : path);

/** The current app path without the base, as the routes and the showcase registry know it. */
export const appPathname = () => {
  const p = window.location.pathname;
  return BASE && p.startsWith(BASE) ? p.slice(BASE.length) || '/' : p;
};
