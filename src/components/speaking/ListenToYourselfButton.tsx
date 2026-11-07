import { Ear } from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';

const RECORDING_KEY = 'recording';

/** Plays the learner's own last try (kept in memory only), to compare with the example. */
export function ListenToYourselfButton({
  url,
  size = 'md',
  className,
}: {
  url: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const soundEnabled = useSettingsStore((state) => state.settings.soundEnabled);
  const playing = useAudioStore((state) => state.playingKey === RECORDING_KEY);
  const play = useAudioStore((state) => state.play);
  const stop = useAudioStore((state) => state.stop);
  return (
    <IconButton
      label={
        !soundEnabled
          ? t('Sound is off in Settings')
          : playing
            ? t('Stop')
            : t('Listen to yourself')
      }
      size={size}
      variant="soft"
      disabled={!soundEnabled}
      aria-pressed={playing}
      className={cn(playing && 'ring-4 ring-sun-300', className)}
      onClick={() => (playing ? stop() : play(RECORDING_KEY, { text: '', src: url }))}
    >
      <Ear aria-hidden className={cn(playing && 'motion-safe:animate-pulse')} />
    </IconButton>
  );
}
