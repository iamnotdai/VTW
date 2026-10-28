import { useId, type KeyboardEvent, type PointerEvent } from 'react';
import { assetUrl } from '@/lib/assets';
import type { SceneHotspot } from '@/types/models';
import type { HighlightMode } from './sceneInteraction';

interface SvgHotspotsProps {
  width: number;
  height: number;
  /** Sorted by zIndex ascending: later paths sit on top and receive the pointer first. */
  hotspots: readonly SceneHotspot[];
  /** Point on each object where its "found" check is drawn. */
  anchorById: ReadonlyMap<string, { x: number; y: number }>;
  highlight: { wordId: string; mode: HighlightMode } | null;
  foundWordIds: ReadonlySet<string>;
  /** Grow hit areas by each hotspot's `touchPadding` (coarse pointers only). */
  expandHitAreas: boolean;
  /** Current zoom, used to keep outlines and markers a constant size on screen. */
  zoom: number;
  getAriaLabel: (wordId: string, index: number) => string;
  onHoverChange: (wordId: string, hovering: boolean) => void;
  onFocusChange: (wordId: string, focused: boolean) => void;
  onActivate: (wordId: string, via: 'pointer' | 'keyboard') => void;
}

/**
 * Layers 2–3 of the scene (spec §7.6): invisible hit paths that follow each object's contour, then
 * the highlight (sprite glow + outline) of the active object. Everything shares the background's
 * viewBox, so it stays aligned at any size or zoom level.
 */
export function SvgHotspots({
  width,
  height,
  hotspots,
  anchorById,
  highlight,
  foundWordIds,
  expandHitAreas,
  zoom,
  getAriaLabel,
  onHoverChange,
  onFocusChange,
  onActivate,
}: SvgHotspotsProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const glowId = `${uid}-glow`;
  const outlineGlowId = `${uid}-outline-glow`;
  const maskId = `${uid}-mask`;

  const highlightIndex = highlight ? hotspots.findIndex((h) => h.wordId === highlight.wordId) : -1;
  const highlighted = highlightIndex >= 0 ? hotspots[highlightIndex] : null;
  // Objects drawn above the highlighted one hide the parts of it they cover.
  const occluders = highlighted
    ? hotspots.filter((h, i) => i > highlightIndex && (h.zIndex ?? 0) > (highlighted.zIndex ?? 0))
    : [];

  const markerRadius = 15 / zoom;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
      role="group"
      aria-label="Objects in the picture"
    >
      <defs>
        <filter
          id={glowId}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology in="SourceAlpha" operator="dilate" radius={4} result="spread" />
          <feGaussianBlur in="spread" stdDeviation={9} result="blur" />
          <feFlood floodColor="#ffd84d" floodOpacity={0.95} />
          <feComposite in2="blur" operator="in" result="glow" />
          <feComponentTransfer in="SourceGraphic" result="bright">
            <feFuncR type="linear" slope={1.12} intercept={0.04} />
            <feFuncG type="linear" slope={1.12} intercept={0.04} />
            <feFuncB type="linear" slope={1.06} intercept={0.02} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="bright" />
          </feMerge>
        </filter>
        <filter id={outlineGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={6} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {occluders.length > 0 && (
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
            <rect width={width} height={height} fill="white" />
            {occluders.map((hotspot) => (
              <path key={hotspot.wordId} d={hotspot.svgPath} fill="black" />
            ))}
          </mask>
        )}
      </defs>

      {/* Layer 2 — hit areas following each object's contour. */}
      <g>
        {hotspots.map((hotspot, index) => (
          <path
            key={hotspot.wordId}
            data-hotspot={hotspot.wordId}
            d={hotspot.svgPath}
            className="vtw-hotspot"
            fill="transparent"
            stroke="transparent"
            strokeWidth={expandHitAreas ? (hotspot.touchPadding ?? 0) * 2 : 0}
            strokeLinejoin="round"
            pointerEvents="all"
            role="button"
            tabIndex={0}
            aria-label={getAriaLabel(hotspot.wordId, index)}
            // Mouse clicks shouldn't leave a keyboard-focus outline behind.
            onMouseDown={(event) => event.preventDefault()}
            onPointerEnter={(event: PointerEvent) => {
              if (event.pointerType === 'mouse') onHoverChange(hotspot.wordId, true);
            }}
            onPointerLeave={(event: PointerEvent) => {
              if (event.pointerType === 'mouse') onHoverChange(hotspot.wordId, false);
            }}
            onFocus={() => onFocusChange(hotspot.wordId, true)}
            onBlur={() => onFocusChange(hotspot.wordId, false)}
            onClick={() => onActivate(hotspot.wordId, 'pointer')}
            onKeyDown={(event: KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onActivate(hotspot.wordId, 'keyboard');
              }
            }}
          />
        ))}
      </g>

      {/* Found markers. */}
      <g pointerEvents="none" aria-hidden="true">
        {hotspots
          .filter((hotspot) => foundWordIds.has(hotspot.wordId))
          .map((hotspot) => {
            const anchor = anchorById.get(hotspot.wordId);
            if (!anchor) return null;
            const cx = Math.min(width - markerRadius, Math.max(markerRadius, anchor.x));
            const cy = Math.min(
              height - markerRadius,
              Math.max(markerRadius, anchor.y + markerRadius * 0.4),
            );
            return (
              <g
                key={hotspot.wordId}
                transform={`translate(${cx} ${cy}) scale(${markerRadius / 15})`}
              >
                <circle r={15} fill="#2fb374" stroke="#ffffff" strokeWidth={4} />
                <path
                  d="M -6.5 0.5 L -1.5 5.5 L 7 -4.5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
      </g>

      {/* Layer 3 — highlight of the active object (sprite glow + outline). */}
      {highlighted && (
        <g
          pointerEvents="none"
          aria-hidden="true"
          mask={occluders.length > 0 ? `url(#${maskId})` : undefined}
        >
          {highlighted.sprite && highlighted.spriteBounds && (
            <image
              href={assetUrl(highlighted.sprite)}
              x={highlighted.spriteBounds.x}
              y={highlighted.spriteBounds.y}
              width={highlighted.spriteBounds.width}
              height={highlighted.spriteBounds.height}
              preserveAspectRatio="none"
              filter={`url(#${glowId})`}
              className="vtw-sprite"
            />
          )}
          <path
            d={highlighted.svgPath}
            className={highlight?.mode === 'focus' ? 'vtw-outline-focus' : 'vtw-outline'}
            strokeWidth={5 / zoom}
            filter={highlight?.mode === 'focus' ? undefined : `url(#${outlineGlowId})`}
          />
        </g>
      )}
    </svg>
  );
}
