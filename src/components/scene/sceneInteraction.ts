/**
 * Pointer/keyboard interaction with scene objects — the SCENE_READY / OBJECT_HIGHLIGHTED part of
 * the Explore state machine (spec §16). One reducer instead of several booleans, so states like
 * "hovering two objects" or "selecting while a quiz is opening" cannot happen.
 */
export interface SceneInteractionState {
  /** Mouse is over this object. */
  hoveredId: string | null;
  /** Keyboard focus is on this object. */
  focusedId: string | null;
  /** Touch: first tap selects (shows label + Learn), a second tap opens (spec §7.4 item 9). */
  selectedId: string | null;
  /** An object was opened; every other selection is locked until `unlock` (spec §7.4 item 6). */
  openedId: string | null;
}

export type SceneInteractionAction =
  | { type: 'hover'; wordId: string }
  | { type: 'unhover'; wordId: string }
  | { type: 'focus'; wordId: string }
  | { type: 'blur'; wordId: string }
  | { type: 'select'; wordId: string }
  | { type: 'clear' }
  | { type: 'open'; wordId: string }
  | { type: 'unlock' };

export const INITIAL_SCENE_INTERACTION: SceneInteractionState = {
  hoveredId: null,
  focusedId: null,
  selectedId: null,
  openedId: null,
};

export function sceneInteractionReducer(
  state: SceneInteractionState,
  action: SceneInteractionAction,
): SceneInteractionState {
  if (state.openedId && action.type !== 'unlock') return state;

  switch (action.type) {
    case 'hover':
      return state.hoveredId === action.wordId ? state : { ...state, hoveredId: action.wordId };
    case 'unhover':
      // Leaving one object never clears another object's hover.
      return state.hoveredId === action.wordId ? { ...state, hoveredId: null } : state;
    case 'focus':
      return state.focusedId === action.wordId ? state : { ...state, focusedId: action.wordId };
    case 'blur':
      return state.focusedId === action.wordId ? { ...state, focusedId: null } : state;
    case 'select':
      return state.selectedId === action.wordId ? state : { ...state, selectedId: action.wordId };
    case 'clear':
      return state.selectedId || state.hoveredId
        ? { ...state, selectedId: null, hoveredId: null }
        : state;
    case 'open':
      return { ...state, openedId: action.wordId, selectedId: action.wordId };
    case 'unlock':
      return INITIAL_SCENE_INTERACTION;
  }
}

export type HighlightMode = 'selected' | 'hover' | 'focus';

export interface Highlight {
  wordId: string;
  mode: HighlightMode;
}

/** Which object is highlighted, and why. Selection beats hover, hover beats keyboard focus. */
export function getHighlight(state: SceneInteractionState): Highlight | null {
  if (state.openedId) return { wordId: state.openedId, mode: 'selected' };
  if (state.selectedId) return { wordId: state.selectedId, mode: 'selected' };
  if (state.hoveredId) return { wordId: state.hoveredId, mode: 'hover' };
  if (state.focusedId) return { wordId: state.focusedId, mode: 'focus' };
  return null;
}

/** Touch: tapping the already-selected object opens it; tapping another one selects it. */
export function resolveTap(state: SceneInteractionState, wordId: string): 'open' | 'select' {
  return state.selectedId === wordId ? 'open' : 'select';
}
