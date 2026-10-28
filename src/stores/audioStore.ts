import { create } from 'zustand';
import { playSound, stopSound, type SoundRequest } from '@/lib/speech';
import { useSettingsStore } from './settingsStore';

interface AudioState {
  /** Identifies the button/line currently playing, e.g. "word:lamp". */
  playingKey: string | null;
  /** Plays a sound unless sound is turned off in Settings. Stops any other sound first. */
  play: (key: string, request: SoundRequest, onEnd?: () => void) => void;
  stop: () => void;
}

export const useAudioStore = create<AudioState>()((set, get) => ({
  playingKey: null,
  play: (key, request, onEnd) => {
    if (!useSettingsStore.getState().settings.soundEnabled) return;
    const finish = () => {
      if (get().playingKey === key) set({ playingKey: null });
    };
    // Set the key first: playback may fail synchronously and call `finish` immediately.
    set({ playingKey: key });
    playSound(request, {
      onEnd: () => {
        finish();
        onEnd?.();
      },
      onError: finish,
    });
  },
  stop: () => {
    stopSound();
    set({ playingKey: null });
  },
}));
