import { CircleCheck, Eye, PencilLine } from 'lucide-react';
import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Button } from '@/components/common/Button';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { isOrderRight, shuffledTiles } from '@/lib/grammar';
import { playSfx } from '@/lib/sfx';
import { useSettingsStore } from '@/stores/settingsStore';
import type { GrammarExercise } from '@/types/models';
import type { GrammarResult } from './ChooseQuestion';

type OrderExercise = Extract<GrammarExercise, { kind: 'order' }>;

/**
 * "Put the words in order" (spec §25): writing without typing. Tap the shuffled words in order
 * (tap a placed word to take it back), then Check. Works with touch and the keyboard — no drag.
 */
export function OrderQuestion({
  exercise,
  onResult,
}: {
  exercise: OrderExercise;
  onResult: (result: GrammarResult) => void;
}) {
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const [tiles] = useState(() => shuffledTiles(exercise.sentence));
  const [placed, setPlaced] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [state, setState] = useState<'asking' | 'wrong' | 'right' | 'shown'>('asking');
  const done = state === 'right' || state === 'shown';
  const textOf = (id: number) => tiles.find((tile) => tile.id === id)?.text ?? '';

  const place = (id: number) => {
    if (done || placed.includes(id)) return;
    setPlaced((current) => [...current, id]);
    setState('asking');
  };
  const takeBack = (id: number) => {
    if (done) return;
    setPlaced((current) => current.filter((item) => item !== id));
    setState('asking');
  };
  const check = () => {
    const sound = useSettingsStore.getState().settings.soundEnabled;
    if (isOrderRight(exercise.sentence, placed.map(textOf))) {
      setState('right');
      if (sound) playSfx('correct');
      onResult(tries === 0 ? 'first-try' : 'retry');
    } else {
      setTries((value) => value + 1);
      setState('wrong');
      if (sound) playSfx('wrong');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-bold text-navy-600">{t('Put the words in order.')}</p>
      {showVietnamese && (
        <p lang="vi" className="-mt-2 text-lg font-semibold text-navy-800">
          {exercise.textVi}
        </p>
      )}

      <div
        aria-label={t('Your sentence')}
        role="group"
        className={cn(
          'flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3',
          state === 'right'
            ? 'border-leaf-500 bg-leaf-50'
            : state === 'wrong'
              ? 'border-sun-400 bg-sun-50'
              : 'border-brand-300 bg-white',
        )}
      >
        {done ? (
          <span lang="en" className="text-xl font-extrabold text-navy-900">
            {exercise.sentence}
          </span>
        ) : placed.length === 0 ? (
          <span className="font-semibold text-navy-400">{t('Tap the words below.')}</span>
        ) : (
          placed.map((id) => (
            <button
              key={id}
              type="button"
              lang="en"
              onClick={() => takeBack(id)}
              aria-label={t('Take back “{word}”', { word: textOf(id) })}
              className="min-h-11 rounded-xl bg-brand-500 px-3 text-lg font-bold text-white shadow-soft transition outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
            >
              {textOf(id)}
            </button>
          ))
        )}
      </div>

      {!done && (
        <div role="group" aria-label={t('Words')} className="flex flex-wrap gap-2">
          {tiles.map((tile) => {
            const used = placed.includes(tile.id);
            return (
              <button
                key={tile.id}
                type="button"
                lang="en"
                disabled={used}
                // A used word stays as an empty slot (the row keeps its shape); readers skip it.
                aria-hidden={used || undefined}
                onClick={() => place(tile.id)}
                className={cn(
                  'min-h-11 rounded-xl border-2 px-3 text-lg font-bold transition outline-none focus-visible:ring-4 focus-visible:ring-brand-100',
                  used
                    ? 'border-transparent bg-navy-50 text-transparent'
                    : 'border-brand-200 bg-white text-navy-800 hover:border-brand-400 hover:bg-brand-50',
                )}
              >
                {tile.text}
              </button>
            );
          })}
        </div>
      )}

      {state === 'wrong' && (
        <p role="status" className="font-bold text-navy-700">
          {t('Not quite. Tap a word to take it back and try again!')}
        </p>
      )}

      {done ? (
        <div
          role="status"
          className={cn(
            'flex items-center gap-3 rounded-2xl p-3 font-bold',
            state === 'right' ? 'bg-leaf-500 text-white' : 'bg-sun-100 text-navy-800',
          )}
        >
          <CircleCheck aria-hidden className="size-6 shrink-0" />
          <span className="min-w-0 flex-1">
            {state === 'right' ? t('Right!') : t('Here is the sentence.')}
          </span>
          <AudioButton
            soundKey={`grammar-a:${exercise.id}`}
            text={exercise.sentence}
            label={t('Listen to the sentence')}
            size="sm"
            variant="light"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            className="sm:flex-1"
            leftIcon={<PencilLine aria-hidden className="size-5" />}
            disabled={placed.length !== tiles.length}
            onClick={check}
          >
            {t('Check')}
          </Button>
          {tries > 0 && (
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
          )}
        </div>
      )}
    </div>
  );
}
