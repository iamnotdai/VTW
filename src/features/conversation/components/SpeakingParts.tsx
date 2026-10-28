import {
  Check,
  Headphones,
  LoaderCircle,
  Mic,
  RotateCcw,
  Square,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Avatar } from '@/components/common/Avatar';
import type { SpeechStatus } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/cn';
import type { SpeechFeedbackLevel } from '@/lib/speechMatch';
import { useProfileStore } from '@/stores/profileStore';
import type { PracticeQuestion } from '@/types/models';

/** "Question 1 of 3" + listen button + the question (design screen 12). */
export function QuestionHeader({
  question,
  index,
  total,
}: {
  question: PracticeQuestion;
  index: number;
  total: number;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-base font-bold text-navy-800">
        Question {index + 1} of {total}
      </p>
      <div className="mt-3 flex items-center gap-4 text-left">
        <AudioButton
          soundKey={`prompt:${question.id}`}
          text={question.prompt}
          src={question.audio}
          label="Listen to the question"
          variant="soft"
          size="lg"
        />
        <h2 lang="en" className="text-[1.75rem] leading-snug font-extrabold text-navy-900">
          {question.prompt}
        </h2>
      </div>
    </div>
  );
}

const MIC_LABEL: Partial<Record<SpeechStatus, string>> = {
  idle: 'Tap to speak',
  result: 'Tap to speak',
  error: 'Tap to speak',
  'requesting-permission': 'Please allow the microphone…',
  listening: 'Listening… tap to stop',
  processing: 'Checking what you said…',
};

/** Big round microphone with its light-blue halo. */
export function MicButton({
  status,
  onStart,
  onStop,
  idleLabel = 'Tap to speak',
}: {
  status: SpeechStatus;
  onStart: () => void;
  onStop: () => void;
  idleLabel?: string;
}) {
  const busy = status === 'requesting-permission' || status === 'processing';
  const listening = status === 'listening';
  const label = listening || busy ? MIC_LABEL[status] : idleLabel;
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex size-44 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-full bg-brand-50" />
        <span aria-hidden className="absolute inset-5 rounded-full bg-brand-100/80" />
        {listening && (
          <span
            aria-hidden
            className="absolute inset-7 rounded-full bg-coral-400/60 motion-safe:animate-ping"
          />
        )}
        <button
          type="button"
          onClick={listening ? onStop : onStart}
          disabled={busy}
          aria-label={listening ? 'Stop listening' : idleLabel}
          className={cn(
            'relative flex size-24 items-center justify-center rounded-full text-white transition active:scale-95 disabled:opacity-80',
            listening
              ? 'bg-coral-500 shadow-[0_10px_22px_-10px_rgb(239_106_74/0.8)]'
              : 'bg-brand-500 shadow-cta hover:bg-brand-600',
          )}
        >
          {busy ? (
            <LoaderCircle aria-hidden className="size-10 motion-safe:animate-spin" />
          ) : listening ? (
            <Square aria-hidden className="size-8 fill-current" />
          ) : (
            <Mic aria-hidden className="size-10" />
          )}
        </button>
      </div>
      <p role="status" className="mt-1 min-h-7 text-lg font-bold text-navy-900">
        {label}
      </p>
    </div>
  );
}

/** The Listen & Repeat fallback in place of the microphone (spec §9.4). */
export function ListenRepeatBadge() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex size-44 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-full bg-brand-50" />
        <span aria-hidden className="absolute inset-5 rounded-full bg-brand-100/80" />
        <span className="relative flex size-24 items-center justify-center rounded-full bg-brand-500 text-white shadow-cta">
          <Headphones aria-hidden className="size-10" />
        </span>
      </div>
      <h3 className="mt-1 text-lg font-bold text-navy-900">Listen &amp; Repeat</h3>
    </div>
  );
}

/** Pale card with the sample answer and a listen button. */
export function ExampleAnswerCard({ question }: { question: PracticeQuestion }) {
  return (
    <section className="rounded-2xl bg-mist px-5 py-4">
      <h3 className="text-lg font-bold text-navy-900">Example Answer</h3>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p lang="en" className="text-[1.0625rem] font-medium text-navy-600 sm:text-lg">
          {question.suggestedAnswer}
        </p>
        <AudioButton
          soundKey={`answer:${question.id}`}
          text={question.suggestedAnswer}
          label="Listen to the example answer"
          variant="plain"
        />
      </div>
    </section>
  );
}

const FEEDBACK: Record<
  SpeechFeedbackLevel | 'practiced',
  { title: string; icon: LucideIcon; tone: string }
> = {
  great: {
    title: 'Great job! That sounds just like the example.',
    icon: Check,
    tone: 'text-leaf-600',
  },
  good: { title: 'Good! Very close to the example.', icon: Check, tone: 'text-leaf-600' },
  'try-again': {
    title: 'Let’s try again! Listen to the example, then say it slowly.',
    icon: RotateCcw,
    tone: 'text-brand-600',
  },
  practiced: { title: 'Well done for practicing!', icon: Check, tone: 'text-leaf-600' },
};

/** White card with what the learner said (or a placeholder) and the simple word-match feedback. */
export function YourAnswerCard({
  heard,
  feedback,
  placeholder,
}: {
  /** Recognized text; omitted in Listen & Repeat mode. */
  heard?: string;
  feedback?: SpeechFeedbackLevel | 'practiced';
  placeholder?: ReactNode;
}) {
  const avatar = useProfileStore((state) => state.profile?.avatar);
  const result = feedback ? FEEDBACK[feedback] : null;
  const ResultIcon = result?.icon;

  return (
    <section className="rounded-2xl bg-white px-5 py-4 shadow-soft ring-1 ring-navy-100">
      <h3 className="text-lg font-bold text-navy-900">Your Answer</h3>
      {result || heard ? (
        <>
          <div className="mt-2 flex items-center gap-3 border-b border-navy-100 pb-3">
            {avatar && <Avatar avatar={avatar} size={32} ring="brand" />}
            <p
              lang="en"
              className="min-w-0 flex-1 text-[1.0625rem] font-medium text-navy-600 sm:text-lg"
            >
              {heard ? heard : 'You said the example answer out loud.'}
            </p>
            {heard && (
              <AudioButton
                soundKey="answer:heard"
                text={heard}
                label="Listen to what we heard"
                variant="plain"
              />
            )}
          </div>
          {result && ResultIcon && (
            <div role="status">
              <h2
                className={cn(
                  'mt-3 flex items-center gap-2.5 text-[1.0625rem] font-bold',
                  result.tone,
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-white',
                    feedback === 'try-again' ? 'bg-brand-500' : 'bg-leaf-500',
                  )}
                >
                  <ResultIcon aria-hidden className="size-4" strokeWidth={3} />
                </span>
                {result.title}
              </h2>
            </div>
          )}
        </>
      ) : (
        <div className="mt-1 text-base font-medium text-navy-400">{placeholder}</div>
      )}
    </section>
  );
}

/** Honest note: this is a word match, not a pronunciation score (spec §9.4). */
export function SpeakingNote() {
  return (
    <p className="text-center text-xs font-medium text-navy-400">
      We check the words we heard — not your pronunciation. Nothing is recorded or saved.
    </p>
  );
}
