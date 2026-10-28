/**
 * Pan/zoom math for the Explore scene. The background image and the SVG overlay live in ONE
 * container that receives this transform, so hotspots can never drift from the picture (spec §7.6).
 * `x`/`y` are the translation in viewport pixels; transform-origin is the top-left corner.
 */
export interface ViewTransform {
  scale: number;
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ScaleLimits {
  min: number;
  max: number;
}

export const IDENTITY_TRANSFORM: ViewTransform = { scale: 1, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keeps the content covering the whole viewport (no empty borders while zoomed). */
export function clampTransform(
  transform: ViewTransform,
  viewport: ViewportSize,
  limits: ScaleLimits,
): ViewTransform {
  const scale = clamp(transform.scale, limits.min, limits.max);
  const minX = viewport.width - viewport.width * scale;
  const minY = viewport.height - viewport.height * scale;
  return {
    scale,
    x: clamp(transform.x, Math.min(0, minX), 0),
    y: clamp(transform.y, Math.min(0, minY), 0),
  };
}

/** Zooms to `nextScale` keeping the point under `focus` (viewport pixels) in place. */
export function zoomAround(
  transform: ViewTransform,
  nextScale: number,
  focus: { x: number; y: number },
  viewport: ViewportSize,
  limits: ScaleLimits,
): ViewTransform {
  const scale = clamp(nextScale, limits.min, limits.max);
  const ratio = scale / transform.scale;
  return clampTransform(
    {
      scale,
      x: focus.x - (focus.x - transform.x) * ratio,
      y: focus.y - (focus.y - transform.y) * ratio,
    },
    viewport,
    limits,
  );
}

export function panBy(
  transform: ViewTransform,
  dx: number,
  dy: number,
  viewport: ViewportSize,
  limits: ScaleLimits,
): ViewTransform {
  return clampTransform(
    { ...transform, x: transform.x + dx, y: transform.y + dy },
    viewport,
    limits,
  );
}

/** Keeps the same visible area when the viewport is resized. */
export function rescaleForViewport(
  transform: ViewTransform,
  previous: ViewportSize,
  next: ViewportSize,
  limits: ScaleLimits,
): ViewTransform {
  if (previous.width === 0 || previous.height === 0) return clampTransform(transform, next, limits);
  return clampTransform(
    {
      scale: transform.scale,
      x: (transform.x * next.width) / previous.width,
      y: (transform.y * next.height) / previous.height,
    },
    next,
    limits,
  );
}

/** Maps a point in scene coordinates (the SVG viewBox) to viewport pixels. */
export function sceneToViewport(
  point: { x: number; y: number },
  transform: ViewTransform,
  viewport: ViewportSize,
  scene: { width: number; height: number },
): { x: number; y: number } {
  return {
    x: transform.x + (point.x / scene.width) * viewport.width * transform.scale,
    y: transform.y + (point.y / scene.height) * viewport.height * transform.scale,
  };
}
