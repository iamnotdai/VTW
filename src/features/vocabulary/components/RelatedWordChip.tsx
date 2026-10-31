import { RELATED_WORD_MIN_SCALE } from '@/config/app';
import { useFitText } from '@/hooks/useFitText';
import { assetUrl } from '@/lib/assets';
import type { Word } from '@/types/models';

/**
 * Related word with its picture (flashcard and answer card). A long word wraps onto a second line,
 * and only shrinks if it still does not fit the chip — never cut off with "…".
 */
export function RelatedWordChip({ word }: { word: Word }) {
  const textRef = useFitText<HTMLSpanElement>(word.text, RELATED_WORD_MIN_SCALE);
  return (
    <li className="flex h-13 min-w-0 items-center gap-2.5 rounded-xl bg-mist px-2.5 sm:px-3.5">
      <img
        src={assetUrl(word.image)}
        alt=""
        className="size-8 shrink-0 object-contain"
        loading="lazy"
        draggable={false}
      />
      <span
        ref={textRef}
        lang="en"
        className="max-h-full min-w-0 overflow-hidden text-[1.0625rem] leading-tight font-semibold wrap-break-word text-navy-700"
      >
        {word.text}
      </span>
    </li>
  );
}
