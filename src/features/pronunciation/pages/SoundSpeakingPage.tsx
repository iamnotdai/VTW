import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { getIpaSound } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { WordSpeakingRound } from '@/features/vocabulary/speaking/WordSpeakingRound';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import type { IpaSound } from '@/types/models';
import { getSoundExampleWords, slashed } from '../ipaText';

/**
 * Speaking round of a sound (`/pronunciation/sounds/:soundId/speaking`, spec §24.2): the sound
 * card's example words in a Word Speaking round. Only words are scored — a speech recognizer
 * writes words, it can't judge a sound on its own.
 */
export function SoundSpeakingPage() {
  const { soundId } = useParams();
  const sound = getIpaSound(soundId);
  if (!sound || getSoundExampleWords(sound).length === 0) return <NotFoundPage />;
  return <SoundSpeaking key={sound.id} sound={sound} />;
}

function SoundSpeaking({ sound }: { sound: IpaSound }) {
  const symbol = slashed(sound.symbol);
  useDocumentTitle(t('Speaking · {symbol}', { symbol }));
  return (
    <WordSpeakingRound
      words={getSoundExampleWords(sound)}
      crumbs={[
        { label: t('Pronunciation'), to: paths.pronunciation },
        { label: t('IPA Sounds'), to: paths.ipaSounds },
        { label: symbol, to: paths.ipaSound(sound.id) },
        { label: t('Speaking') },
      ]}
      heading={t('Words with {symbol}: speaking practice', { symbol })}
      back={{ to: paths.ipaSound(sound.id), label: t('Back to the Sound {symbol}', { symbol }) }}
    />
  );
}
