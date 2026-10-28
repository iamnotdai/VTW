import { Heart, Languages } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { getWord } from '@/data/content';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Word } from '@/types/models';

interface FlashcardProps {
  word: Word;
  index: number;
  total: number;
  /** Top-right corner of the card (the green "Finish" pill). */
  corner?: ReactNode;
  /** Bottom of the card (Next / Finish). */
  footer?: ReactNode;
}

/**
 * One big flashcard (spec §7.3, design screen 05): number, picture, word, IPA, listen, Show
 * Meaning, heart, example sentences, related words with pictures.
 */
export function Flashcard({ word, index, total, corner, footer }: FlashcardProps) {
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const favorite = useProgressStore((state) => state.progress.favoriteWordIds.includes(word.id));
  const toggleFavorite = useProgressStore((state) => state.toggleFavorite);
  const [meaningVisible, setMeaningVisible] = useState(false);
  const related = word.relatedWordIds
    .map((id) => getWord(id))
    .filter((item): item is Word => !!item)
    .slice(0, 3);

  return (
    <article
      aria-roledescription="flashcard"
      aria-label={`Card ${index + 1} of ${total}: ${word.text}`}
      className="flex w-full animate-pop-in flex-col rounded-[1.25rem] bg-white px-5 pt-4 pb-5 shadow-lift sm:px-8 sm:pt-6 sm:pb-6"
    >
      <div className="flex min-h-9 items-center justify-between gap-3">
        <span className="rounded-full bg-brand-50 px-4 py-1.5 text-[1.0625rem] font-bold text-navy-800">
          {index + 1} / {total}
        </span>
        {corner}
      </div>

      <div className="flex h-44 items-center justify-center sm:h-56">
        <img
          src={assetUrl(word.image)}
          alt=""
          className="max-h-full max-w-[78%] object-contain drop-shadow-[0_14px_16px_rgb(16_40_100/0.18)]"
          draggable={false}
        />
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <h2
          lang="en"
          className="text-[2.75rem] leading-none font-extrabold text-navy-900 sm:text-[3.25rem]"
        >
          {word.text}
        </h2>
        <AudioButton
          soundKey={`word:${word.id}`}
          text={word.text}
          src={word.audio}
          label={`Listen to “${word.text}”`}
          variant="brand"
          size="lg"
        />
      </div>
      {word.ipa && (
        <p className="mt-1.5 text-center text-lg font-medium text-navy-400">{word.ipa}</p>
      )}

      <div className="mt-3 flex items-center justify-center gap-2.5">
        {showVietnamese && (
          <Button
            variant="soft"
            shape="pill"
            aria-expanded={meaningVisible}
            leftIcon={<Languages aria-hidden className="size-5" />}
            onClick={() => setMeaningVisible((visible) => !visible)}
          >
            {meaningVisible ? 'Hide Meaning' : 'Show Meaning'}
          </Button>
        )}
        <IconButton
          label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(word.id)}
        >
          <Heart
            aria-hidden
            className={cn(favorite ? 'fill-coral-500 text-coral-500' : 'text-brand-500')}
          />
        </IconButton>
      </div>
      {showVietnamese && meaningVisible && (
        <p lang="vi" className="mt-2 animate-fade-in text-center text-lg font-bold text-coral-600">
          {word.meaningVi}
        </p>
      )}

      <hr className="my-4 border-navy-100" />

      <h3 className="text-lg font-bold text-navy-900">Example Sentences</h3>
      <ul className="mt-1 flex flex-col">
        {word.examples.map((example, exampleIndex) => (
          <li key={example.en} className="flex items-center gap-1.5">
            <AudioButton
              soundKey={`example:${word.id}:${exampleIndex}`}
              text={example.en}
              src={example.audio}
              label="Listen to the example"
              variant="plain"
            />
            <div className="min-w-0">
              <p lang="en" className="text-[1.0625rem] font-medium text-navy-600">
                {example.en}
              </p>
              {showVietnamese && meaningVisible && example.vi && (
                <p lang="vi" className="text-sm font-medium text-navy-400">
                  {example.vi}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {related.length > 0 && (
        <>
          <h3 className="mt-3 text-lg font-bold text-navy-900">Related Words</h3>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {related.map((item) => (
              <li
                key={item.id}
                className="flex h-13 min-w-0 items-center gap-2.5 rounded-xl bg-mist px-2.5 sm:px-3.5"
              >
                <img
                  src={assetUrl(item.image)}
                  alt=""
                  className="size-8 shrink-0 object-contain"
                  loading="lazy"
                  draggable={false}
                />
                <span lang="en" className="truncate text-[1.0625rem] font-semibold text-navy-700">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {footer && (
        <>
          <hr className="my-4 border-navy-100" />
          {footer}
        </>
      )}
    </article>
  );
}
