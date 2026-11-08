import { CircleCheck, Eye } from 'lucide-react';
import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Button } from '@/components/common/Button';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { exerciseAnswer, isGrammarChoiceRight } from '@/lib/grammar';
import { shuffle } from '@/lib/random';
import { playSfx } from '@/lib/sfx';
import { useSettingsStore } from '@/stores/settingsStore';
import type { GrammarExercise } from '@/types/models';

/** How a question ended: right at once, right after a wrong try, or the answer was shown. */
export type GrammarResult = 'first-try' | 'retry' | 'shown';

type ChoiceExercise = Extract<GrammarExercise, { kind: 'choose' | 'listen-choose' }>;

const sound = () => useSettingsStore.getState().settings.soundEnabled;

/**
 * A choice question (spec §25): pick the word for the gap ("choose") or the sentence you heard
 * ("listen-choose"). Options are shuffled once; a tap checks at once, like a quiz choice. A wrong
 * option turns yellow and is disabled; "Show Answer" appears after a wrong try.
 */
export function ChooseQuestion({
  exercise,
  onResult,
}: {
  exercise: ChoiceExercise;
  onResult: (result: GrammarResult) => void;
}) {
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const [options] = useState(() => shuffle(exercise.options));
  const [wrong, setWrong] = useState<string[]>([]);
  const [state, setState] = useState<'asking' | 'right' | 'shown'>('asking');
  const answer = exerciseAnswer(exercise);
  const done = state !== 'asking';
  const listening = exercise.kind === 'listen-choose';
  const full = exercise.kind === 'choose' ? exercise.sentence.replace('___', answer) : answer;

  const choose = (option: string) => {
    if (done || wrong.includes(option)) return;
    if (isGrammarChoiceRight(exercise, option)) {
      setState('right');
      if (sound()) playSfx('correct');
      onResult(wrong.length === 0 ? 'first-try' : 'retry');
    } else {
      setWrong((current) => [...current, option]);
      if (sound()) playSfx('wrong');
    }
  };

  const [before, after] = exercise.kind === 'choose' ? exercise.sentence.split('___') : ['', ''];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-bold text-navy-600">
        {listening ? t('Listen and choose what you hear.') : t('Choose the right word.')}
      </p>

      {listening ? (
        <div className="flex items-center gap-3">
          <AudioButton
            soundKey={`grammar-q:${exercise.id}`}
            text={exercise.sentence}
            label={t('Listen to the sentence')}
            size="lg"
            variant="brand"
          />
          <AudioButton
            soundKey={`grammar-q:${exercise.id}:slow`}
            text={exercise.sentence}
            slow
            label={t('Listen slowly')}
            variant="soft"
          />
        </div>
      ) : (
        <p lang="en" className="text-[1.5rem] leading-relaxed font-extrabold text-navy-900">
          {before}
          {done ? (
            <span
              className={cn(
                'mx-1 rounded-lg px-2',
                state === 'right' ? 'bg-leaf-50 text-leaf-700' : 'bg-coral-50 text-coral-700',
              )}
            >
              {answer}
            </span>
          ) : (
            <span className="mx-1 inline-block w-20 border-b-4 border-dashed border-brand-400 align-baseline">
              <span className="sr-only">{t('blank')}</span>
            </span>
          )}
          {after}
        </p>
      )}
      {showVietnamese && (!listening || done) && (
        <p lang="vi" className="-mt-2 font-medium text-navy-400">
          {exercise.textVi}
        </p>
      )}

      <div
        role="group"
        aria-label={t('Choices')}
        className={cn('flex gap-3', listening ? 'flex-col' : 'flex-wrap')}
      >
        {options.map((option) => {
          const tried = wrong.includes(option);
          const isAnswer = done && option === answer;
          return (
            <button
              key={option}
              type="button"
              lang="en"
              disabled={tried || done}
              onClick={() => choose(option)}
              className={cn(
                'min-h-12 rounded-xl border-2 px-4 py-2 text-left text-lg font-bold transition outline-none focus-visible:ring-4 focus-visible:ring-brand-100',
                isAnswer
                  ? 'border-leaf-500 bg-leaf-50 text-leaf-700'
                  : tried
                    ? 'animate-wiggle border-sun-400 bg-sun-50 text-navy-400 line-through'
                    : done
                      ? 'border-navy-100 bg-white text-navy-400'
                      : 'border-brand-200 bg-white text-navy-800 hover:border-brand-400 hover:bg-brand-50',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {done ? (
        <div
          role="status"
          className={cn(
            'flex items-center gap-3 rounded-2xl p-3 font-bold',
            state === 'right' ? 'bg-leaf-500 text-white' : 'bg-sun-100 text-navy-800',
          )}
        >
          <CircleCheck aria-hidden className="size-6 shrink-0" />
          <span lang="en" className="min-w-0 flex-1">
            {state === 'right' ? `${t('Right!')} ` : ''}
            {full}
          </span>
          <AudioButton
            soundKey={`grammar-a:${exercise.id}`}
            text={full}
            label={t('Listen to the sentence')}
            size="sm"
            variant="light"
          />
        </div>
      ) : (
        wrong.length > 0 && (
          <Button
            variant="ghost"
            leftIcon={<Eye aria-hidden className="size-5" />}
            onClick={() => {
              setState('shown');
              onResult('shown');
            }}
          >
            {t('Show Answer')}
          </Button>
        )
      )}
    </div>
  );
}
