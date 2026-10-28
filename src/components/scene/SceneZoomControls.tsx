import { Maximize, Minimize, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';
import { cn } from '@/lib/cn';

interface SceneZoomControlsProps {
  canZoomIn: boolean;
  canZoomOut: boolean;
  isZoomed: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** Hidden when the browser has no element fullscreen (graceful fallback, spec §18). */
  fullscreen?: { active: boolean; toggle: () => void };
  className?: string;
}

/** Layer 5 (spec §7.6): navy round buttons over the picture — zoom in / out / reset, fullscreen. */
export function SceneZoomControls({
  canZoomIn,
  canZoomOut,
  isZoomed,
  onZoomIn,
  onZoomOut,
  onReset,
  fullscreen,
  className,
}: SceneZoomControlsProps) {
  return (
    <div
      className={cn('flex shrink-0 items-center gap-2.5', className)}
      role="toolbar"
      aria-label="Zoom"
    >
      {isZoomed && (
        <IconButton label="Reset zoom" variant="dark" size="fluid" onClick={onReset}>
          <RotateCcw aria-hidden />
        </IconButton>
      )}
      <IconButton
        label="Zoom in"
        variant="dark"
        size="fluid"
        onClick={onZoomIn}
        disabled={!canZoomIn}
      >
        <ZoomIn aria-hidden />
      </IconButton>
      <IconButton
        label="Zoom out"
        variant="dark"
        size="fluid"
        onClick={onZoomOut}
        disabled={!canZoomOut}
      >
        <ZoomOut aria-hidden />
      </IconButton>
      {fullscreen && (
        <IconButton
          label={fullscreen.active ? 'Exit full screen' : 'Full screen'}
          variant="dark"
          size="fluid"
          onClick={fullscreen.toggle}
        >
          {fullscreen.active ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
        </IconButton>
      )}
    </div>
  );
}
