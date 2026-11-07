import { CircleCheck, RotateCcw, ThumbsUp, type LucideIcon } from 'lucide-react';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { SpeakingLevel, SpeakingScore } from '@/lib/speakingScore';
import { ScoreRing } from './ScoreRing';

/** Functions, so the copy is looked up in the active course when it is shown. */
const LEVEL_COPY: Record<
  SpeakingLevel,
  { title: () => string; message: () => string; icon: LucideIcon; tone: string }
> = {
  great: {
    title: () => t('Excellent!'),
    message: () => t('That sounded clear and right.'),
    icon: CircleCheck,
    tone: 'text-leaf-600',
  },
  good: {
    title: () => t('Almost there!'),
    message: () => t('Very close! Listen again and practice the colored parts.'),
    icon: ThumbsUp,
    tone: 'text-sun-700',
  },
  'try-again': {
    title: () => t('Let’s try again!'),
    message: () => t('Listen to the example, then say it slowly and clearly.'),
    icon: RotateCcw,
    tone: 'text-coral-600',
  },
};

/** Score ring, a friendly verdict and what the recognizer heard (spec §7.7, §9.5). */
export function SpeakingFeedback({
  score,
  compact = false,
  className,
}: {
  score: SpeakingScore;
  compact?: boolean;
  className?: string;
}) {
  const course = useCourse();
  const copy = LEVEL_COPY[score.level];
  const Icon = copy.icon;
  return (
    <div role="status" className={cn('flex items-start gap-4', className)}>
      <ScoreRing score={score.score} level={score.level} size={compact ? 56 : 72} />
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            'flex items-center gap-2 font-extrabold',
            compact ? 'text-lg' : 'text-xl',
            copy.tone,
          )}
        >
          <Icon aria-hidden className="size-5 shrink-0" strokeWidth={2.5} />
          {copy.title()}
        </h3>
        <p className="text-[15px] font-medium text-navy-500">{copy.message()}</p>
        {score.toneHint && (
          <p className="mt-0.5 text-[15px] font-semibold text-sun-700">
            {t('Check the tones of the yellow characters.')}
          </p>
        )}
        <p className="mt-1.5 text-[15px] text-navy-600">
          <span className="font-bold text-navy-800">{t('We heard:')}</span>{' '}
          <span lang={course.lang} className="font-medium">
            {score.heard}
          </span>
        </p>
      </div>
    </div>
  );
}

/** Honest note under the speaking screens (spec §9.4). */
export function SpeakingScoreNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-center text-xs font-medium text-navy-400', className)}>
      {t(
        'The score is a guide based on what the browser heard — not a full pronunciation test. Recordings are never saved.',
      )}
    </p>
  );
}
