import { Check, RotateCcw, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Avatar } from '@/components/common/Avatar';
import { Pinyin } from '@/components/common/Pinyin';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
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
  const course = useCourse();
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-base font-bold text-navy-800">
        {t('Question {number} of {total}', { number: index + 1, total })}
      </p>
      <div className="mt-3 flex items-center gap-4 text-left">
        <AudioButton
          soundKey={`prompt:${question.id}`}
          text={question.prompt}
          src={question.audio}
          label={t('Listen to the question')}
          variant="soft"
          size="lg"
        />
        <div>
          <h2
            lang={course.lang}
            className="text-[1.75rem] leading-snug font-extrabold text-navy-900"
          >
            {question.prompt}
          </h2>
          <Pinyin text={question.promptPinyin} className="mt-0.5" />
        </div>
      </div>
    </div>
  );
}

/** Pale card with the sample answer and a listen button. */
export function ExampleAnswerCard({ question }: { question: PracticeQuestion }) {
  const course = useCourse();
  return (
    <section className="rounded-2xl bg-mist px-5 py-4">
      <h3 className="text-lg font-bold text-navy-900">{t('Example Answer')}</h3>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div>
          <p lang={course.lang} className="text-[1.0625rem] font-medium text-navy-600 sm:text-lg">
            {question.suggestedAnswer}
          </p>
          <Pinyin text={question.suggestedAnswerPinyin} className="mt-0.5" />
        </div>
        <AudioButton
          soundKey={`answer:${question.id}`}
          text={question.suggestedAnswer}
          label={t('Listen to the example answer')}
          variant="plain"
        />
      </div>
    </section>
  );
}

/** `title` is a function, so the copy is looked up in the active course when it is shown. */
const FEEDBACK: Record<
  SpeechFeedbackLevel | 'practiced',
  { title: () => string; icon: LucideIcon; tone: string }
> = {
  great: {
    title: () => t('Great job! That sounds just like the example.'),
    icon: Check,
    tone: 'text-leaf-600',
  },
  good: { title: () => t('Good! Very close to the example.'), icon: Check, tone: 'text-leaf-600' },
  'try-again': {
    title: () => t('Let’s try again! Listen to the example, then say it slowly.'),
    icon: RotateCcw,
    tone: 'text-brand-600',
  },
  practiced: { title: () => t('Well done for practicing!'), icon: Check, tone: 'text-leaf-600' },
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
  const course = useCourse();
  const avatar = useProfileStore((state) => state.profile?.avatar);
  const result = feedback ? FEEDBACK[feedback] : null;
  const ResultIcon = result?.icon;

  return (
    <section className="rounded-2xl bg-white px-5 py-4 shadow-soft ring-1 ring-navy-100">
      <h3 className="text-lg font-bold text-navy-900">{t('Your Answer')}</h3>
      {result || heard ? (
        <>
          <div className="mt-2 flex items-center gap-3 border-b border-navy-100 pb-3">
            {avatar && <Avatar avatar={avatar} size={32} ring="brand" />}
            <p
              lang={course.lang}
              className="min-w-0 flex-1 text-[1.0625rem] font-medium text-navy-600 sm:text-lg"
            >
              {heard ? heard : t('You said the example answer out loud.')}
            </p>
            {heard && (
              <AudioButton
                soundKey="answer:heard"
                text={heard}
                label={t('Listen to what we heard')}
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
                {result.title()}
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
      {t('We check the words we heard — not your pronunciation. Nothing is recorded or saved.')}
    </p>
  );
}
