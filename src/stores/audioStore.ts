import { create } from 'zustand';
import { playSound, stopSound, type SoundRequest } from '@/lib/speech';
import { useSettingsStore } from './settingsStore';

interface AudioState {
  /** Identifies the button/line currently playing, e.g. "word:lamp". */
  playingKey: string | null;
  /**
   * Plays a sound unless sound is turned off in Settings. Stops any other sound first. `onEnd` runs
   * when it finished playing, `onError` when it could not be played at all (e.g. no voice).
   */
  play: (key: string, request: SoundRequest, onEnd?: () => void, onError?: () => void) => void;
  stop: () => void;
}

export const useAudioStore = create<AudioState>()((set, get) => ({
  playingKey: null,
  play: (key, request, onEnd, onError) => {
    const { soundEnabled, voiceURI, voiceStyle } = useSettingsStore.getState().settings;
    if (!soundEnabled) return;
    const finish = () => {
      if (get().playingKey === key) set({ playingKey: null });
    };
    // Set the key first: playback may fail synchronously and call `finish` immediately.
    set({ playingKey: key });
    playSound(
      { voiceURI, voiceStyle, ...request },
      {
        onEnd: () => {
          finish();
          onEnd?.();
        },
        onError: () => {
          finish();
          onError?.();
        },
      },
    );
  },
  stop: () => {
    stopSound();
    set({ playingKey: null });
  },
}));
