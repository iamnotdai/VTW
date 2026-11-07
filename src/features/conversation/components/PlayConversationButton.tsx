import { IconButton } from '@/components/common/IconButton';
import { SpeakerMutedIcon, SpeakerSolidIcon } from '@/components/icons/AppIcons';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation } from '@/types/models';
import { usePlayConversation } from '../usePlayConversation';

/** Listens to the whole conversation, one line after the other (design screen 15). */
export function PlayConversationButton({ conversation }: { conversation: Conversation }) {
  const soundEnabled = useSettingsStore((state) => state.settings.soundEnabled);
  const { playing, start, stop } = usePlayConversation(conversation);

  return (
    <IconButton
      label={playing ? t('Stop') : t('Listen to the whole conversation')}
      variant="plain"
      disabled={!soundEnabled}
      aria-pressed={playing}
      className={cn(playing && 'ring-4 ring-sun-300')}
      onClick={playing ? stop : start}
    >
      {soundEnabled ? (
        <SpeakerSolidIcon aria-hidden className={cn(playing && 'motion-safe:animate-pulse')} />
      ) : (
        <SpeakerMutedIcon aria-hidden />
      )}
    </IconButton>
  );
}
