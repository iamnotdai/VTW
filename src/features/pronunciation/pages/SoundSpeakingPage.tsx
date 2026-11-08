import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { getChartSound, getSoundChart } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { WordSpeakingRound } from '@/features/vocabulary/speaking/WordSpeakingRound';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import type { ChartSound } from '@/types/models';
import { chartSymbol, chartTitle, getSoundExampleWords } from '../soundChartText';

/**
 * Speaking round of a sound (`/pronunciation/sounds/:soundId/speaking`, spec §24.2): the sound
 * card's example words in a Word Speaking round. Only words are scored — a speech recognizer
 * writes words, it can't judge a sound on its own.
 */
export function SoundSpeakingPage() {
  const { soundId } = useParams();
  const sound = getChartSound(soundId);
  if (!sound || getSoundExampleWords(sound).length === 0) return <NotFoundPage />;
  return <SoundSpeaking key={sound.id} sound={sound} />;
}

function SoundSpeaking({ sound }: { sound: ChartSound }) {
  const symbol = chartSymbol(sound);
  useDocumentTitle(t('Speaking · {symbol}', { symbol }));
  return (
    <WordSpeakingRound
      words={getSoundExampleWords(sound)}
      crumbs={[
        { label: t('Pronunciation'), to: paths.pronunciation },
        { label: chartTitle(getSoundChart().kind), to: paths.soundChart },
        { label: symbol, to: paths.chartSound(sound.id) },
        { label: t('Speaking') },
      ]}
      heading={t('Words with {symbol}: speaking practice', { symbol })}
      back={{ to: paths.chartSound(sound.id), label: t('Back to the Sound {symbol}', { symbol }) }}
    />
  );
}
