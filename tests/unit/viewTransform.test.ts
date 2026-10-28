import { describe, expect, it } from 'vitest';
import {
  clampTransform,
  IDENTITY_TRANSFORM,
  panBy,
  rescaleForViewport,
  sceneToViewport,
  zoomAround,
} from '@/lib/viewTransform';

const viewport = { width: 800, height: 500 };
const limits = { min: 1, max: 3 };

describe('view transform (zoom/pan keeps image and hotspots together)', () => {
  it('never shows empty borders', () => {
    expect(clampTransform({ scale: 2, x: 100, y: 100 }, viewport, limits)).toEqual({
      scale: 2,
      x: 0,
      y: 0,
    });
    expect(clampTransform({ scale: 2, x: -5000, y: -5000 }, viewport, limits)).toEqual({
      scale: 2,
      x: -800,
      y: -500,
    });
    expect(clampTransform({ scale: 9, x: 0, y: 0 }, viewport, limits).scale).toBe(3);
  });

  it('keeps the focus point fixed while zooming', () => {
    const focus = { x: 200, y: 150 };
    const zoomed = zoomAround(IDENTITY_TRANSFORM, 2, focus, viewport, limits);
    // The content point under the focus before zooming…
    const contentX = (focus.x - IDENTITY_TRANSFORM.x) / IDENTITY_TRANSFORM.scale;
    // …is still under it afterwards.
    expect(zoomed.x + contentX * zoomed.scale).toBeCloseTo(focus.x);
  });

  it('pans within limits', () => {
    const zoomed = { scale: 2, x: -400, y: -250 };
    expect(panBy(zoomed, -1000, 0, viewport, limits).x).toBe(-800);
    expect(panBy(IDENTITY_TRANSFORM, 50, 50, viewport, limits)).toEqual(IDENTITY_TRANSFORM);
  });

  it('keeps the visible area on resize', () => {
    const next = rescaleForViewport(
      { scale: 2, x: -400, y: -250 },
      viewport,
      { width: 400, height: 250 },
      limits,
    );
    expect(next).toEqual({ scale: 2, x: -200, y: -125 });
  });

  it('maps scene coordinates to the screen with the same transform as the image', () => {
    const scene = { width: 1600, height: 1000 };
    expect(sceneToViewport({ x: 800, y: 500 }, IDENTITY_TRANSFORM, viewport, scene)).toEqual({
      x: 400,
      y: 250,
    });
    expect(
      sceneToViewport({ x: 800, y: 500 }, { scale: 2, x: -400, y: -250 }, viewport, scene),
    ).toEqual({ x: 400, y: 250 });
  });
});
