import { AudioButton } from '@/components/common/AudioButton';
import { chartTranscription } from '@/data/content';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import type { ChartSound } from '@/types/models';
import { chartSymbol } from '../soundChartText';
import { HighlightedSound } from './HighlightedSound';

/**
 * The sound card's speaker button (spec §24.2): the recording when there is one; otherwise the
 * browser voice says the sound's `say` text — a browser voice can't say a sound on its own.
 */
export function SoundButton({ sound, className }: { sound: ChartSound; className?: string }) {
  const symbol = chartSymbol(sound);
  const say = sound.say;
  if (!sound.audio && !say) return null;
  return (
    <AudioButton
      soundKey={`chart:${sound.id}`}
      text={say?.text ?? ''}
      src={sound.audio}
      label={
        sound.audio || !say
          ? t('Listen to the sound {symbol}', { symbol })
          : t('Listen to {symbol} as in “{text}”', { symbol, text: say.text })
      }
      size="lg"
      variant="brand"
      className={className}
    />
  );
}

/**
 * What the sound button says while there is no recording ("as in “pen” /pen/", "读作“玻” bō"),
 * with the sound marked — so the learner knows what is heard.
 */
export function SoundSaidAs({ sound }: { sound: ChartSound }) {
  const course = useCourse();
  const say = sound.say;
  if (sound.audio || !say) return null;
  const transcription = chartTranscription(say);
  return (
    <p className="flex flex-wrap items-baseline justify-center gap-x-1.5 text-base font-semibold text-navy-500">
      <span>{t('As in')}</span>
      <span lang={course.lang} className="font-extrabold text-navy-800">
        “{say.text}”
      </span>
      {transcription && (
        <HighlightedSound transcription={transcription} text={say.text} soundId={sound.id} />
      )}
    </p>
  );
}
