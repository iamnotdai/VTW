import { CircleCheck, Info, Mic, MicOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { paths, type NavigationState } from '@/app/paths';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { ListenRepeatBadge, MicButton } from '@/components/speaking/MicButton';
import { speechErrorText } from '@/components/speaking/speechErrorText';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { t } from '@/i18n';
import { useProgressStore } from '@/stores/progressStore';
import type { Conversation } from '@/types/models';
import {
  ExampleAnswerCard,
  QuestionHeader,
  SpeakingNote,
  YourAnswerCard,
} from '../components/SpeakingParts';
import { practiceCrumbs } from '../speakingCopy';
import { useSpeakingSessionStore } from '../speakingSession';
import { useConversationParam } from '../useConversationParam';

/** Screen 12 — Speaking Practice (`/conversation/:conversationId/practice`). */
export function SpeakingPracticePage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <SpeakingPractice key={params.conversation.id} {...params} />;
}

const FROM_PRACTICE: NavigationState = { from: 'practice' };

const listenSteps = () => [
  t('Tap the speaker next to “Example Answer” and listen.'),
  t('Say the sentence out loud, slowly and clearly.'),
  t('When you are ready, tap “Mark as Practiced”.'),
];

function SpeakingPractice({ conversation }: { conversation: Conversation }) {
  useDocumentTitle(t('{title} · Speaking', { title: conversation.title }));
  const navigate = useNavigate();
  const begin = useSpeakingSessionStore((state) => state.begin);
  const setResult = useSpeakingSessionStore((state) => state.setResult);
  const questionIndex = useSpeakingSessionStore((state) =>
    state.conversationId === conversation.id ? state.questionIndex : 0,
  );
  const completeConversation = useProgressStore((state) => state.completeConversation);
  const speech = useSpeechRecognition();
  const [listenMode, setListenMode] = useState(false);

  useEffect(() => begin(conversation.id), [begin, conversation.id]);

  const questions = conversation.practiceQuestions;
  const question = questions[Math.min(questionIndex, questions.length - 1)];

  // Recognized something → show the Speaking Result screen.
  const { status, alternatives, reset } = speech;
  useEffect(() => {
    if (status !== 'result' || !question) return;
    setResult({ questionId: question.id, mode: 'speech', heard: alternatives });
    reset();
    navigate(paths.practiceResult(conversation.id), { state: FROM_PRACTICE });
  }, [status, alternatives, question, setResult, reset, navigate, conversation.id]);

  const breadcrumbs = practiceCrumbs(conversation);

  if (!question) {
    return (
      <>
        <TopBar>
          <Breadcrumb items={breadcrumbs} />
        </TopBar>
        <PageContainer width="narrow">
          <h1 className="sr-only">{t('Speaking Practice')}</h1>
          <EmptyState
            icon={<Mic aria-hidden />}
            title={t('No speaking questions yet')}
            message={t('You can still mark this conversation as done.')}
            actions={
              <Button
                onClick={() => {
                  completeConversation(conversation.id);
                  navigate(paths.conversation(conversation.id), {
                    replace: true,
                    state: { completed: true },
                  });
                }}
              >
                {t('Mark as Completed')}
              </Button>
            }
          />
        </PageContainer>
      </>
    );
  }

  const blockingError = speech.status === 'error' && speech.error !== 'no-speech';
  const showFallback = !speech.supported || blockingError || listenMode;

  const markPracticed = () => {
    setResult({ questionId: question.id, mode: 'practiced' });
    navigate(paths.practiceResult(conversation.id), { state: FROM_PRACTICE });
  };

  return (
    <>
      <TopBar>
        <Breadcrumb items={breadcrumbs} />
      </TopBar>
      {/* The content starts under the folded menu card, as in the design. */}
      <div className="md:pt-20">
        <PageContainer width="narrow" className="flex flex-col gap-5">
          <h1 className="sr-only">{t('Speaking Practice')}</h1>
          <QuestionHeader question={question} index={questionIndex} total={questions.length} />

          {showFallback ? (
            <>
              <ListenRepeatBadge />
              {speech.status === 'error' && speech.error && (
                <p
                  role="alert"
                  className="flex items-start justify-center gap-2 text-center font-semibold text-navy-700"
                >
                  <MicOff aria-hidden className="mt-0.5 size-5 shrink-0 text-coral-500" />
                  {speechErrorText(speech.error)}
                </p>
              )}
              {!speech.supported && (
                <p className="flex items-start justify-center gap-2 text-center font-semibold text-navy-700">
                  <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-500" />
                  {t(
                    'This browser can’t listen to your voice, so let’s practice by listening and repeating.',
                  )}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <MicButton status={speech.status} onStart={speech.start} onStop={speech.stop} />
              {speech.status === 'error' && speech.error === 'no-speech' && (
                <p role="alert" className="text-center font-semibold text-navy-600">
                  {speechErrorText('no-speech')}
                </p>
              )}
            </div>
          )}

          <ExampleAnswerCard question={question} />
          <YourAnswerCard
            heard={
              speech.transcript && (speech.status === 'listening' || speech.status === 'processing')
                ? speech.transcript
                : undefined
            }
            placeholder={
              showFallback ? (
                <ol className="list-inside list-decimal space-y-0.5">
                  {listenSteps().map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : (
                t('Tap the microphone and say your answer.')
              )
            }
          />

          {showFallback ? (
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                variant="success"
                fullWidth
                leftIcon={<CircleCheck aria-hidden className="size-5" />}
                onClick={markPracticed}
              >
                {t('Mark as Practiced')}
              </Button>
              {speech.supported && (
                <Button
                  variant="ghost"
                  leftIcon={<Mic aria-hidden className="size-5" />}
                  onClick={() => {
                    setListenMode(false);
                    speech.reset();
                  }}
                >
                  {t('Use the microphone')}
                </Button>
              )}
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setListenMode(true)}>
              {t('Can’t use the microphone? Listen & Repeat instead')}
            </Button>
          )}
          <SpeakingNote />
        </PageContainer>
      </div>
    </>
  );
}
