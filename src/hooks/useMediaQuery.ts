import { useCallback, useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query, e.g. `useMediaQuery('(pointer: coarse)')`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = () =>
    typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** True on touch-first devices, where hover cannot be relied on (spec §7.4 item 9). */
export function useCoarsePointer(): boolean {
  return useMediaQuery('(pointer: coarse)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
