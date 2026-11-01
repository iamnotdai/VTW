import { Languages } from 'lucide-react';
import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Button } from '@/components/common/Button';
import { Pinyin } from '@/components/common/Pinyin';
import { getWord } from '@/data/content';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Word } from '@/types/models';
import { RelatedWordChip } from './RelatedWordChip';

/**
 * Word, listen button, "Show Meaning" and IPA — pinyin in the Chinese course (top of the answer
 * card, spec §8 Feedback).
 */
export function WordHeadline({ word }: { word: Word }) {
  const course = useCourse();
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const [meaningVisible, setMeaningVisible] = useState(false);
  const pronunciation = word.pinyin ?? word.ipa;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-3">
          <p
            lang={course.lang}
            className="text-[2.125rem] leading-none font-extrabold text-navy-900"
          >
            {word.text}
          </p>
          <AudioButton
            soundKey={`word:${word.id}`}
            text={word.text}
            src={word.audio}
            label={t('Listen to “{word}”', { word: word.text })}
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
            {meaningVisible ? t('Hide Meaning') : t('Show Meaning')}
          </Button>
        )}
      </div>
      {pronunciation && (
        <p
          lang={word.pinyin ? 'zh-Latn-pinyin' : undefined}
          className="mt-1 text-base font-medium text-navy-400"
        >
          {pronunciation}
        </p>
      )}
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
  const course = useCourse();
  const related = word.relatedWordIds
    .map((id) => getWord(id))
    .filter((item): item is Word => !!item)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-navy-900">{t('Example')}</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {word.examples.map((example, index) => (
            <li key={example.text} className="flex items-center gap-2">
              <AudioButton
                soundKey={`example:${word.id}:${index}`}
                text={example.text}
                src={example.audio}
                label={t('Listen to the sentence')}
                variant="plain"
              />
              <div className="min-w-0">
                <p lang={course.lang} className="text-lg font-medium text-navy-600">
                  {example.text}
                </p>
                <Pinyin text={example.pinyin} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-navy-900">{t('Related Words')}</h2>
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
