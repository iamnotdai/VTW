const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

/**
 * Resolves a public asset path such as "/assets/scenes/bedroom/bedroom-desktop.webp" against Vite's
 * `base`, so the app also works when deployed under a sub-path (e.g. GitHub Pages "/VTW/").
 * Absolute URLs (https:, data:, blob:, //cdn...) are returned unchanged.
 */
export function assetUrl(path: string): string {
  if (!path || ABSOLUTE_URL.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** Same as `assetUrl` but passes `undefined` through, for optional fields such as `audio`. */
export function optionalAssetUrl(path: string | undefined): string | undefined {
  return path ? assetUrl(path) : undefined;
}
