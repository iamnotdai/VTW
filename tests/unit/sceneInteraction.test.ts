import { describe, expect, it } from 'vitest';
import {
  getHighlight,
  INITIAL_SCENE_INTERACTION as INITIAL,
  resolveTap,
  sceneInteractionReducer as reduce,
} from '@/components/scene/sceneInteraction';

describe('scene interaction reducer (spec §7.4, §16)', () => {
  it('hovering highlights only that object; leaving another object changes nothing', () => {
    const hovered = reduce(INITIAL, { type: 'hover', wordId: 'lamp' });
    expect(getHighlight(hovered)).toEqual({ wordId: 'lamp', mode: 'hover' });
    expect(reduce(hovered, { type: 'unhover', wordId: 'bed' })).toBe(hovered);
    expect(getHighlight(reduce(hovered, { type: 'unhover', wordId: 'lamp' }))).toBeNull();
  });

  it('keyboard focus is a visible highlight too', () => {
    expect(getHighlight(reduce(INITIAL, { type: 'focus', wordId: 'desk' }))).toEqual({
      wordId: 'desk',
      mode: 'focus',
    });
  });

  it('touch: first tap selects, second tap on the same object opens', () => {
    expect(resolveTap(INITIAL, 'lamp')).toBe('select');
    const selected = reduce(INITIAL, { type: 'select', wordId: 'lamp' });
    expect(resolveTap(selected, 'lamp')).toBe('open');
    expect(resolveTap(selected, 'bed')).toBe('select');
  });

  it('locks every other interaction once an object is opened', () => {
    const opened = reduce(INITIAL, { type: 'open', wordId: 'lamp' });
    expect(reduce(opened, { type: 'hover', wordId: 'bed' })).toBe(opened);
    expect(reduce(opened, { type: 'select', wordId: 'bed' })).toBe(opened);
    expect(getHighlight(opened)).toEqual({ wordId: 'lamp', mode: 'selected' });
    expect(reduce(opened, { type: 'unlock' })).toEqual(INITIAL);
  });

  it('selection beats hover, hover beats focus', () => {
    let state = reduce(INITIAL, { type: 'focus', wordId: 'desk' });
    state = reduce(state, { type: 'hover', wordId: 'bed' });
    expect(getHighlight(state)?.wordId).toBe('bed');
    state = reduce(state, { type: 'select', wordId: 'lamp' });
    expect(getHighlight(state)?.wordId).toBe('lamp');
  });
});
