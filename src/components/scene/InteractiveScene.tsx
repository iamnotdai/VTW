import { CircleCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Button } from '@/components/common/Button';
import { toggleAppFullscreen, useAppFullscreen } from '@/hooks/useAppFullscreen';
import { useCoarsePointer } from '@/hooks/useMediaQuery';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { isFullscreenSupported } from '@/lib/fullscreen';
import { getHotspotAnchor, getPathBounds } from '@/lib/svgPath';
import { sceneToViewport } from '@/lib/viewTransform';
import type { Bounds, Scene } from '@/types/models';
import {
  getHighlight,
  INITIAL_SCENE_INTERACTION,
  resolveTap,
  sceneInteractionReducer,
} from './sceneInteraction';
import { SceneZoomControls } from './SceneZoomControls';
import { SvgHotspots } from './SvgHotspots';
import { usePanZoom } from './usePanZoom';

export interface InteractiveSceneProps {
  scene: Scene;
  foundWordIds: ReadonlySet<string>;
  /** Display text of a word (only shown for objects already found). */
  getWordText: (wordId: string) => string;
  /** Opens an object: quiz for a new object, word detail for a found one. */
  onOpenObject: (wordId: string) => void;
  /** Highlight driven from outside, e.g. the Objects Found tiles. */
  externalHighlightId?: string | null;
  className?: string;
}

type Point = { x: number; y: number };

/** Approximate bubble width, used to keep it inside the picture. */
const BUBBLE_ROOM = 210;

/**
 * The Explore scene (spec §7.4, §7.6, §12; design screen 06):
 *   1 background image → 2 SVG hit paths + outlines → 3 highlight sprite → 4 hint bubble
 *   → 5 zoom/fullscreen buttons. Layers 1–3 share one transformed box, so zoom/pan can never
 *   shift hotspots away from the picture. The bubble and the buttons never take clicks away from
 *   objects (the bubble is click-through, the buttons sit in the top-right corner).
 * Mouse: hover highlights, click opens. Touch: first tap selects + shows "Learn", second tap (or
 * the button) opens — nothing depends on hover. Keyboard: Tab to an object, Enter/Space opens.
 */
export function InteractiveScene({
  scene,
  foundWordIds,
  getWordText,
  onOpenObject,
  externalHighlightId = null,
  className,
}: InteractiveSceneProps) {
  const coarsePointer = useCoarsePointer();
  const {
    viewportRef,
    size,
    transform,
    gesturing,
    isZoomed,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    reset,
    ensureVisible,
    getLastPointerType,
    handlers,
  } = usePanZoom(scene.id);
  const [state, dispatch] = useReducer(sceneInteractionReducer, INITIAL_SCENE_INTERACTION);
  const [fullscreenSupported] = useState(isFullscreenSupported);
  const isFullscreen = useAppFullscreen();

  const hotspots = useMemo(
    () =>
      scene.hotspots
        .map((hotspot, order) => ({ hotspot, order }))
        .sort((a, b) => (a.hotspot.zIndex ?? 0) - (b.hotspot.zIndex ?? 0) || a.order - b.order)
        .map(({ hotspot }) => hotspot),
    [scene.hotspots],
  );

  const { boundsById, anchorById } = useMemo(() => {
    const bounds = new Map<string, Bounds>();
    const anchors = new Map<string, Point>();
    for (const hotspot of scene.hotspots) {
      const box = getPathBounds(hotspot.svgPath) ?? hotspot.spriteBounds;
      if (box) bounds.set(hotspot.wordId, box);
      const anchor = getHotspotAnchor(hotspot);
      if (anchor) anchors.set(hotspot.wordId, anchor);
    }
    return { boundsById: bounds, anchorById: anchors };
  }, [scene.hotspots]);

  const highlight =
    getHighlight(state) ??
    (externalHighlightId ? { wordId: externalHighlightId, mode: 'focus' as const } : null);

  // Escape clears a touch selection.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'clear' });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const open = useCallback(
    (wordId: string) => {
      if (state.openedId) return;
      dispatch({ type: 'open', wordId });
      onOpenObject(wordId);
    },
    [state.openedId, onOpenObject],
  );

  const handleActivate = useCallback(
    (wordId: string, via: 'pointer' | 'keyboard') => {
      if (state.openedId) return;
      const pointerType = getLastPointerType();
      if (via === 'pointer' && (pointerType === 'touch' || pointerType === 'pen')) {
        if (resolveTap(state, wordId) === 'open') open(wordId);
        else dispatch({ type: 'select', wordId });
        return;
      }
      open(wordId);
    },
    [state, open, getLastPointerType],
  );

  const handleFocusChange = useCallback(
    (wordId: string, focused: boolean) => {
      dispatch({ type: focused ? 'focus' : 'blur', wordId });
      const bounds = focused ? boundsById.get(wordId) : undefined;
      if (bounds) {
        ensureVisible(
          (bounds.x + bounds.width / 2) / scene.width,
          (bounds.y + bounds.height / 2) / scene.height,
        );
      }
    },
    [boundsById, ensureVisible, scene.width, scene.height],
  );

  const toggleFullscreen = useCallback(() => toggleAppFullscreen(isFullscreen), [isFullscreen]);

  const getAriaLabel = useCallback(
    (wordId: string) => {
      const number = scene.wordIds.indexOf(wordId) + 1;
      return foundWordIds.has(wordId)
        ? `${getWordText(wordId)} — found. Press Enter to review.`
        : `Object ${number} — not found yet. Press Enter to learn it.`;
    },
    [scene.wordIds, foundWordIds, getWordText],
  );

  const allFound = scene.wordIds.every((id) => foundWordIds.has(id));
  const hint = allFound
    ? 'You found everything!'
    : coarsePointer
      ? 'Tap an object, then tap Learn!'
      : 'Click on an object!';

  // Layer 4: the bubble sits on the highlighted object (never reveals the word of an unfound
  // object); with nothing highlighted it shows the hint in the bottom-left corner.
  const bubbleText = highlight
    ? foundWordIds.has(highlight.wordId)
      ? getWordText(highlight.wordId)
      : highlight.mode === 'selected'
        ? 'What is this?'
        : highlight.mode === 'focus'
          ? 'Press Enter to learn!'
          : 'Click on an object!'
    : hint;
  const anchor = highlight ? anchorById.get(highlight.wordId) : undefined;
  let pinned: { x: number; y: number; below: boolean; wordId: string } | null = null;
  if (highlight && anchor && size.width > 0) {
    const point = sceneToViewport(anchor, transform, size, scene);
    const below = point.y < 64;
    pinned = {
      wordId: highlight.wordId,
      x: Math.min(size.width - BUBBLE_ROOM, Math.max(8, point.x - 28)),
      y: below ? Math.min(size.height - 8, point.y + 14) : point.y - 10,
      below,
    };
  }
  const showLearnButton = highlight?.mode === 'selected' && !state.openedId;

  return (
    <div className={cn('flex justify-center', className)}>
      {/* Tapping empty space clears a touch selection; keyboard users press Escape instead. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        ref={viewportRef}
        data-testid="scene-viewport"
        className={cn(
          'relative w-full overflow-hidden bg-cream-100 select-none',
          gesturing ? 'cursor-grabbing' : isZoomed && 'cursor-grab',
        )}
        style={{
          aspectRatio: `${scene.width} / ${scene.height}`,
          touchAction: isZoomed ? 'none' : 'pan-y',
        }}
        {...handlers}
        onClick={(event) => {
          if (!(event.target as Element).closest('[data-hotspot], button'))
            dispatch({ type: 'clear' });
        }}
      >
        {/* Layers 1–3 share this transformed box. */}
        <div
          className={cn('absolute inset-0 origin-top-left', gesturing && 'will-change-transform')}
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          }}
        >
          <img
            src={assetUrl(scene.background)}
            alt={`${scene.title} scene`}
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
            fetchPriority="high"
          />
          <SvgHotspots
            width={scene.width}
            height={scene.height}
            hotspots={hotspots}
            anchorById={anchorById}
            highlight={highlight}
            foundWordIds={foundWordIds}
            expandHitAreas={coarsePointer}
            zoom={transform.scale}
            getAriaLabel={getAriaLabel}
            onHoverChange={(wordId, hovering) =>
              dispatch({ type: hovering ? 'hover' : 'unhover', wordId })
            }
            onFocusChange={handleFocusChange}
            onActivate={handleActivate}
          />
        </div>

        {/* Layer 4 — hint bubble (pinned to the highlighted object, or in the corner). */}
        <div
          className={cn(
            // Above the zoom buttons: the touch "Learn" button must stay tappable.
            'pointer-events-none absolute z-30',
            !pinned && 'bottom-3 left-3 sm:bottom-4 sm:left-4',
          )}
          style={pinned ? { left: pinned.x, top: pinned.y } : undefined}
        >
          <div
            key={pinned?.wordId ?? 'hint'}
            className={cn(
              'relative flex animate-pop-in items-center gap-2 rounded-xl bg-sidebar py-2 pr-2 pl-4 text-sm font-bold whitespace-nowrap text-white shadow-lift sm:text-[15px]',
              pinned && !pinned.below && '-translate-y-full',
              !showLearnButton && 'pr-4',
            )}
          >
            {(highlight ? foundWordIds.has(highlight.wordId) : allFound) && (
              <CircleCheck aria-hidden className="size-4 text-leaf-400" />
            )}
            <span>{bubbleText}</span>
            {showLearnButton && pinned && (
              <Button
                size="sm"
                variant="warm"
                shape="pill"
                className="pointer-events-auto"
                onClick={() => open(pinned.wordId)}
              >
                {foundWordIds.has(pinned.wordId) ? 'Review' : 'Learn'}
              </Button>
            )}
            {pinned && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-5 size-3 rotate-45 bg-sidebar',
                  pinned.below ? '-top-1.5' : '-bottom-1.5',
                )}
              />
            )}
          </div>
        </div>

        {/* Layer 5 — zoom and fullscreen. */}
        <SceneZoomControls
          className="absolute top-3 right-3 z-20 sm:top-4 sm:right-4"
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          isZoomed={isZoomed}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={reset}
          fullscreen={
            fullscreenSupported ? { active: isFullscreen, toggle: toggleFullscreen } : undefined
          }
        />
      </div>
    </div>
  );
}
