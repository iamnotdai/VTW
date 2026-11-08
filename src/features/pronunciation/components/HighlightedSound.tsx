import { getSoundChart, getSoundTokens } from '@/data/content';
import { cn } from '@/lib/cn';
import { highlightSound } from '@/lib/soundChart';

/**
 * A word's IPA or pinyin with the studied sound marked (highlight and heavier weight, not colour
 * only). `text` (the word) tells a Chinese word's number of syllables.
 */
export function HighlightedSound({
  transcription,
  text,
  soundId,
  className,
}: {
  transcription: string;
  text: string;
  soundId: string;
  className?: string;
}) {
  const pinyin = getSoundChart().kind === 'pinyin';
  const parts = highlightSound(transcription, getSoundTokens(transcription, text).tokens, soundId);
  return (
    <span
      lang={pinyin ? 'zh-Latn-pinyin' : undefined}
      className={cn('font-medium text-navy-500', className)}
    >
      {parts.map((part, index) =>
        part.highlight ? (
          <mark key={index} className="rounded bg-sun-200 px-0.5 font-extrabold text-navy-900">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  );
}
