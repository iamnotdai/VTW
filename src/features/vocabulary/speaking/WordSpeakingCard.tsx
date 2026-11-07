import {
  ArrowRight,
  CircleCheck,
  Flag,
  Info,
  Mic,
  MicOff,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { useMemo } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Button } from '@/components/common/Button';
import { ListenToYourselfButton } from '@/components/speaking/ListenToYourselfButton';
import { ListenRepeatBadge, MicButton } from '@/components/speaking/MicButton';
import { ScoredText } from '@/components/speaking/ScoredText';
import { SpeakingFeedback } from '@/components/speaking/SpeakingFeedback';
import { isBlockingSpeechError, speechErrorText } from '@/components/speaking/speechErrorText';
import { useCourse } from '@/hooks/useCourse';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useScoreReport } from '@/hooks/useScoreReport';
import { useSpeakingAttempt } from '@/hooks/useSpeakingAttempt';
import { t } from '@/i18n';
import { assetUrl } from '@/lib/assets';
import type { SpeakingTarget } from '@/lib/speakingScore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Word } from '@/types/models';

interface WordSpeakingCardProps {
  word: Word;
  /** Last word of the round: "Next word" becomes "Finish". */
  last: boolean;
  /** The learner chose Listen & Repeat instead of the microphone. */
  listenMode: boolean;
  onListenModeChange: (listenMode: boolean) => void;
  /** Every score of this word (the session keeps the best). */
  onScore: (score: number) => void;
  onNext: () => void;
  onSkip: () => void;
  /** Listen & Repeat: the learner said the word out loud. */
  onPracticed: () => void;
}

const listenSteps = () => [
  t('Tap the speaker and listen.'),
  t('Say the word out loud, slowly and clearly.'),
  t('When you are ready, tap “I said it!”.'),
];

/**
 * One word of Word Speaking (spec §7.7): picture, word, IPA (pinyin), meaning, listen / listen
 * slowly / listen to yourself, the microphone, then the score with every sound coloured.
 */
export function WordSpeakingCard({
  word,
  last,
  listenMode,
  onListenModeChange,
  onScore,
  onNext,
  onSkip,
  onPracticed,
}: WordSpeakingCardProps) {
  const course = useCourse();
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  // A smaller microphone on phones keeps it above the bottom menu.
  const wide = useMediaQuery('(min-width: 40rem)');
  const target = useMemo<SpeakingTarget>(
    () => ({
      text: word.text,
      kind: 'word',
      variants: [...word.acceptedAnswers, ...(word.soundsLike ?? [])],
    }),
    [word],
  );
  const attempt = useSpeakingAttempt(target);
  const { score } = attempt;

  useScoreReport(attempt, (result) => onScore(result.score));

  const error = attempt.status === 'error' ? attempt.error : null;
  const blocked = isBlockingSpeechError(error);
  const fallback = !attempt.supported || blocked || listenMode;
  const showResult = !fallback && attempt.status === 'result' && score;
  const listening = attempt.status === 'listening' || attempt.status === 'processing';
  const pronunciation = word.pinyin ?? word.ipa;

  return (
    <article
      aria-label={t('Say the word: {word}', { word: word.text })}
      className="flex w-full animate-pop-in flex-col rounded-[1.25rem] bg-white px-5 pt-5 pb-6 shadow-lift sm:px-8 sm:pt-6"
    >
      <div className="flex h-36 items-center justify-center rounded-2xl bg-stone sm:h-44">
        <img
          src={assetUrl(word.image)}
          alt=""
          className="max-h-[86%] max-w-[72%] object-contain drop-shadow-[0_12px_14px_rgb(16_40_100/0.18)]"
          draggable={false}
        />
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <h2 className="text-[2.75rem] leading-tight font-extrabold wrap-break-word text-navy-900 sm:text-[3.25rem]">
          <ScoredText text={word.text} parts={showResult ? score.parts : null} lang={course.lang} />
        </h2>
        {pronunciation && (
          <p
            lang={word.pinyin ? 'zh-Latn-pinyin' : undefined}
            className="mt-1 text-lg font-medium text-navy-400"
          >
            {pronunciation}
          </p>
        )}
        {showVietnamese && (
          <p lang="vi" className="mt-1 text-lg font-semibold text-coral-600">
            {word.meaningVi}
          </p>
        )}
        <div className="mt-3 flex items-center justify-center gap-3">
          <AudioButton
            soundKey={`speak:${word.id}`}
            text={word.text}
            src={word.audio}
            label={t('Listen to “{word}”', { word: word.text })}
            variant="soft"
          />
          <AudioButton
            soundKey={`speak-slow:${word.id}`}
            text={word.text}
            src={word.audio}
            slow
            label={t('Listen slowly')}
            variant="soft"
          />
          {attempt.recordingUrl && !listening && (
            <ListenToYourselfButton url={attempt.recordingUrl} />
          )}
        </div>
      </div>

      <hr className="my-5 border-navy-100" />

      {fallback ? (
        <div className="flex flex-col items-center gap-3">
          <ListenRepeatBadge size="md" />
          {blocked && error && (
            <p
              role="alert"
              className="flex items-start justify-center gap-2 text-center font-semibold text-navy-700"
            >
              <MicOff aria-hidden className="mt-0.5 size-5 shrink-0 text-coral-500" />
              {speechErrorText(error)}
            </p>
          )}
          {!attempt.supported && (
            <p className="flex items-start justify-center gap-2 text-center font-semibold text-navy-700">
              <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-500" />
              {t(
                'This browser can’t listen to your voice, so let’s practice by listening and repeating.',
              )}
            </p>
          )}
          <ol className="list-inside list-decimal space-y-0.5 text-base font-medium text-navy-500">
            {listenSteps().map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Button
            size="lg"
            variant="success"
            fullWidth
            leftIcon={<CircleCheck aria-hidden className="size-5" />}
            onClick={onPracticed}
          >
            {t('I said it!')}
          </Button>
          {attempt.supported && (
            <Button
              variant="ghost"
              leftIcon={<Mic aria-hidden className="size-5" />}
              onClick={() => {
                onListenModeChange(false);
                attempt.reset();
              }}
            >
              {t('Use the microphone')}
            </Button>
          )}
        </div>
      ) : showResult ? (
        <div className="flex flex-col gap-5">
          <SpeakingFeedback score={score} />
          {/* Side by side from 480px; stacked on phones with the main action on top. */}
          <div className="flex flex-col gap-3 min-[30rem]:grid min-[30rem]:grid-cols-2">
            <Button
              size="lg"
              variant={score.level === 'try-again' ? 'primary' : 'secondary'}
              leftIcon={<RotateCcw aria-hidden className="size-5" />}
              onClick={attempt.start}
            >
              {t('Try Again')}
            </Button>
            {score.level === 'try-again' ? (
              <Button
                size="lg"
                variant="secondary"
                rightIcon={<SkipForward aria-hidden className="size-5" />}
                onClick={onSkip}
              >
                {t('Skip')}
              </Button>
            ) : (
              <Button
                size="lg"
                variant={last ? 'success' : 'primary'}
                className="order-first min-[30rem]:order-0"
                rightIcon={
                  last ? (
                    <Flag aria-hidden className="size-5" />
                  ) : (
                    <ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />
                  )
                }
                onClick={onNext}
              >
                {last ? t('Finish') : t('Next Word')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <MicButton
            size={wide ? 'lg' : 'md'}
            status={attempt.status}
            onStart={attempt.start}
            onStop={attempt.stop}
            idleLabel={t('Tap and say the word')}
          />
          {listening && attempt.transcript && (
            <p lang={course.lang} className="text-center text-lg font-medium text-navy-500">
              “{attempt.transcript}”
            </p>
          )}
          {error === 'no-speech' && (
            <p role="alert" className="text-center font-semibold text-navy-600">
              {speechErrorText('no-speech')}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<SkipForward aria-hidden className="size-4" />}
              onClick={onSkip}
            >
              {t('Skip')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Stop listening first: a late result must not land on the Listen & Repeat panel.
                attempt.reset();
                onListenModeChange(true);
              }}
            >
              {t('No microphone? Listen & Repeat')}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
