import { Captions, Play, Square } from 'lucide-react';
import { useState } from 'react';
import { Pinyin } from '@/components/common/Pinyin';
import { getSpeaker } from '@/data/content';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation } from '@/types/models';
import { usePlayConversation } from '../usePlayConversation';
import { SpeakerAvatar } from './SpeakerAvatar';

/**
 * Step ① of a conversation without a video (spec §9.7): the poster, the whole conversation played
 * line after line, the speaking character shown at the bottom. The words stay hidden unless the
 * learner turns captions on (listening first).
 */
export function ListenPlayer({
  conversation,
  onEnded,
}: {
  conversation: Conversation;
  onEnded: () => void;
}) {
  const course = useCourse();
  const soundEnabled = useSettingsStore((state) => state.settings.soundEnabled);
  const [captions, setCaptions] = useState(false);
  const { playing, index, start, stop } = usePlayConversation(conversation, onEnded);
  const line = index === null ? undefined : conversation.lines[index];
  const speaker = line ? getSpeaker(line.speakerId) : undefined;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-navy-950 shadow-soft">
      <img
        src={assetUrl(conversation.poster)}
        alt=""
        className={cn('h-full w-full object-cover transition', !playing && 'opacity-80')}
        draggable={false}
      />

      {!playing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <button
            type="button"
            onClick={start}
            disabled={!soundEnabled}
            className="flex h-16 w-24 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lift transition outline-none hover:scale-105 focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Play aria-hidden className="ml-1 size-8 fill-current" />
            <span className="sr-only">{t('Listen to the whole conversation')}</span>
          </button>
          <p className="rounded-full bg-navy-950/60 px-4 py-1.5 font-bold text-white backdrop-blur">
            {soundEnabled ? t('Listen to the whole conversation') : t('Sound is off in Settings')}
          </p>
        </div>
      )}

      {line && (
        <div
          aria-live="polite"
          className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-white/92 p-2.5 pr-4 shadow-lift backdrop-blur sm:inset-x-5 sm:bottom-5"
        >
          <SpeakerAvatar
            speakerId={line.speakerId}
            size={48}
            className="motion-safe:animate-pulse"
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[15px] font-extrabold text-navy-900">
              {speaker?.name ?? line.speakerId}
            </p>
            {captions && (
              <>
                <p lang={course.lang} className="font-semibold text-navy-700">
                  {line.text}
                </p>
                <Pinyin text={line.pinyin} />
              </>
            )}
          </div>
        </div>
      )}

      <div className="absolute top-3 right-3 flex gap-2">
        <button
          type="button"
          aria-pressed={captions}
          onClick={() => setCaptions((value) => !value)}
          className={cn(
            'flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 font-bold shadow-soft transition outline-none focus-visible:ring-4 focus-visible:ring-white',
            captions ? 'bg-white text-navy-900' : 'bg-navy-950/60 text-white backdrop-blur',
          )}
        >
          <Captions aria-hidden className="size-5" />
          {/* Icon only on phones: the label would cover the play button. */}
          <span className="sr-only sm:not-sr-only">{t('Show the words')}</span>
        </button>
        {playing && (
          <button
            type="button"
            onClick={stop}
            className="flex size-11 items-center justify-center rounded-xl bg-navy-950/60 text-white shadow-soft backdrop-blur transition outline-none focus-visible:ring-4 focus-visible:ring-white"
          >
            <Square aria-hidden className="size-5 fill-current" />
            <span className="sr-only">{t('Stop')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
