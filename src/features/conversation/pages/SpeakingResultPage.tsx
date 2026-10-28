import { ArrowRight, Flag, MicOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { getNavigationState, paths } from '@/app/paths';
import { Button } from '@/components/common/Button';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { getSpeechFeedbackLevel, scoreSpeechMatch } from '@/lib/speechMatch';
import { useProgressStore } from '@/stores/progressStore';
import type { Conversation } from '@/types/models';
import {
  ExampleAnswerCard,
  ListenRepeatBadge,
  MicButton,
  QuestionHeader,
  SpeakingNote,
  YourAnswerCard,
} from '../components/SpeakingParts';
import { practiceCrumbs, SPEECH_ERROR_TEXT } from '../speakingCopy';
import { useSpeakingSessionStore } from '../speakingSession';
import { useConversationParam } from '../useConversationParam';

/** Screen 13 — Speaking Result (`/conversation/:conversationId/practice/result`). */
export function SpeakingResultPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <SpeakingResult key={params.conversation.id} conversation={params.conversation} />;
}

/**
 * Same screen as the practice question (design screen 12), now with "Your Answer" and the simple
 * word-match feedback. Tapping the microphone again replaces the answer in place.
 */
function SpeakingResult({ conversation }: { conversation: Conversation }) {
  useDocumentTitle(`${conversation.title} · Result`);
  const navigate = useNavigate();
  const location = useLocation();
  const navState = getNavigationState(location.state);
  const completeConversation = useProgressStore((state) => state.completeConversation);
  const setResult = useSpeakingSessionStore((state) => state.setResult);
  const liveConversationId = useSpeakingSessionStore((state) => state.conversationId);
  const liveIndex = useSpeakingSessionStore((state) => state.questionIndex);
  const liveResult = useSpeakingSessionStore((state) => state.result);
  const speech = useSpeechRecognition();
  // Frozen when the learner leaves (Next / Finish), so the moving session can't change the screen.
  const [frozen, setFrozen] = useState<{
    questionIndex: number;
    result: NonNullable<typeof liveResult>;
  } | null>(null);
  const view =
    frozen ??
    (liveConversationId === conversation.id && liveResult
      ? { questionIndex: liveIndex, result: liveResult }
      : null);

  const questions = conversation.practiceQuestions;
  const questionIndex = view?.questionIndex ?? 0;
  const question = view ? questions[questionIndex] : undefined;

  // Trying again from this screen: the new answer replaces the old one.
  const { status, alternatives, reset } = speech;
  useEffect(() => {
    if (status !== 'result' || !question) return;
    setResult({ questionId: question.id, mode: 'speech', heard: alternatives });
    reset();
  }, [status, alternatives, question, setResult, reset]);

  if (!view || !question) {
    return <Navigate to={paths.practice(conversation.id)} replace />;
  }

  const { result } = view;
  const match =
    result.mode === 'speech'
      ? scoreSpeechMatch(question.suggestedAnswer, result.heard ?? [])
      : null;
  const feedback = match ? getSpeechFeedbackLevel(match.score) : 'practiced';
  const isLast = questionIndex >= questions.length - 1;
  const micBlocked = speech.status === 'error' && speech.error !== 'no-speech';

  const nextQuestion = () => {
    setFrozen(view);
    useSpeakingSessionStore.getState().next();
    if (navState.from === 'practice') navigate(-1);
    else navigate(paths.practice(conversation.id), { replace: true });
  };

  const finish = () => {
    setFrozen(view);
    completeConversation(conversation.id);
    useSpeakingSessionStore.getState().reset();
    navigate(paths.conversation(conversation.id), { replace: true, state: { completed: true } });
  };

  return (
    <>
      <TopBar>
        <Breadcrumb items={practiceCrumbs(conversation)} />
      </TopBar>
      <div className="md:pt-20">
        <PageContainer width="narrow" className="flex flex-col gap-5">
          <h1 className="sr-only">Speaking Result</h1>
          <QuestionHeader question={question} index={questionIndex} total={questions.length} />

          {speech.supported && !micBlocked ? (
            <div className="flex flex-col items-center gap-2">
              <MicButton
                status={speech.status}
                onStart={speech.start}
                onStop={speech.stop}
                idleLabel="Tap to speak again"
              />
              {speech.status === 'error' && speech.error === 'no-speech' && (
                <p role="alert" className="text-center font-semibold text-navy-600">
                  {SPEECH_ERROR_TEXT['no-speech']}
                </p>
              )}
            </div>
          ) : (
            <>
              <ListenRepeatBadge />
              {micBlocked && speech.error && (
                <p
                  role="alert"
                  className="flex items-start justify-center gap-2 text-center font-semibold text-navy-700"
                >
                  <MicOff aria-hidden className="mt-0.5 size-5 shrink-0 text-coral-500" />
                  {SPEECH_ERROR_TEXT[speech.error]}
                </p>
              )}
            </>
          )}

          <ExampleAnswerCard question={question} />
          <YourAnswerCard heard={match?.heard} feedback={feedback} />

          {isLast ? (
            <Button
              size="lg"
              variant="success"
              fullWidth
              rightIcon={<Flag aria-hidden className="size-5" />}
              onClick={finish}
            >
              Finish Lesson
            </Button>
          ) : (
            <Button
              size="lg"
              fullWidth
              rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
              onClick={nextQuestion}
            >
              Next Question
            </Button>
          )}
          <SpeakingNote />
        </PageContainer>
      </div>
    </>
  );
}
