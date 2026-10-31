import { ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { Choice } from '@/lib/quiz';
import type { QuizStatus } from './quizSession';

interface MultipleChoiceQuestionProps {
  /** Already shuffled once when the question was created — rendered as-is. */
  choices: readonly Choice[];
  status: QuizStatus;
  lastAnswer: string | null;
  onSubmit: (wordId: string) => void;
}

const LETTERS = 'ABCDEFGH';
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Multiple-choice mode (spec §8; design screen 07 B): a letter badge, the word and an arrow. Tapping a choice checks
 * it right away — there is no "Check Answer" button. The choices are plain buttons, not radios,
 * so moving through them with the arrow keys never submits an answer by accident.
 */
export function MultipleChoiceQuestion({
  choices,
  status,
  lastAnswer,
  onSubmit,
}: MultipleChoiceQuestionProps) {
  const [wrongIds, setWrongIds] = useState<ReadonlySet<string>>(new Set());
  const answering = status === 'answering';

  // Remember wrong picks so they stay crossed out after "Try Again".
  if (status === 'incorrect' && lastAnswer && !wrongIds.has(lastAnswer)) {
    setWrongIds(new Set([...wrongIds, lastAnswer]));
  }

  const choose = (wordId: string) => {
    if (!answering || wrongIds.has(wordId)) return;
    onSubmit(wordId);
  };

  return (
    <div role="group" aria-label="Choose the right word" className="flex flex-col gap-2.5">
      {choices.map((choice, index) => {
        const isWrong = wrongIds.has(choice.wordId);
        return (
          <button
            key={choice.wordId}
            type="button"
            disabled={isWrong || !answering}
            onClick={() => choose(choice.wordId)}
            className={cn(
              'group flex h-14 items-center gap-3 rounded-xl border pr-4 pl-2.5 text-left text-lg font-semibold transition focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none',
              isWrong
                ? 'cursor-not-allowed border-navy-100 bg-navy-50 text-navy-300'
                : 'cursor-pointer border-navy-100 bg-white text-navy-800 shadow-[0_2px_6px_-3px_rgb(16_40_100/0.15)] hover:border-brand-300 hover:bg-brand-50/60 active:bg-brand-50',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full text-base font-bold',
                isWrong ? 'bg-navy-100 text-navy-300' : 'bg-brand-50 text-brand-600',
              )}
            >
              {isWrong ? <X className="size-4" strokeWidth={3} /> : LETTERS[index]}
            </span>
            <span lang="en" className={cn('min-w-0 flex-1', isWrong && 'line-through')}>
              {capitalize(choice.text)}
            </span>
            {!isWrong && (
              <ChevronRight
                aria-hidden
                className="size-5 shrink-0 text-brand-500 transition group-hover:translate-x-0.5"
                strokeWidth={2.5}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
