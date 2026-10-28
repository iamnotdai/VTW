import { useState } from 'react';
import { IconButton } from '@/components/common/IconButton';
import { SpeakerMutedIcon, SpeakerSolidIcon } from '@/components/icons/AppIcons';
import { getSpeaker } from '@/data/content';
import { optionalAssetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation } from '@/types/models';

/** Listens to the whole conversation, one line after the other (design screen 15). */
export function PlayConversationButton({ conversation }: { conversation: Conversation }) {
  const soundEnabled = useSettingsStore((state) => state.settings.soundEnabled);
  const playingKey = useAudioStore((state) => state.playingKey);
  const play = useAudioStore((state) => state.play);
  const stop = useAudioStore((state) => state.stop);
  const [playingAll, setPlayingAll] = useState(false);
  const active = playingAll && !!playingKey?.startsWith('line:');

  const playFrom = (index: number) => {
    const line = conversation.lines[index];
    if (!line) {
      setPlayingAll(false);
      return;
    }
    const voice = getSpeaker(line.speakerId)?.voice;
    play(
      `line:${line.id}`,
      {
        text: line.textEn,
        src: optionalAssetUrl(line.audio),
        pitch: voice?.pitch,
        rate: voice?.rate,
      },
      () => playFrom(index + 1),
    );
  };

  return (
    <IconButton
      label={active ? 'Stop' : 'Listen to the whole conversation'}
      variant="plain"
      disabled={!soundEnabled}
      aria-pressed={active}
      className={cn(active && 'ring-4 ring-sun-300')}
      onClick={() => {
        if (active) {
          stop();
          setPlayingAll(false);
        } else {
          setPlayingAll(true);
          playFrom(0);
        }
      }}
    >
      {soundEnabled ? (
        <SpeakerSolidIcon aria-hidden className={cn(active && 'motion-safe:animate-pulse')} />
      ) : (
        <SpeakerMutedIcon aria-hidden />
      )}
    </IconButton>
  );
}
