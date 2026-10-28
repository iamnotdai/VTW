import { useSyncExternalStore } from 'react';
import {
  enterFullscreen,
  exitFullscreen,
  getFullscreenElement,
  onFullscreenChange,
} from '@/lib/fullscreen';

const isAppFullscreen = () =>
  typeof document !== 'undefined' && getFullscreenElement() === document.documentElement;

/**
 * Whether the whole app is fullscreen. The page itself is the fullscreen element (not one screen's
 * box), so it survives navigation: Explore → question → answer all stay fullscreen.
 */
export function useAppFullscreen(): boolean {
  return useSyncExternalStore(onFullscreenChange, isAppFullscreen, () => false);
}

export function toggleAppFullscreen(active: boolean): void {
  if (active) void exitFullscreen();
  else void enterFullscreen(document.documentElement);
}
