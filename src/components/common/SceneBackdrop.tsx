import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';

/**
 * The scene picture behind flashcards and question cards (spec §13 Desktop). `soft` keeps it
 * almost sharp (flashcards), `dim` darkens it like a dialog overlay (quiz and answer cards).
 */
export function SceneBackdrop({
  src,
  tone = 'soft',
  className,
}: {
  src: string;
  tone?: 'soft' | 'dim';
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <img
        src={assetUrl(src)}
        alt=""
        className={cn(
          'h-full w-full object-cover',
          tone === 'soft' ? 'scale-105 blur-[1.5px]' : 'scale-110 blur-[3px]',
        )}
        draggable={false}
      />
      <div className={cn('absolute inset-0', tone === 'soft' ? 'bg-white/10' : 'bg-navy-950/45')} />
    </div>
  );
}
