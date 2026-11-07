import { ArrowLeft, Check, Minus, RotateCcw, Search, Target } from 'lucide-react';
import { Button, ButtonLink } from '@/components/common/Button';
import { ScoreRing } from '@/components/speaking/ScoreRing';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { speakingLevel } from '@/lib/speakingScore';
import type { Word } from '@/types/models';
import {
  summarizeWordSpeaking,
  trickyWordIds,
  type WordSpeakingResult,
} from './wordSpeakingSession';

const PILL_TONE = {
  great: 'bg-leaf-50 text-leaf-700',
  good: 'bg-sun-100 text-sun-700',
  'try-again': 'bg-coral-50 text-coral-700',
} as const;

function ResultPill({ result }: { result: WordSpeakingResult | undefined }) {
  if (result?.kind === 'scored') {
    return (
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-sm font-extrabold tabular-nums',
          PILL_TONE[speakingLevel(result.score)],
        )}
      >
        {result.score}
      </span>
    );
  }
  if (result?.kind === 'practiced') {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
        <Check aria-hidden className="size-4" strokeWidth={3} />
        <span className="sr-only">{t('Practiced')}</span>
      </span>
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-400">
      <Minus aria-hidden className="size-4" strokeWidth={3} />
      <span className="sr-only">{t('Skipped')}</span>
    </span>
  );
}

export interface SummaryLink {
  to: string;
  label: string;
}

/** End of a Word Speaking round: average score, every word's best result, what to do next. */
export function WordSpeakingSummary({
  words,
  results,
  explore,
  back,
  onRestart,
}: {
  words: readonly Word[];
  results: Readonly<Record<string, WordSpeakingResult>>;
  /** "Explore the scene", for a scene's round. */
  explore?: SummaryLink;
  /** Where the last button leads (the overview, the Pronunciation menu, the sound card). */
  back: SummaryLink;
  /** Starts a new round with these word ids. */
  onRestart: (wordIds: string[]) => void;
}) {
  const course = useCourse();
  const wordIds = words.map((word) => word.id);
  const summary = summarizeWordSpeaking(results, wordIds);
  const tricky = trickyWordIds(results, wordIds);
  const trickyFirst = tricky.length > 0 && tricky.length < wordIds.length;

  return (
    <section className="flex w-full animate-pop-in flex-col items-center gap-4 rounded-[1.25rem] bg-white p-6 text-center shadow-lift sm:p-8">
      <img
        src={assetUrl('/assets/icons/celebration.webp')}
        alt=""
        aria-hidden
        className="size-24 object-contain"
      />
      <h2 className="text-3xl font-extrabold text-navy-900">{t('Speaking practice done!')}</h2>
      {summary.average !== null ? (
        <div className="flex items-center gap-4">
          <ScoreRing score={summary.average} level={speakingLevel(summary.average)} size={88} />
          <div className="text-left">
            <p className="text-lg font-bold text-navy-900">{t('Average score')}</p>
            <p className="font-medium text-navy-500">
              {t('{great} excellent · {good} almost · {tryAgain} to practice', {
                great: summary.great,
                good: summary.good,
                tryAgain: summary.tryAgain + summary.skipped,
              })}
            </p>
          </div>
        </div>
      ) : (
        <p className="max-w-sm font-medium text-navy-500">
          {t('Well done for saying every word out loud!')}
        </p>
      )}

      <ul className="grid w-full grid-cols-1 gap-2 min-[30rem]:grid-cols-2 sm:grid-cols-3">
        {words.map((word) => (
          <li
            key={word.id}
            className="flex items-center gap-2 rounded-xl bg-mist py-1.5 pr-2 pl-1.5 text-left"
          >
            <img
              src={assetUrl(word.image)}
              alt=""
              className="size-9 shrink-0 rounded-lg bg-white object-contain p-0.5"
              draggable={false}
            />
            <span lang={course.lang} className="min-w-0 flex-1 truncate font-bold text-navy-800">
              {word.text}
            </span>
            <ResultPill result={results[word.id]} />
          </li>
        ))}
      </ul>

      <div className="mt-2 flex w-full flex-col gap-3">
        {trickyFirst && (
          <Button
            size="lg"
            fullWidth
            leftIcon={<Target aria-hidden className="size-5" />}
            onClick={() => onRestart(tricky)}
          >
            <span className="leading-tight whitespace-normal">
              {t('Practice the Tricky Words ({count})', { count: tricky.length })}
            </span>
          </Button>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {explore && (
            <ButtonLink
              to={explore.to}
              size="lg"
              variant={trickyFirst ? 'secondary' : 'primary'}
              className="sm:grow"
              leftIcon={<Search aria-hidden className="size-5" />}
            >
              <span className="leading-tight whitespace-normal">{explore.label}</span>
            </ButtonLink>
          )}
          <Button
            size="lg"
            variant={explore || trickyFirst ? 'secondary' : 'primary'}
            className="sm:grow"
            leftIcon={<RotateCcw aria-hidden className="size-5" />}
            onClick={() => onRestart(wordIds)}
          >
            {t('Practice All Words Again')}
          </Button>
        </div>
        <ButtonLink
          to={back.to}
          size="lg"
          variant="soft"
          fullWidth
          leftIcon={<ArrowLeft aria-hidden className="size-5" strokeWidth={2.5} />}
        >
          {back.label}
        </ButtonLink>
      </div>
    </section>
  );
}
