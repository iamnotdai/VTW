import { createBrowserRouter, createHashRouter } from 'react-router';
import { routes } from './routes';

/**
 * Static hosting needs deep links to work (spec §18):
 * - "browser" (default): clean URLs; the host must serve index.html for unknown paths
 *   (public/_redirects on Netlify, automatic on Cloudflare Pages).
 * - "hash": /#/vocabulary/... works on any static host, e.g. GitHub Pages.
 */
export function createAppRouter() {
  if (import.meta.env.VITE_ROUTER_MODE === 'hash') return createHashRouter(routes);
  const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || undefined;
  return createBrowserRouter(routes, { basename });
}
