import { ArrowRight, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { paths } from '@/app/paths';
import { Button, ButtonLink } from '@/components/common/Button';
import { COMPLETED_IMAGES } from '@/config/assets';
import { assetUrl } from '@/lib/assets';
import type { AvatarChoice } from '@/types/models';

interface SceneCompletedDialogProps {
  sceneId: string;
  avatar: AvatarChoice;
  /** Every way out except "Play again": leaves the picture as it is. */
  onClose: () => void;
  /** "Play again" — starts the scene over (learned words, % and level stay). */
  onReset: () => void;
}

/**
 * "Completed!" popup shown once when every object of a scene was learned. The learner's own
 * boy/girl picture celebrates. Esc, the X, the backdrop and "Keep exploring" all just close it.
 */
export function SceneCompletedDialog({
  sceneId,
  avatar,
  onClose,
  onReset,
}: SceneCompletedDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.querySelector('a')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-[2px]">
      <div aria-hidden className="absolute inset-0" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-completed-title"
        className="relative z-10 flex w-full max-w-2xl flex-col items-center overflow-hidden rounded-3xl bg-linear-to-br from-white to-brand-50 shadow-lift sm:flex-row sm:items-end"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-navy-600 transition hover:bg-navy-50"
        >
          <X aria-hidden className="size-6" />
        </button>

        {/* 40% of the card; only head to torso, the body is cut below the torso. */}
        <div className="w-2/5 shrink-0 px-6 pt-8 sm:px-0 sm:pt-10 sm:pr-2 sm:pb-8 sm:pl-6">
          <div className="aspect-[0.88] overflow-hidden">
            <img
              src={assetUrl(COMPLETED_IMAGES[avatar])}
              alt=""
              aria-hidden
              className="size-full object-cover object-top"
            />
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-4 px-6 pt-4 pb-7 text-center sm:items-start sm:self-center sm:py-8 sm:pr-8 sm:pl-4 sm:text-left">
          <div>
            <h2 id="scene-completed-title" className="text-4xl font-extrabold text-navy-900">
              Completed!
            </h2>
            <p className="mt-2 text-lg text-navy-600">
              You have learned all objects in this scene.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5">
            <ButtonLink
              to={paths.topicConversations(sceneId)}
              onClick={onClose}
              size="lg"
              shape="pill"
              fullWidth
              rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
            >
              Go to Conversations
            </ButtonLink>
            <div className="flex gap-2.5">
              <Button
                variant="warm"
                size="md"
                shape="pill"
                className="flex-1"
                leftIcon={<RotateCcw aria-hidden className="size-4" strokeWidth={2.5} />}
                onClick={onReset}
              >
                Play again
              </Button>
              <Button
                variant="secondary"
                size="md"
                shape="pill"
                className="flex-1"
                onClick={onClose}
              >
                Keep exploring
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
