import { useCallback, useEffect, useRef, useState } from 'react';
import { getSpeaker } from '@/data/content';
import { optionalAssetUrl } from '@/lib/assets';
import { useAudioStore } from '@/stores/audioStore';
import type { Conversation } from '@/types/models';

const lineKey = (lineId: string) => `line:${lineId}`;

/**
 * Plays the whole conversation, one line after the other (recorded audio, else the browser voice
 * with each speaker's pitch). `index` is the line being spoken, `null` when not playing — another
 * sound starting stops the conversation. `onEnded` runs after the last line. Leaving the screen
 * stops it.
 */
export function usePlayConversation(conversation: Conversation, onEnded?: () => void) {
  const playingKey = useAudioStore((state) => state.playingKey);
  const [index, setIndex] = useState<number | null>(null);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const line = index === null ? undefined : conversation.lines[index];
  const playing = !!line && playingKey === lineKey(line.id);

  const playFrom = useCallback(
    (from: number) => {
      function playLine(at: number) {
        const next = conversation.lines[at];
        if (!next) {
          setIndex(null);
          onEndedRef.current?.();
          return;
        }
        setIndex(at);
        const voice = getSpeaker(next.speakerId)?.voice;
        useAudioStore.getState().play(
          lineKey(next.id),
          {
            text: next.text,
            src: optionalAssetUrl(next.audio),
            pitch: voice?.pitch,
            rate: voice?.rate,
          },
          () => playLine(at + 1),
          () => setIndex(null),
        );
      }
      playLine(from);
    },
    [conversation],
  );

  const stop = useCallback(() => {
    useAudioStore.getState().stop();
    setIndex(null);
  }, []);

  // Leaving the screen while the conversation plays stops it.
  const playingRef = useRef(false);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(
    () => () => {
      if (playingRef.current) useAudioStore.getState().stop();
    },
    [],
  );

  return {
    playing,
    /** The line being spoken, while playing. */
    index: playing ? index : null,
    start: useCallback(() => playFrom(0), [playFrom]),
    stop,
  };
}
