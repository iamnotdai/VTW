import {
  clampTransform,
  type ScaleLimits,
  type ViewportSize,
  type ViewTransform,
} from './viewTransform';

/**
 * Remembers each scene's zoom/pan while the app is open, so coming back from a question or an
 * answer shows the picture exactly as the learner left it. Kept in memory only (never stored), and
 * saved relative to the viewport size so it also fits after a fullscreen / window size change.
 */
interface SavedView {
  scale: number;
  fx: number;
  fy: number;
}

const views = new Map<string, SavedView>();

export function saveView(sceneId: string, transform: ViewTransform, viewport: ViewportSize): void {
  if (viewport.width <= 0 || viewport.height <= 0) return;
  views.set(sceneId, {
    scale: transform.scale,
    fx: transform.x / viewport.width,
    fy: transform.y / viewport.height,
  });
}

export function loadView(
  sceneId: string,
  viewport: ViewportSize,
  limits: ScaleLimits,
): ViewTransform | null {
  const saved = views.get(sceneId);
  if (!saved || viewport.width <= 0 || viewport.height <= 0) return null;
  return clampTransform(
    { scale: saved.scale, x: saved.fx * viewport.width, y: saved.fy * viewport.height },
    viewport,
    limits,
  );
}

export function clearSavedViews(): void {
  views.clear();
}
