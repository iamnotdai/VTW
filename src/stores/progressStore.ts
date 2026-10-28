import { create } from 'zustand';
import {
  createEmptyProgress,
  isWordCompleted,
  markConversationCompleted,
  markWordCompleted,
  mergeProgress,
  setLastFlashcardIndex,
  setLastVisitedScene,
  toggleFavoriteWord,
} from '@/lib/progress';
import { progressRepository } from '@/lib/repositories';
import type { LearningProgress } from '@/types/models';

interface ProgressState {
  progress: LearningProgress;
  /** Call after a CORRECT answer only. Returns `true` the first time the word is completed. */
  completeWord: (sceneId: string, wordId: string) => boolean;
  completeConversation: (conversationId: string) => void;
  setFlashcardIndex: (sceneId: string, index: number) => void;
  visitScene: (sceneId: string) => void;
  toggleFavorite: (wordId: string) => void;
  reload: () => void;
}

const loadProgress = () => progressRepository.load() ?? createEmptyProgress();

export const useProgressStore = create<ProgressState>()((set, get) => {
  const commit = (next: LearningProgress) => {
    if (next === get().progress) return;
    // Merge with what another tab may have saved meanwhile, so learned items are never lost.
    const stored = progressRepository.load();
    const merged = stored ? mergeProgress(stored, next) : next;
    progressRepository.save(merged);
    set({ progress: merged });
  };

  return {
    progress: loadProgress(),
    completeWord: (sceneId, wordId) => {
      const wasCompleted = isWordCompleted(get().progress, sceneId, wordId);
      commit(markWordCompleted(get().progress, sceneId, wordId));
      return !wasCompleted;
    },
    completeConversation: (conversationId) =>
      commit(markConversationCompleted(get().progress, conversationId)),
    setFlashcardIndex: (sceneId, index) =>
      commit(setLastFlashcardIndex(get().progress, sceneId, index)),
    visitScene: (sceneId) => commit(setLastVisitedScene(get().progress, sceneId)),
    toggleFavorite: (wordId) => commit(toggleFavoriteWord(get().progress, wordId)),
    reload: () => set({ progress: loadProgress() }),
  };
});
