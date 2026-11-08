import { create } from 'zustand';
import {
  createEmptyGrammarProgress,
  markGrammarExercise,
  mergeGrammarProgress,
} from '@/lib/grammar';
import { grammarRepository } from '@/lib/repositories';
import type { GrammarProgress } from '@/types/models';

interface GrammarProgressState {
  grammar: GrammarProgress;
  /** Call after a RIGHT answer only. Counted once per exercise (spec §25). */
  completeExercise: (topicId: string, exerciseId: string) => void;
  /** Re-reads storage, e.g. after another tab saved. */
  reload: () => void;
}

const loadGrammar = () => grammarRepository.load() ?? createEmptyGrammarProgress();

/** Grammar progress (English course only). Never part of the Level or the Vocabulary %. */
export const useGrammarProgressStore = create<GrammarProgressState>()((set, get) => ({
  grammar: loadGrammar(),
  completeExercise: (topicId, exerciseId) => {
    const next = markGrammarExercise(get().grammar, topicId, exerciseId);
    if (next === get().grammar) return;
    const stored = grammarRepository.load();
    const merged = stored ? mergeGrammarProgress(stored, next) : next;
    grammarRepository.save(merged);
    set({ grammar: merged });
  },
  reload: () => set({ grammar: loadGrammar() }),
}));
