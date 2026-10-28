import { describe, expect, it } from 'vitest';
import { getPathBounds, getPathPoints } from '@/lib/svgPath';

describe('getPathBounds', () => {
  it('handles absolute polygons', () => {
    expect(getPathBounds('M 100 100 L 140 100 L 150 180 L 90 180 Z')).toEqual({
      x: 90,
      y: 100,
      width: 60,
      height: 80,
    });
  });

  it('handles relative and shorthand commands', () => {
    expect(getPathBounds('m10 10 h20 v30 h-20 z')).toEqual({ x: 10, y: 10, width: 20, height: 30 });
    expect(getPathBounds('M0,0 l10-5 10,5')).toEqual({ x: 0, y: -5, width: 20, height: 5 });
  });

  it('includes curve control points', () => {
    expect(getPathBounds('M 0 0 C 0 -10 10 -10 10 0 Z')).toEqual({
      x: 0,
      y: -10,
      width: 10,
      height: 10,
    });
  });

  it('rejects malformed paths', () => {
    expect(getPathBounds('')).toBeNull();
    expect(getPathBounds('10 10 L 20 20')).toBeNull();
    expect(getPathBounds('M 10')).toBeNull();
    expect(getPathPoints('M 0 0 L 5 5 Z 7 7')).toBeNull();
  });
});
