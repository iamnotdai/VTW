/** Fullscreen helpers with the WebKit prefix (Safari/iPadOS). iPhone Safari has no element fullscreen. */

type FullscreenDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

export function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export async function enterFullscreen(element: HTMLElement): Promise<boolean> {
  const target = element as FullscreenElement;
  try {
    if (target.requestFullscreen) await target.requestFullscreen();
    else if (target.webkitRequestFullscreen) await target.webkitRequestFullscreen();
    else return false;
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument;
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else await doc.webkitExitFullscreen?.();
  } catch {
    // Already exited.
  }
}

export function onFullscreenChange(listener: () => void): () => void {
  document.addEventListener('fullscreenchange', listener);
  document.addEventListener('webkitfullscreenchange', listener);
  return () => {
    document.removeEventListener('fullscreenchange', listener);
    document.removeEventListener('webkitfullscreenchange', listener);
  };
}
