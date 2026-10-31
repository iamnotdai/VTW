import { useLayoutEffect, useRef } from 'react';

/** How much the font size drops per try while searching for a size that fits. */
const STEP = 0.05;

/**
 * Shrinks the text of an element (`overflow-hidden`, able to shrink in its flex row) until it fits
 * its box, never below `minScale` of its CSS font size. Works for one line (`whitespace-nowrap`:
 * fits the width) and for wrapping text with a bounded height (fits both). Re-fits when `text`
 * changes, when the parent resizes and when web fonts finish loading.
 */
export function useFitText<T extends HTMLElement>(text: string, minScale: number) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const overflows = () =>
      element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
    const fit = () => {
      element.style.fontSize = '';
      if (!overflows()) return;
      const base = parseFloat(getComputedStyle(element).fontSize);
      for (let scale = 1 - STEP; scale > minScale - STEP / 2; scale -= STEP) {
        element.style.fontSize = `${Math.floor(base * Math.max(scale, minScale) * 10) / 10}px`;
        if (!overflows()) return;
      }
    };
    fit();
    const parent = element.parentElement;
    if (typeof ResizeObserver === 'undefined' || !parent) return;
    // Watch the row, not the text: shrinking the text resizes the element itself.
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [text, minScale]);
  return ref;
}
