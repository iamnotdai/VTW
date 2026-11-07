import { getIpaSpellings } from '@/data/content';
import { highlightIpaSound } from '@/lib/ipa';

/** A transcription with the studied sound marked (highlight and heavier weight, not colour only). */
export function HighlightedIpa({ ipa, soundId }: { ipa: string; soundId: string }) {
  return (
    <span className="font-medium text-navy-500">
      {highlightIpaSound(ipa, soundId, getIpaSpellings()).map((part, index) =>
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
