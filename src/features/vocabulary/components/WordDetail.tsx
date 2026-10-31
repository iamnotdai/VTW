import { Languages } from 'lucide-react';
import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Button } from '@/components/common/Button';
import { getWord } from '@/data/content';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Word } from '@/types/models';
import { RelatedWordChip } from './RelatedWordChip';

/** Word, listen button, "Show Meaning" and IPA (top of the answer card, spec §8 Feedback). */
export function WordHeadline({ word }: { word: Word }) {
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const [meaningVisible, setMeaningVisible] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-3">
          <p lang="en" className="text-[2.125rem] leading-none font-extrabold text-navy-900">
            {word.text}
          </p>
          <AudioButton
            soundKey={`word:${word.id}`}
            text={word.text}
            src={word.audio}
            label={`Listen to “${word.text}”`}
            variant="brand"
          />
        </div>
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
      </div>
      {word.ipa && <p className="mt-1 text-base font-medium text-navy-400">{word.ipa}</p>}
      {showVietnamese && meaningVisible && (
        <p lang="vi" className="mt-1.5 animate-fade-in text-lg font-bold text-coral-600">
          {word.meaningVi}
        </p>
      )}
    </div>
  );
}

/** Example sentences with listen buttons, then related words (bottom of the answer card). */
export function WordExtras({ word }: { word: Word }) {
  const related = word.relatedWordIds
    .map((id) => getWord(id))
    .filter((item): item is Word => !!item)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-navy-900">Example</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {word.examples.map((example, index) => (
            <li key={example.en} className="flex items-center gap-2">
              <AudioButton
                soundKey={`example:${word.id}:${index}`}
                text={example.en}
                src={example.audio}
                label="Listen to the sentence"
                variant="plain"
              />
              <p lang="en" className="text-lg font-medium text-navy-600">
                {example.en}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-navy-900">Related Words</h2>
          <ul className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {related.map((item) => (
              <RelatedWordChip key={item.id} word={item} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
