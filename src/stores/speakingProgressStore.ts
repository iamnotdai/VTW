import { create } from 'zustand';
import { getActiveCourse } from '@/lib/course';
import { getSpeakingRepository } from '@/lib/repositories';
import {
  createEmptySpeakingProgress,
  mergeSpeakingProgress,
  recordSpeakingScore,
} from '@/lib/speakingProgress';
import type { SpeakingProgress } from '@/types/models';

interface SpeakingProgressState {
  speaking: SpeakingProgress;
  /** Keeps the word's best score. Never marks the word as learned (spec §7.7). */
  recordScore: (wordId: string, score: number) => void;
  /** Re-reads storage, e.g. after another tab saved or the course changed. */
  reload: () => void;
}

/** Pronunciation scores of the active course (spec §24.1). */
const repository = () => getSpeakingRepository(getActiveCourse());
const loadSpeaking = () => repository().load() ?? createEmptySpeakingProgress();

export const useSpeakingProgressStore = create<SpeakingProgressState>()((set, get) => ({
  speaking: loadSpeaking(),
  recordScore: (wordId, score) => {
    const next = recordSpeakingScore(get().speaking, wordId, score);
    if (next === get().speaking) return;
    // Merge with what another tab may have saved meanwhile.
    const stored = repository().load();
    const merged = stored ? mergeSpeakingProgress(stored, next) : next;
    repository().save(merged);
    set({ speaking: merged });
  },
  reload: () => set({ speaking: loadSpeaking() }),
}));
