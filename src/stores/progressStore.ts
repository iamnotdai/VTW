import { create } from 'zustand';
import {
  createEmptyProgress,
  isWordCompleted,
  markConversationCompleted,
  markSceneCelebrated,
  markWordCompleted,
  mergeProgress,
  resetSceneRound,
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
  /** The "Completed!" popup was shown for this scene; it stays closed until the next round. */
  celebrateScene: (sceneId: string) => void;
  /** Starts the scene's Explore over. Learned words (% and level) are kept. */
  resetScene: (sceneId: string) => void;
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
    celebrateScene: (sceneId) => commit(markSceneCelebrated(get().progress, sceneId)),
    resetScene: (sceneId) => {
      // Saved as is: `commit` merges lists by union and would bring the found objects back.
      const next = resetSceneRound(get().progress, sceneId);
      progressRepository.save(next);
      set({ progress: next });
    },
    reload: () => set({ progress: loadProgress() }),
  };
});
