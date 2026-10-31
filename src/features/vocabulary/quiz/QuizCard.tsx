import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from '@/components/common/IconButton';
import { SceneBackdrop } from '@/components/common/SceneBackdrop';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';

interface QuizCardProps {
  backdrop: string;
  titleId: string;
  onClose?: () => void;
  closeLabel?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Card floating over the dimmed scene on tablet/desktop, bottom sheet on phones (spec §13; design
 * screens 07–08). Used by the quiz and the answer / word detail screens.
 */
export function QuizCard({
  backdrop,
  titleId,
  onClose,
  closeLabel = 'Back to the room',
  children,
  className,
}: QuizCardProps) {
  return (
    <div className="relative flex flex-1 flex-col">
      <SceneBackdrop src={backdrop} tone="dim" />
      <div className="relative z-10 flex flex-1 items-end justify-center sm:items-center sm:p-6 md:py-16 lg:p-10">
        <section
          aria-labelledby={titleId}
          className={cn(
            'relative w-full max-w-[52rem] animate-slide-up rounded-t-[1.75rem] bg-white px-5 pt-6 pb-7 shadow-lift sm:rounded-[1.5rem] sm:px-10 sm:pt-9 sm:pb-10',
            className,
          )}
        >
          {onClose && (
            <IconButton
              label={closeLabel}
              variant="ghost"
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4"
            >
              <X aria-hidden strokeWidth={2.5} />
            </IconButton>
          )}
          {children}
        </section>
      </div>
    </div>
  );
}

/**
 * Warm grey tile with the object picture (left column of the question and answer cards).
 * `corner` sits in its top-right corner (the quiz's listen button).
 */
export function ObjectTile({
  image,
  alt,
  corner,
  className,
}: {
  image: string;
  alt: string;
  corner?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex aspect-square w-full items-center justify-center rounded-2xl bg-stone',
        className,
      )}
    >
      <img
        src={assetUrl(image)}
        alt={alt}
        className="max-h-[74%] max-w-[74%] object-contain drop-shadow-[0_14px_14px_rgb(60_40_20/0.18)]"
        draggable={false}
      />
      {corner && <div className="absolute top-3 right-3">{corner}</div>}
    </div>
  );
}
