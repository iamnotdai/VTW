import { ArrowRight, CircleCheck, Flag, Mic, MicOff, RotateCcw, SkipForward } from 'lucide-react';
import { useMemo } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Button } from '@/components/common/Button';
import { ListenToYourselfButton } from '@/components/speaking/ListenToYourselfButton';
import { ListenRepeatBadge, MicButton } from '@/components/speaking/MicButton';
import { SpeakingFeedback } from '@/components/speaking/SpeakingFeedback';
import { isBlockingSpeechError, speechErrorText } from '@/components/speaking/speechErrorText';
import { getSpeaker } from '@/data/content';
import { useCourse } from '@/hooks/useCourse';
import { useScoreReport } from '@/hooks/useScoreReport';
import { useSpeakingAttempt } from '@/hooks/useSpeakingAttempt';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { SpeakingScore, SpeakingTarget } from '@/lib/speakingScore';
import type { DialogueLine } from '@/types/models';

interface RolePlayTurnProps {
  line: DialogueLine;
  /** The conversation's last line: "Continue" becomes "Finish". */
  last: boolean;
  listenMode: boolean;
  onListenModeChange: (listenMode: boolean) => void;
  onScore: (score: SpeakingScore) => void;
  /** Moves on; `practiced` = Listen & Repeat, `skipped` = no try. */
  onContinue: (result?: 'practiced' | 'skipped') => void;
}

/**
 * The learner's turn in Role-play (spec §9.5): listen to the line if needed, tap the microphone and
 * say it, see the score, then try again or continue. Without a microphone: Listen & Repeat.
 */
export function RolePlayTurn({
  line,
  last,
  listenMode,
  onListenModeChange,
  onScore,
  onContinue,
}: RolePlayTurnProps) {
  const course = useCourse();
  const target = useMemo<SpeakingTarget>(() => ({ text: line.text, kind: 'sentence' }), [line]);
  const attempt = useSpeakingAttempt(target);
  const { score } = attempt;
  const voice = getSpeaker(line.speakerId)?.voice;
  useScoreReport(attempt, onScore);

  const error = attempt.status === 'error' ? attempt.error : null;
  const blocked = isBlockingSpeechError(error);
  const fallback = !attempt.supported || blocked || listenMode;
  const showResult = !fallback && attempt.status === 'result' && score;
  const listening = attempt.status === 'listening' || attempt.status === 'processing';
  const continueIcon = last ? (
    <Flag aria-hidden className="size-5" />
  ) : (
    <ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />
  );

  return (
    <section
      aria-label={t('Your turn')}
      className="flex animate-slide-up flex-col gap-4 rounded-2xl bg-white p-5 shadow-lift ring-1 ring-navy-100 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-navy-900">{t('Your turn!')}</h2>
        <div className="flex items-center gap-2">
          <AudioButton
            soundKey={`turn:${line.id}`}
            text={line.text}
            src={line.audio}
            pitch={voice?.pitch}
            rate={voice?.rate}
            label={t('Listen to your line')}
            variant="soft"
          />
          <AudioButton
            soundKey={`turn-slow:${line.id}`}
            text={line.text}
            src={line.audio}
            pitch={voice?.pitch}
            slow
            label={t('Listen slowly')}
            variant="soft"
          />
          {attempt.recordingUrl && !listening && (
            <ListenToYourselfButton url={attempt.recordingUrl} />
          )}
        </div>
      </div>

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
          <p className="text-center font-medium text-navy-500">
            {t('Listen to your line, say it out loud, then tap “I said it!”.')}
          </p>
          <Button
            size="lg"
            variant="success"
            fullWidth
            leftIcon={<CircleCheck aria-hidden className="size-5" />}
            onClick={() => onContinue('practiced')}
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
        <div className="flex flex-col gap-4">
          <SpeakingFeedback score={score} compact />
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
            <Button
              size="lg"
              variant={score.level === 'try-again' ? 'secondary' : last ? 'success' : 'primary'}
              className={cn(score.level !== 'try-again' && 'order-first min-[30rem]:order-0')}
              rightIcon={continueIcon}
              onClick={() => onContinue()}
            >
              {last ? t('Finish') : t('Continue')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <MicButton
            size="md"
            status={attempt.status}
            onStart={attempt.start}
            onStop={attempt.stop}
            idleLabel={t('Tap and say your line')}
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
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<SkipForward aria-hidden className="size-4" />}
              onClick={() => onContinue('skipped')}
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
    </section>
  );
}
