import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Flag,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { paths } from '@/app/paths';
import { Button, ButtonLink } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { SceneBackdrop } from '@/components/common/SceneBackdrop';
import { getSceneWords } from '@/data/content';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { playSfx } from '@/lib/sfx';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Scene } from '@/types/models';
import { Flashcard } from '../components/Flashcard';
import { FlashcardStrip } from '../components/FlashcardStrip';
import { useSceneParam } from '../useSceneParam';

/** Screen 05 — Vocabulary Flashcards (`/vocabulary/:sceneId/flashcards`). */
export function FlashcardsPage() {
  const result = useSceneParam();
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  return <Flashcards scene={result.scene} />;
}

function Flashcards({ scene }: { scene: Scene }) {
  useDocumentTitle(`Flashcards · ${scene.title}`);
  const words = useMemo(() => getSceneWords(scene), [scene]);
  const setFlashcardIndex = useProgressStore((state) => state.setFlashcardIndex);
  const [index, setIndex] = useState(() => {
    const saved = useProgressStore.getState().progress.lastFlashcardIndexByScene[scene.id] ?? 0;
    // Resume where the learner stopped; start over if they had reached the end.
    return saved >= words.length - 1 ? 0 : saved;
  });
  const [finished, setFinished] = useState(false);
  const last = index === words.length - 1;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(words.length - 1, next));
      setIndex(clamped);
      setFlashcardIndex(scene.id, clamped);
    },
    [words.length, setFlashcardIndex, scene.id],
  );

  const finish = useCallback(() => {
    setFlashcardIndex(scene.id, words.length - 1);
    setFinished(true);
    if (useSettingsStore.getState().settings.soundEnabled) playSfx('completed');
  }, [setFlashcardIndex, scene.id, words.length]);

  // Next only moves between cards: it never marks a word as learned (spec §7.3).
  const next = useCallback(() => (last ? finish() : goTo(index + 1)), [last, finish, goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  // ← / → on desktop, unless the learner is typing somewhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (finished || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault();
        previous();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finished, index, next, previous]);

  const word = words[index];

  return (
    <>
      <h1 className="sr-only">{scene.title} flashcards</h1>

      {/* --card-width: the card, and the gap it leaves in the picture strip behind it. */}
      <div className="relative flex flex-1 flex-col overflow-hidden [--card-width:min(38rem,100%)] xl:[--card-width:36rem]">
        <SceneBackdrop src={scene.background} />

        {!finished && word && (
          <div className="absolute inset-x-6 bottom-6 z-0 hidden xl:block">
            <FlashcardStrip words={words} index={index} onSelect={goTo} />
          </div>
        )}

        <div
          className={cn(
            'relative z-10 flex flex-1 justify-center px-4 pt-5 pb-6 sm:px-6 xl:pb-4',
            finished ? 'items-center' : 'items-start',
          )}
        >
          {finished ? (
            <section className="flex w-full max-w-xl animate-pop-in flex-col items-center gap-4 rounded-[1.25rem] bg-white p-8 text-center shadow-lift">
              <img
                src={assetUrl('/assets/icons/celebration.webp')}
                alt=""
                aria-hidden
                className="size-28 object-contain"
              />
              <h2 className="text-3xl font-extrabold text-navy-900">Great job!</h2>
              <p className="max-w-sm font-medium text-navy-500">
                Now find these {words.length} things in the {scene.title.toLowerCase()} and answer a
                question about each one.
              </p>
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-fit">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ButtonLink
                    to={paths.explore(scene.id)}
                    size="lg"
                    leftIcon={<Search aria-hidden className="size-5" />}
                  >
                    Explore the {scene.title}
                  </ButtonLink>
                  <ButtonLink
                    to={paths.topic(scene.id)}
                    size="lg"
                    variant="soft"
                    leftIcon={<ArrowLeft aria-hidden className="size-5" strokeWidth={2.5} />}
                  >
                    Back to Overview
                  </ButtonLink>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  leftIcon={<RotateCcw aria-hidden className="size-5" />}
                  onClick={() => {
                    setFinished(false);
                    goTo(0);
                  }}
                >
                  Start the cards again
                </Button>
              </div>
            </section>
          ) : (
            word && (
              <div className="relative w-(--card-width)">
                <IconButton
                  label="Previous card"
                  onClick={previous}
                  disabled={index === 0}
                  size="lg"
                  className="absolute top-[27%] -left-3 z-10 disabled:invisible sm:-left-7"
                >
                  <ChevronLeft aria-hidden strokeWidth={2.5} />
                </IconButton>
                <Flashcard
                  key={word.id}
                  word={word}
                  index={index}
                  total={words.length}
                  corner={
                    !last && (
                      <button
                        type="button"
                        onClick={finish}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-leaf-50 px-4 text-[0.9375rem] font-bold text-leaf-700 transition hover:bg-leaf-100"
                      >
                        <CircleCheck aria-hidden className="size-4.5 fill-leaf-500 text-white" />
                        Finish
                      </button>
                    )
                  }
                  footer={
                    last ? (
                      <Button
                        variant="success"
                        size="lg"
                        fullWidth
                        onClick={finish}
                        rightIcon={<Flag aria-hidden className="size-5" />}
                      >
                        Finish
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        fullWidth
                        onClick={next}
                        rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
                      >
                        Next
                      </Button>
                    )
                  }
                />
                <IconButton
                  label="Next card"
                  onClick={next}
                  disabled={last}
                  size="lg"
                  className="absolute top-[27%] -right-3 z-10 disabled:invisible sm:-right-7"
                >
                  <ChevronRight aria-hidden strokeWidth={2.5} />
                </IconButton>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
