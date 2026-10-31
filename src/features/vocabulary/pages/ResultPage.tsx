import { ArrowRight, BookOpenText, Check, Eye, RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getNavigationState, paths } from '@/app/paths';
import { Button } from '@/components/common/Button';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';
import { getFoundWordIds } from '@/lib/progress';
import { playSfx } from '@/lib/sfx';
import { describeWord } from '@/lib/text';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Scene, Word } from '@/types/models';
import { WordExtras, WordHeadline } from '../components/WordDetail';
import { ObjectTile, QuizCard } from '../quiz/QuizCard';
import { isSessionFor, useQuizSessionStore } from '../quiz/quizSession';
import { startQuestion } from '../quiz/startQuestion';
import { useSceneParam, useSceneWordParam } from '../useSceneParam';

/** Screen 08 — Answer Feedback / Word Detail (`/vocabulary/:sceneId/result/:wordId`). */
export function ResultPage() {
  const result = useSceneParam();
  const word = useSceneWordParam(result.status === 'ok' ? result.scene : undefined);
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  if (!word) return <NotFoundPage />;
  return <Result key={`${result.scene.id}:${word.id}`} scene={result.scene} word={word} />;
}

type ResultMode = 'correct' | 'revealed' | 'review';

const HEADINGS: Record<
  ResultMode,
  { title: string; icon: typeof Check; badge: string; text: string }
> = {
  correct: { title: 'Correct!', icon: Check, badge: 'bg-leaf-500', text: 'text-leaf-600' },
  revealed: { title: 'Here’s the answer', icon: Eye, badge: 'bg-sun-500', text: 'text-navy-900' },
  review: {
    title: 'Word details',
    icon: BookOpenText,
    badge: 'bg-brand-500',
    text: 'text-navy-900',
  },
};

/** How the learner got here, read once so leaving the screen can't change what it shows. */
function readOutcome(scene: Scene, word: Word): { mode: ResultMode; newlyCompleted: boolean } {
  const session = useQuizSessionStore.getState().session;
  if (!isSessionFor(session, scene.id, word.id)) return { mode: 'review', newlyCompleted: false };
  if (session.status === 'correct')
    return { mode: 'correct', newlyCompleted: !!session.newlyCompleted };
  if (session.status === 'revealed') return { mode: 'revealed', newlyCompleted: false };
  return { mode: 'review', newlyCompleted: false };
}

function Result({ scene, word }: { scene: Scene; word: Word }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = getNavigationState(location.state);
  const [{ mode, newlyCompleted }] = useState(() => readOutcome(scene, word));
  const foundCount = useProgressStore(
    (state) =>
      getFoundWordIds(state.progress, scene.id).filter((id) => scene.wordIds.includes(id)).length,
  );

  const heading = HEADINGS[mode];
  const HeadingIcon = heading.icon;
  useDocumentTitle(`${heading.title} · ${word.text}`);

  const sceneComplete = foundCount === scene.wordIds.length;
  const note =
    mode === 'correct'
      ? newlyCompleted
        ? sceneComplete
          ? 'You found every object in this room!'
          : null
        : 'You already knew this one. Great memory!'
      : mode === 'revealed'
        ? 'Try again to add it to your Objects Found.'
        : null;

  const backToScene = () => {
    useQuizSessionStore.getState().clear();
    if (navState.from === 'explore') navigate(-1);
    else navigate(paths.explore(scene.id), { replace: true });
  };

  // A chime for a correct answer (only if sound is on in Settings).
  useEffect(() => {
    if (mode !== 'correct' || !useSettingsStore.getState().settings.soundEnabled) return;
    return playSfx('correct');
  }, [mode]);

  // Enter does what the big "Next Object" button does, unless it is pressing a control itself.
  useEffect(() => {
    if (mode !== 'correct') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      backToScene();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const practiceAgain = () => {
    startQuestion(scene, word);
    navigate(paths.quiz(scene.id, word.id), { replace: true, state: navState });
  };

  return (
    <QuizCard backdrop={scene.background} titleId="result-title" onClose={backToScene}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-9">
        <ObjectTile image={word.image} alt="" className="mx-auto max-w-48 sm:max-w-none" />

        <div className="flex min-w-0 flex-col justify-center gap-4">
          <div className="pr-10">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-11 shrink-0 animate-pop-in items-center justify-center rounded-full text-white',
                  heading.badge,
                )}
              >
                <HeadingIcon aria-hidden className="size-6" strokeWidth={3} />
              </span>
              <h1
                id="result-title"
                className={cn('text-[2.125rem] leading-tight font-extrabold', heading.text)}
              >
                {heading.title}
              </h1>
            </div>
            <p role="status" className="mt-1 pl-14 text-lg font-bold text-navy-800">
              {describeWord(word)}
              {note && (
                <span className="block text-[0.9375rem] font-medium text-navy-500">{note}</span>
              )}
            </p>
          </div>
          <WordHeadline word={word} />
        </div>
      </div>

      <hr className="my-5 border-navy-100" />
      <WordExtras word={word} />
      <hr className="my-5 border-navy-100" />

      <div className="grid gap-3 sm:grid-cols-2">
        {mode === 'correct' && (
          <Button
            size="lg"
            className="sm:col-span-2"
            rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
            onClick={backToScene}
          >
            {sceneComplete ? 'Back to the Room' : 'Next Object'}
          </Button>
        )}
        {mode === 'revealed' && (
          <>
            <Button
              size="lg"
              leftIcon={<RotateCcw aria-hidden className="size-5" />}
              onClick={practiceAgain}
            >
              Try Again
            </Button>
            <Button
              size="lg"
              variant="secondary"
              leftIcon={<Search aria-hidden className="size-5" />}
              onClick={backToScene}
            >
              Back to the Room
            </Button>
          </>
        )}
        {mode === 'review' && (
          <>
            <Button
              size="lg"
              leftIcon={<RotateCcw aria-hidden className="size-5" />}
              onClick={practiceAgain}
            >
              Practice Again
            </Button>
            <Button
              size="lg"
              variant="secondary"
              leftIcon={<Search aria-hidden className="size-5" />}
              onClick={backToScene}
            >
              Back to the Room
            </Button>
          </>
        )}
      </div>
    </QuizCard>
  );
}
