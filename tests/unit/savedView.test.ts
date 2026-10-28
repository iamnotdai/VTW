import { beforeEach, describe, expect, it } from 'vitest';
import { clearSavedViews, loadView, saveView } from '@/lib/savedView';

const LIMITS = { min: 1, max: 3 };

describe('saved scene view', () => {
  beforeEach(() => clearSavedViews());

  it('gives back nothing for a scene that was never zoomed', () => {
    expect(loadView('bedroom', { width: 800, height: 450 }, LIMITS)).toBeNull();
  });

  it('restores the zoom and pan of the same scene', () => {
    saveView('bedroom', { scale: 2, x: -400, y: -100 }, { width: 800, height: 450 });
    expect(loadView('bedroom', { width: 800, height: 450 }, LIMITS)).toEqual({
      scale: 2,
      x: -400,
      y: -100,
    });
    expect(loadView('kitchen', { width: 800, height: 450 }, LIMITS)).toBeNull();
  });

  it('keeps the same visible area when the viewport size changes', () => {
    saveView('bedroom', { scale: 2, x: -400, y: -100 }, { width: 800, height: 450 });
    expect(loadView('bedroom', { width: 1600, height: 900 }, LIMITS)).toEqual({
      scale: 2,
      x: -800,
      y: -200,
    });
  });
});
