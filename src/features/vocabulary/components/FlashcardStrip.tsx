import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/common/IconButton';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import type { Word } from '@/types/models';

const TILE = 72;
const GAP = 12;

/** How many tiles fit in an element, updated when it resizes. */
function useFitCount() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setCount(Math.max(0, Math.floor((element.clientWidth + GAP) / (TILE + GAP))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, count] as const;
}

interface FlashcardStripProps {
  words: readonly Word[];
  index: number;
  onSelect: (index: number) => void;
}

/**
 * Picture strip along the bottom of the flashcard screen (design screen 05). The big card covers
 * its middle, so the tiles are split in two halves on each side of the card: the current card
 * and the next ones on the left, the following ones on the right. The arrows page through; the
 * window stops at the last full page so both halves stay filled.
 */
export function FlashcardStrip({ words, index, onSelect }: FlashcardStripProps) {
  const [leftRef, leftCount] = useFitCount();
  const [rightRef, rightCount] = useFitCount();
  const [{ start, forIndex }, setWindow] = useState({ start: index, forIndex: index });
  const page = Math.max(1, leftCount + rightCount);
  // The window never runs past the last card, so near the end it stays full on both sides
  // instead of the tiles bunching up on the left.
  const maxStart = Math.max(0, words.length - page);
  // Moving to another card brings the strip back to it.
  const windowStart = Math.min(forIndex === index ? start : index, maxStart);
  if (forIndex !== index) setWindow({ start: index, forIndex: index });

  const left = words.slice(windowStart, windowStart + leftCount);
  const right = words.slice(windowStart + leftCount, windowStart + leftCount + rightCount);

  const tile = (word: Word, position: number) => {
    const current = position === index;
    return (
      <li key={word.id} className="shrink-0">
        <button
          type="button"
          onClick={() => onSelect(position)}
          aria-label={`Card ${position + 1}: ${word.text}`}
          aria-current={current ? 'true' : undefined}
          className={cn(
            'flex size-18 items-center justify-center rounded-xl border bg-white p-2 transition',
            current
              ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500'
              : 'border-navy-100 hover:border-brand-300',
          )}
        >
          <img
            src={assetUrl(word.image)}
            alt=""
            className="max-h-full max-w-full object-contain"
            loading="lazy"
            draggable={false}
          />
        </button>
      </li>
    );
  };

  return (
    <nav
      aria-label="All cards"
      className="flex h-28 items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 shadow-soft backdrop-blur"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <IconButton
          label="Earlier cards"
          size="sm"
          disabled={windowStart === 0}
          onClick={() => setWindow({ start: Math.max(0, windowStart - page), forIndex: index })}
        >
          <ChevronLeft aria-hidden strokeWidth={2.5} />
        </IconButton>
        <div ref={leftRef} className="min-w-0 flex-1 overflow-hidden">
          <ul className="flex gap-3">{left.map((word, i) => tile(word, windowStart + i))}</ul>
        </div>
      </div>
      {/* The flashcard covers this gap. */}
      <div aria-hidden className="w-(--card-width) shrink-0" />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div ref={rightRef} className="min-w-0 flex-1 overflow-hidden">
          <ul className="flex justify-end gap-3">
            {right.map((word, i) => tile(word, windowStart + leftCount + i))}
          </ul>
        </div>
        <IconButton
          label="Later cards"
          size="sm"
          disabled={windowStart >= maxStart}
          onClick={() =>
            setWindow({
              start: Math.min(maxStart, windowStart + page),
              forIndex: index,
            })
          }
        >
          <ChevronRight aria-hidden strokeWidth={2.5} />
        </IconButton>
      </div>
    </nav>
  );
}
