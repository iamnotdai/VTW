import { Eye } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Pinyin } from '@/components/common/Pinyin';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import {
  blanksOf,
  isBlankAnswerCorrect,
  type Blank,
  type BlankChoice,
  type BlankLine,
} from '@/lib/fillBlanks';
import { playSfx } from '@/lib/sfx';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation } from '@/types/models';
import { BlankDialogue, BlanksEndActions, BlanksResult } from './BlankDialogue';

/**
 * Choice mode of Fill in the Blanks (spec §9.6), for every learner: under each line, a few words to
 * choose from. A tap checks at once (like a quiz choice): the right word fills the blank; a wrong
 * one turns yellow and can't be picked again. The options were shuffled once, with the blanks.
 */
export function ChoiceBlanks({
  conversation,
  blankLines,
  choices,
  onRestart,
}: {
  conversation: Conversation;
  blankLines: readonly BlankLine[];
  choices: Readonly<Record<string, readonly BlankChoice[]>>;
  onRestart: () => void;
}) {
  const course = useCourse();
  const blanks = blanksOf(blankLines);
  const [right, setRight] = useState<Record<string, boolean>>({});
  const [wrong, setWrong] = useState<Record<string, string[]>>({});
  const [revealed, setRevealed] = useState(false);
  const groups = useRef(new Map<string, HTMLDivElement>());

  const allRight = blanks.length > 0 && blanks.every((blank) => right[blank.id]);
  const done = allRight || revealed;
  const triedWrong = Object.values(wrong).some((list) => list.length > 0);
  const firstTry = blanks.filter((blank) => right[blank.id] && !wrong[blank.id]?.length).length;

  const choose = (blank: Blank, option: BlankChoice) => {
    if (done || right[blank.id]) return;
    const sound = useSettingsStore.getState().settings.soundEnabled;
    if (!isBlankAnswerCorrect(blank.answer, option.text)) {
      setWrong((current) => ({
        ...current,
        [blank.id]: [...(current[blank.id] ?? []), option.text],
      }));
      if (sound) playSfx('wrong');
      return;
    }
    const nextRight = { ...right, [blank.id]: true };
    setRight(nextRight);
    const remaining = blanks.filter((item) => !nextRight[item.id]);
    if (sound) playSfx(remaining.length === 0 ? 'completed' : 'correct');
    // The choices of this blank disappear: keyboard focus moves on to the next blank's choices.
    const position = blanks.indexOf(blank);
    const next = remaining.find((item) => blanks.indexOf(item) > position) ?? remaining[0];
    if (next) {
      requestAnimationFrame(() =>
        groups.current.get(next.id)?.querySelector<HTMLButtonElement>('button:enabled')?.focus(),
      );
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <BlankDialogue
        conversation={conversation}
        blankLines={blankLines}
        done={done}
        renderBlank={(blank, number) => {
          if (right[blank.id]) {
            return (
              <span className="mx-0.5 inline-block rounded-lg border-2 border-leaf-500 bg-leaf-50 px-2 leading-9 font-bold text-leaf-700">
                {blank.answer}
              </span>
            );
          }
          if (revealed) {
            return <span className="mx-0.5 font-extrabold text-coral-600">{blank.answer}</span>;
          }
          return (
            <span className="mx-0.5 inline-block w-20 border-b-2 border-dashed border-brand-400">
              <span className="sr-only">{t('Missing word {number}', { number })}</span>
            </span>
          );
        }}
        renderBelow={(blank, number) =>
          right[blank.id] || revealed ? null : (
            <div
              ref={(element) => {
                if (element) groups.current.set(blank.id, element);
                else groups.current.delete(blank.id);
              }}
              role="group"
              aria-label={t('Choices for missing word {number}', { number })}
              className="mt-1 mb-1 flex flex-wrap gap-2"
            >
              {(choices[blank.id] ?? []).map((option) => {
                const tried = wrong[blank.id]?.includes(option.text) ?? false;
                return (
                  <button
                    key={option.text}
                    type="button"
                    disabled={tried}
                    onClick={() => choose(blank, option)}
                    className={cn(
                      'flex min-h-11 min-w-16 flex-col items-center justify-center rounded-xl border-2 px-4 py-1 font-bold transition outline-none focus-visible:ring-4 focus-visible:ring-brand-100',
                      tried
                        ? 'animate-wiggle border-sun-400 bg-sun-50 text-navy-400 line-through'
                        : 'border-brand-200 bg-white text-navy-800 hover:border-brand-400 hover:bg-brand-50',
                    )}
                  >
                    <span lang={course.lang} className="text-[1.0625rem] leading-tight">
                      {option.text}
                    </span>
                    <Pinyin as="span" text={option.pinyin} className="text-xs leading-tight" />
                  </button>
                );
              })}
            </div>
          )
        }
      />

      {done ? (
        <>
          <BlanksResult allRight={allRight} firstTry={firstTry} total={blanks.length} />
          <BlanksEndActions conversation={conversation} onRestart={onRestart} />
        </>
      ) : (
        triedWrong && (
          <Button
            variant="ghost"
            leftIcon={<Eye aria-hidden className="size-5" />}
            onClick={() => setRevealed(true)}
          >
            {t('Show Answers')}
          </Button>
        )
      )}
    </div>
  );
}
