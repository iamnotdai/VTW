import { Snail } from 'lucide-react';
import { SpeakerMutedIcon, SpeakerSolidIcon } from '@/components/icons/AppIcons';
import { t } from '@/i18n';
import { optionalAssetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { IconButton } from './IconButton';

interface AudioButtonProps {
  /** Unique key of this sound, e.g. "word:lamp" — used to show the playing state. */
  soundKey: string;
  /** Text spoken by the browser voice when there is no audio file. */
  text: string;
  /** Optional recorded audio (public path, resolved here with `assetUrl`). */
  src?: string;
  /** Browser-voice tuning, e.g. per conversation speaker. */
  pitch?: number;
  rate?: number;
  /** The snail button: plays slowly, for listening closely. Use its own `soundKey`. */
  slow?: boolean;
  /** Accessible name, e.g. 'Listen to "lamp"'. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  /** `brand` = solid blue circle, `soft` = pale circle, `plain` = blue glyph only. */
  variant?: 'light' | 'brand' | 'soft' | 'plain';
  className?: string;
}

/** Plays a word or sentence on demand. Never auto-plays (spec §13). */
export function AudioButton({
  soundKey,
  text,
  src,
  pitch,
  rate,
  slow = false,
  label,
  size = 'md',
  variant = 'brand',
  className,
}: AudioButtonProps) {
  const soundEnabled = useSettingsStore((state) => state.settings.soundEnabled);
  const playing = useAudioStore((state) => state.playingKey === soundKey);
  const play = useAudioStore((state) => state.play);
  const stop = useAudioStore((state) => state.stop);

  if (!soundEnabled) {
    return (
      <IconButton
        label={t('Sound is off in Settings')}
        size={size}
        variant={variant}
        disabled
        className={className}
      >
        <SpeakerMutedIcon aria-hidden />
      </IconButton>
    );
  }

  const Icon = slow ? Snail : SpeakerSolidIcon;
  return (
    <IconButton
      label={playing ? t('Stop') : label}
      size={size}
      variant={variant}
      aria-pressed={playing}
      className={cn(playing && 'ring-4 ring-sun-300', className)}
      onClick={() =>
        playing ? stop() : play(soundKey, { text, src: optionalAssetUrl(src), pitch, rate, slow })
      }
    >
      <Icon aria-hidden className={cn(playing && 'motion-safe:animate-pulse')} />
    </IconButton>
  );
}
