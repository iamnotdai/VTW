import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ZOOM_CONFIG } from '@/config/app';
import { loadView, saveView } from '@/lib/savedView';
import {
  IDENTITY_TRANSFORM,
  panBy,
  rescaleForViewport,
  zoomAround,
  type ViewportSize,
  type ViewTransform,
} from '@/lib/viewTransform';

/** Movement (px) below which a press is a tap/click rather than a drag. */
const DRAG_THRESHOLD = 8;
const LIMITS = { min: ZOOM_CONFIG.min, max: ZOOM_CONFIG.max };

type Gesture =
  | { type: 'idle' }
  | {
      type: 'press';
      pointerId: number;
      startX: number;
      startY: number;
      start: ViewTransform;
      panning: boolean;
    }
  | { type: 'pinch'; startDistance: number; start: ViewTransform };

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Zoom & pan for the scene viewport: buttons, drag to pan (when zoomed), two-finger pinch,
 * and Ctrl/⌘ + wheel (also trackpad pinch). Plain wheel scrolling is left to the page.
 * A drag never counts as a click on an object.
 */
export function usePanZoom(sceneId: string) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [transform, setTransform] = useState<ViewTransform>(IDENTITY_TRANSFORM);
  const [gesturing, setGesturing] = useState(false);

  const sizeRef = useRef<ViewportSize>(size);
  const transformRef = useRef<ViewTransform>(transform);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<Gesture>({ type: 'idle' });
  const suppressClickRef = useRef(false);
  const lastPointerTypeRef = useRef<string>('mouse');

  useLayoutEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Track the viewport size and keep the same visible area when it changes.
  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => {
      const next = { width: element.clientWidth, height: element.clientHeight };
      const previous = sizeRef.current;
      if (next.width === previous.width && next.height === previous.height) return;
      sizeRef.current = next;
      setSize(next);
      if (previous.width === 0 || previous.height === 0) {
        // First measurement: pick up where the learner left this scene (e.g. after a question).
        const saved = loadView(sceneId, next, LIMITS);
        if (saved) setTransform(saved);
        return;
      }
      setTransform((current) => rescaleForViewport(current, previous, next, LIMITS));
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [sceneId]);

  // Remember the view for when the learner comes back to this scene.
  useEffect(() => {
    saveView(sceneId, transform, sizeRef.current);
  }, [sceneId, transform]);

  // Ctrl/⌘ + wheel zoom needs a non-passive native listener to prevent page zoom.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const focus = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setTransform((current) =>
        zoomAround(
          current,
          current.scale * Math.exp(-event.deltaY * 0.01),
          focus,
          sizeRef.current,
          LIMITS,
        ),
      );
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    lastPointerTypeRef.current = event.pointerType;
    const pointers = pointersRef.current;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      suppressClickRef.current = false;
      gestureRef.current = {
        type: 'press',
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        start: transformRef.current,
        panning: false,
      };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      gestureRef.current = {
        type: 'pinch',
        startDistance: Math.max(1, distance(a, b)),
        start: transformRef.current,
      };
      suppressClickRef.current = true;
      setGesturing(true);
    }
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const pointers = pointersRef.current;
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const gesture = gestureRef.current;
    const viewport = sizeRef.current;

    if (gesture.type === 'pinch' && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const focus = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
      const scale = gesture.start.scale * (distance(a, b) / gesture.startDistance);
      setTransform(zoomAround(gesture.start, scale, focus, viewport, LIMITS));
      return;
    }

    if (gesture.type === 'press' && gesture.pointerId === event.pointerId) {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (!gesture.panning && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        suppressClickRef.current = true;
        if (gesture.start.scale > LIMITS.min) {
          gesture.panning = true;
          viewportRef.current?.setPointerCapture?.(event.pointerId);
          setGesturing(true);
        }
      }
      if (gesture.panning) setTransform(panBy(gesture.start, dx, dy, viewport, LIMITS));
    }
  }, []);

  const onPointerEnd = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const pointers = pointersRef.current;
    if (!pointers.delete(event.pointerId)) return;
    if (pointers.size === 0) {
      gestureRef.current = { type: 'idle' };
      setGesturing(false);
    } else if (pointers.size === 1 && gestureRef.current.type === 'pinch') {
      // Keep panning with the finger that stays down.
      const [[pointerId, point]] = [...pointers.entries()];
      gestureRef.current = {
        type: 'press',
        pointerId,
        startX: point.x,
        startY: point.y,
        start: transformRef.current,
        panning: transformRef.current.scale > LIMITS.min,
      };
    }
  }, []);

  /** Swallows the click that follows a drag or pinch so it doesn't select an object. */
  const onClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.stopPropagation();
    event.preventDefault();
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setTransform((current) => {
      const viewport = sizeRef.current;
      const center = { x: viewport.width / 2, y: viewport.height / 2 };
      return zoomAround(current, current.scale + delta, center, viewport, LIMITS);
    });
  }, []);

  const zoomIn = useCallback(() => zoomBy(ZOOM_CONFIG.step), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(-ZOOM_CONFIG.step), [zoomBy]);
  const reset = useCallback(() => setTransform(IDENTITY_TRANSFORM), []);

  /** Pans (without zooming) so that a point given as a fraction of the scene (0–1) is visible. */
  const ensureVisible = useCallback((fx: number, fy: number) => {
    setTransform((current) => {
      if (current.scale <= LIMITS.min) return current;
      const viewport = sizeRef.current;
      const px = current.x + fx * viewport.width * current.scale;
      const py = current.y + fy * viewport.height * current.scale;
      const margin = 40;
      const inside =
        px > margin && px < viewport.width - margin && py > margin && py < viewport.height - margin;
      if (inside) return current;
      const target = {
        ...current,
        x: viewport.width / 2 - fx * viewport.width * current.scale,
        y: viewport.height / 2 - fy * viewport.height * current.scale,
      };
      return panBy(target, 0, 0, viewport, LIMITS);
    });
  }, []);

  /** Pointer type of the last press: "mouse", "touch" or "pen". */
  const getLastPointerType = useCallback(() => lastPointerTypeRef.current, []);

  return {
    viewportRef,
    size,
    transform,
    gesturing,
    isZoomed: transform.scale > LIMITS.min + 0.001,
    canZoomIn: transform.scale < LIMITS.max - 0.001,
    canZoomOut: transform.scale > LIMITS.min + 0.001,
    zoomIn,
    zoomOut,
    reset,
    ensureVisible,
    getLastPointerType,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onClickCapture,
    },
  };
}
