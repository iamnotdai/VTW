import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { ScoredPart, SoundStatus } from '@/lib/speakingScore';

/** Colour plus an underline style, so the marks still read without colour. */
const STATUS_CLASS: Record<SoundStatus, string> = {
  good: 'text-leaf-600',
  fair: 'text-sun-700 underline decoration-sun-500 decoration-dotted decoration-2 underline-offset-[0.2em]',
  bad: 'text-coral-600 underline decoration-coral-400 decoration-wavy decoration-2 underline-offset-[0.2em]',
};

/**
 * The target with each sound, word or character marked by how it was heard (spec §7.7): green =
 * good, yellow dotted = almost, red wavy = practise this. Plain text until there is a score.
 */
export function ScoredText({
  text,
  parts,
  lang,
  className,
}: {
  text: string;
  parts?: readonly ScoredPart[] | null;
  lang: string;
  className?: string;
}) {
  if (!parts) {
    return (
      <span lang={lang} className={className}>
        {text}
      </span>
    );
  }
  const toPractice = parts
    .filter((part) => part.status === 'fair' || part.status === 'bad')
    .map((part) => part.text.replace(/[\p{P}\s]+/gu, ''))
    .filter(Boolean);
  return (
    <span lang={lang} className={className}>
      <span aria-hidden>
        {parts.map((part, index) => (
          <span key={index} className={cn(part.status && STATUS_CLASS[part.status])}>
            {part.text}
          </span>
        ))}
      </span>
      <span className="sr-only">
        {text}
        {toPractice.length > 0 &&
          ` — ${t('practice: {sounds}', { sounds: toPractice.join(', ') })}`}
      </span>
    </span>
  );
}
