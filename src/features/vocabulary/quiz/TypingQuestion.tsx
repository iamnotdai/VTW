import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { useCoarsePointer } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import type { QuizStatus } from './quizSession';

interface TypingQuestionProps {
  status: QuizStatus;
  onSubmit: (text: string) => void;
}

/** Typing mode (spec §8; design screen 07 A): Enter submits; compared with accepted answers. */
export function TypingQuestion({ status, onSubmit }: TypingQuestionProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const coarsePointer = useCoarsePointer();
  const answering = status === 'answering';

  // Focus the field on desktop, and again after "Try Again" (keeping the text to fix a typo).
  // Not on touch devices, where it would pop the keyboard over the picture.
  useEffect(() => {
    if (!answering || coarsePointer) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [answering, coarsePointer]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!answering || !value.trim()) return;
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="quiz-answer" className="sr-only">
        Type the English word
      </label>
      <input
        ref={inputRef}
        id="quiz-answer"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        readOnly={!answering}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        placeholder="Type your answer..."
        aria-invalid={status === 'incorrect' ? true : undefined}
        className={cn(
          'h-14 w-full rounded-xl border bg-white px-4 text-xl font-semibold text-navy-900 transition outline-none placeholder:text-lg placeholder:font-medium placeholder:text-navy-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100',
          status === 'incorrect' ? 'animate-wiggle border-sun-400 bg-sun-50' : 'border-navy-200',
        )}
      />
      {answering && (
        <Button type="submit" size="lg" fullWidth disabled={!value.trim()}>
          Check Answer
        </Button>
      )}
    </form>
  );
}
