import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetAppState } from './helpers';

// jsdom gaps used by the app ------------------------------------------------------------------

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

window.scrollTo = (() => {}) as typeof window.scrollTo;
HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => {};

afterEach(() => {
  cleanup();
  resetAppState();
});
