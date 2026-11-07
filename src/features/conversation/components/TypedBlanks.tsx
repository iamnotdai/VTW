import { Eye, PencilLine } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/common/Button';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { blanksOf, isBlankAnswerCorrect, type BlankLine } from '@/lib/fillBlanks';
import { playSfx } from '@/lib/sfx';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation } from '@/types/models';
import { BlankDialogue, BlanksEndActions, BlanksResult } from './BlankDialogue';

type BlankStatus = 'right' | 'wrong';

/**
 * Typing mode of Fill in the Blanks (spec §9.6), only for learners who can type: the learner types
 * the missing words and checks them together. Only case, punctuation and spaces are forgiven.
 */
export function TypedBlanks({
  conversation,
  blankLines,
  onRestart,
}: {
  conversation: Conversation;
  blankLines: readonly BlankLine[];
  onRestart: () => void;
}) {
  const course = useCourse();
  const blanks = blanksOf(blankLines);
  const [values, setValues] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, BlankStatus>>({});
  const [firstTry, setFirstTry] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const rightCount = blanks.filter((blank) => statuses[blank.id] === 'right').length;
  const allRight = blanks.length > 0 && rightCount === blanks.length;
  const done = allRight || revealed;
  const checked = Object.keys(statuses).length > 0;

  const check = (event: FormEvent) => {
    event.preventDefault();
    if (done) return;
    const next = Object.fromEntries(
      blanks.map((blank) => [
        blank.id,
        isBlankAnswerCorrect(blank.answer, values[blank.id] ?? '') ? 'right' : 'wrong',
      ]),
    ) as Record<string, BlankStatus>;
    const right = Object.values(next).filter((status) => status === 'right').length;
    setStatuses(next);
    setFirstTry((current) => current ?? right);
    if (useSettingsStore.getState().settings.soundEnabled) {
      playSfx(right === blanks.length ? 'completed' : 'wrong');
    }
  };

  // A Chinese pinyin keyboard's Enter only picks characters: it never checks the answers.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) {
      event.preventDefault();
    }
  };

  return (
    <form onSubmit={check} className="flex flex-col gap-5" noValidate>
      <BlankDialogue
        conversation={conversation}
        blankLines={blankLines}
        done={done}
        renderBlank={(piece, number) => {
          const status = statuses[piece.id];
          const showAnswer = revealed && status !== 'right';
          const han = /\p{Script=Han}/u.test(piece.answer);
          const length = Array.from(piece.answer).length;
          return (
            <span className="inline-flex items-baseline gap-1">
              <input
                type="text"
                aria-label={t('Missing word {number}', { number })}
                aria-invalid={status === 'wrong' ? true : undefined}
                value={values[piece.id] ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setValues((current) => ({ ...current, [piece.id]: value }));
                  // Changing a checked word clears its mark until the next check.
                  setStatuses((current) => {
                    if (!(piece.id in current)) return current;
                    const next = { ...current };
                    delete next[piece.id];
                    return next;
                  });
                }}
                onKeyDown={onKeyDown}
                readOnly={done}
                lang={course.lang}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="done"
                style={{
                  width: han
                    ? `${Math.max(length, 2) * 1.15 + 1.2}em`
                    : `${Math.max(length, 4) + 2}ch`,
                }}
                className={cn(
                  'mx-0.5 h-10 max-w-full rounded-lg border-2 px-2 text-center align-baseline font-bold text-navy-900 transition outline-none focus:ring-4 focus:ring-brand-100',
                  status === 'right'
                    ? 'border-leaf-500 bg-leaf-50 text-leaf-700'
                    : status === 'wrong'
                      ? 'animate-wiggle border-sun-400 bg-sun-50'
                      : 'border-dashed border-brand-300 bg-brand-50/60 focus:border-solid focus:border-brand-500',
                )}
              />
              {showAnswer && (
                <span className="font-extrabold text-coral-600">({piece.answer})</span>
              )}
            </span>
          );
        }}
      />

      {!done && checked && (
        <p role="status" className="text-center font-semibold text-navy-600">
          {t('{count} of {total} right. Fix the yellow words and check again!', {
            count: rightCount,
            total: blanks.length,
          })}
        </p>
      )}

      {done ? (
        <>
          <BlanksResult allRight={allRight} firstTry={firstTry} total={blanks.length} />
          <BlanksEndActions conversation={conversation} onRestart={onRestart} />
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            size="lg"
            fullWidth
            leftIcon={<PencilLine aria-hidden className="size-5" />}
            disabled={blanks.every((blank) => !(values[blank.id] ?? '').trim())}
          >
            {checked ? t('Check Again') : t('Check Answers')}
          </Button>
          {checked && (
            <Button
              variant="ghost"
              leftIcon={<Eye aria-hidden className="size-5" />}
              onClick={() => setRevealed(true)}
            >
              {t('Show Answers')}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
