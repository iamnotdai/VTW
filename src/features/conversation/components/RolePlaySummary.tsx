import { ArrowLeft, ArrowLeftRight, Minus, PencilLine, RotateCcw } from 'lucide-react';
import { paths } from '@/app/paths';
import { Button, ButtonLink } from '@/components/common/Button';
import { Pinyin } from '@/components/common/Pinyin';
import { ScoredText } from '@/components/speaking/ScoredText';
import { ScoreRing } from '@/components/speaking/ScoreRing';
import { getSpeaker } from '@/data/content';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { assetUrl } from '@/lib/assets';
import { speakingLevel } from '@/lib/speakingScore';
import type { Conversation } from '@/types/models';
import { averageLineScore, type RoleLineResult } from '../rolePlay';

/** End of a role-play: the learner's lines with their best scores, then what to do next. */
export function RolePlaySummary({
  conversation,
  role,
  results,
  canSwitch,
  onReplay,
  onChangeRole,
}: {
  conversation: Conversation;
  role: string;
  results: Readonly<Record<string, RoleLineResult>>;
  /** The conversation has another character to play. */
  canSwitch: boolean;
  onReplay: () => void;
  onChangeRole: () => void;
}) {
  const course = useCourse();
  const name = getSpeaker(role)?.name ?? role;
  const average = averageLineScore(results);
  const myLines = conversation.lines.filter((line) => line.speakerId === role);

  return (
    <section className="flex animate-pop-in flex-col items-center gap-4 rounded-[1.25rem] bg-white p-6 text-center shadow-lift sm:p-8">
      <img
        src={assetUrl('/assets/icons/celebration.webp')}
        alt=""
        aria-hidden
        className="size-24 object-contain"
      />
      <h2 className="text-3xl font-extrabold text-navy-900">{t('Role-play complete!')}</h2>
      <p className="font-medium text-navy-500">
        {t('You played {name} in “{title}”.', { name, title: conversation.title })}
      </p>
      {average !== null && (
        <div className="flex items-center gap-3">
          <ScoreRing score={average} level={speakingLevel(average)} size={84} />
          <p className="text-lg font-bold text-navy-900">{t('Average score')}</p>
        </div>
      )}

      <ol className="flex w-full flex-col gap-2 text-left">
        {myLines.map((line) => {
          const result = results[line.id];
          const best = result?.kind === 'scored' ? result.best : null;
          return (
            <li key={line.id} className="flex items-center gap-3 rounded-xl bg-mist px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[1.0625rem] font-medium text-navy-700">
                  <ScoredText text={line.text} parts={best?.parts} lang={course.lang} />
                </p>
                <Pinyin text={line.pinyin} className="mt-0.5" />
              </div>
              {best ? (
                <ScoreRing score={best.score} level={best.level} size={40} />
              ) : result?.kind === 'practiced' ? (
                <span className="shrink-0 rounded-full bg-leaf-50 px-2.5 py-1 text-sm font-bold text-leaf-700">
                  {t('Practiced')}
                </span>
              ) : (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-navy-400">
                  <Minus aria-hidden className="size-4" strokeWidth={3} />
                  <span className="sr-only">{t('Skipped')}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex w-full flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="sm:flex-1"
            leftIcon={<RotateCcw aria-hidden className="size-5" />}
            onClick={onReplay}
          >
            {t('Play again')}
          </Button>
          {canSwitch && (
            <Button
              size="lg"
              variant="secondary"
              className="sm:flex-1"
              leftIcon={<ArrowLeftRight aria-hidden className="size-5" />}
              onClick={onChangeRole}
            >
              {t('Change Character')}
            </Button>
          )}
        </div>
        <ButtonLink
          to={paths.fillBlanks(conversation.id)}
          size="lg"
          variant="warm"
          fullWidth
          leftIcon={<PencilLine aria-hidden className="size-5" />}
        >
          {t('Fill in the Blanks')}
        </ButtonLink>
        <ButtonLink
          to={paths.conversation(conversation.id)}
          size="lg"
          variant="soft"
          fullWidth
          leftIcon={<ArrowLeft aria-hidden className="size-5" strokeWidth={2.5} />}
        >
          {t('Back to the Conversation')}
        </ButtonLink>
      </div>
    </section>
  );
}
