import { Eye, Lightbulb, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getNavigationState, paths } from '@/app/paths';
import { AudioButton } from '@/components/common/AudioButton';
import { Button } from '@/components/common/Button';
import { QUIZ_CONFIG } from '@/config/app';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { playSfx } from '@/lib/sfx';
import { useAudioStore } from '@/stores/audioStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Scene, Word } from '@/types/models';
import { MultipleChoiceQuestion } from '../quiz/MultipleChoiceQuestion';
import { ObjectTile, QuizCard } from '../quiz/QuizCard';
import { isSessionFor, useQuizSessionStore, type QuizAnswer } from '../quiz/quizSession';
import { startQuestion } from '../quiz/startQuestion';
import { TypingQuestion } from '../quiz/TypingQuestion';
import { useSceneParam, useSceneWordParam } from '../useSceneParam';

const QUESTION_SOUND_KEY = 'quiz:question';

/** Screen 07 — Vocabulary Quiz (`/vocabulary/:sceneId/quiz/:wordId`). */
export function QuizPage() {
  const result = useSceneParam();
  const word = useSceneWordParam(result.status === 'ok' ? result.scene : undefined);
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  if (!word) return <NotFoundPage />;
  return <Quiz key={`${result.scene.id}:${word.id}`} scene={result.scene} word={word} />;
}

function Quiz({ scene, word }: { scene: Scene; word: Word }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = getNavigationState(location.state);
  const session = useQuizSessionStore((state) => state.session);
  const dispatch = useQuizSessionStore((state) => state.dispatch);
  const setNewlyCompleted = useQuizSessionStore((state) => state.setNewlyCompleted);
  const completeWord = useProgressStore((state) => state.completeWord);

  const active =
    isSessionFor(session, scene.id, word.id) &&
    (session.status === 'answering' || session.status === 'incorrect')
      ? session
      : null;
  const prompt = active?.question.prompt;
  useDocumentTitle(prompt?.text ?? 'Quiz');

  // Opened by URL (refresh, deep link): create the question once.
  useEffect(() => {
    const current = useQuizSessionStore.getState().session;
    const reusable =
      isSessionFor(current, scene.id, word.id) &&
      (current.status === 'answering' || current.status === 'incorrect');
    if (!reusable) startQuestion(scene, word);
  }, [scene, word]);

  // Read the question aloud when it appears (the learner just tapped an object, so the browser
  // allows it). "Try Again" keeps the same question and does not repeat it.
  const questionId = active?.question.id;
  const promptText = prompt?.text;
  useEffect(() => {
    if (!questionId || !promptText || !QUIZ_CONFIG.speakQuestion) return;
    const audio = useAudioStore.getState();
    audio.play(QUESTION_SOUND_KEY, { text: promptText });
    return () => {
      if (useAudioStore.getState().playingKey === QUESTION_SOUND_KEY) audio.stop();
    };
  }, [questionId, promptText]);

  const backToScene = () => {
    useQuizSessionStore.getState().clear();
    if (navState.from === 'explore') navigate(-1);
    else navigate(paths.explore(scene.id), { replace: true });
  };

  const submit = (answer: QuizAnswer) => {
    const next = dispatch({ type: 'submit', answer, word });
    if (next?.status === 'correct') {
      // Only a correct answer completes the word — once (spec §8 Feedback).
      setNewlyCompleted(completeWord(scene.id, word.id));
      navigate(paths.result(scene.id, word.id), { replace: true, state: navState });
    } else if (next?.status === 'incorrect' && useSettingsStore.getState().settings.soundEnabled) {
      playSfx('wrong');
    }
  };

  const showAnswer = () => {
    dispatch({ type: 'reveal' });
    navigate(paths.result(scene.id, word.id), { replace: true, state: navState });
  };

  if (!active) return null;
  const { question, status } = active;

  return (
    <QuizCard backdrop={scene.background} titleId="quiz-title" onClose={backToScene}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] sm:gap-8">
        <ObjectTile
          image={word.image}
          alt="The object you chose"
          corner={
            <AudioButton
              soundKey={`word:${word.id}`}
              text={word.text}
              src={word.audio}
              label="Listen to the word"
              variant="brand"
            />
          }
          className="mx-auto max-w-56 sm:max-w-none"
        />

        <div className="flex flex-col justify-center">
          <h1
            id="quiz-title"
            className="pr-10 text-2xl leading-tight font-extrabold text-navy-900 sm:pr-8"
          >
            {question.prompt.text}
          </h1>
          <p className="sr-only">
            {question.mode === 'typing' ? 'Type the word in English.' : 'Choose the right word.'}
          </p>

          <div className="mt-5">
            {question.mode === 'typing' ? (
              <TypingQuestion
                key={question.id}
                status={status}
                onSubmit={(text) => submit({ kind: 'typed', text })}
              />
            ) : (
              <MultipleChoiceQuestion
                key={question.id}
                choices={question.choices}
                status={status}
                lastAnswer={active.lastAnswer}
                onSubmit={(wordId) => submit({ kind: 'choice', wordId })}
              />
            )}
          </div>

          {status === 'incorrect' && (
            <div role="status" className="mt-4 rounded-xl bg-sun-50 p-4 ring-1 ring-sun-200">
              <p className="flex items-center gap-2 font-bold text-sun-700">
                <Lightbulb aria-hidden className="size-5 shrink-0" />
                Not quite — have another try!
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button
                  size="sm"
                  leftIcon={<RotateCcw aria-hidden className="size-4" />}
                  onClick={() => dispatch({ type: 'retry' })}
                >
                  Try Again
                </Button>
                {QUIZ_CONFIG.allowShowAnswer && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye aria-hidden className="size-4" />}
                    onClick={showAnswer}
                  >
                    Show Answer
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </QuizCard>
  );
}
