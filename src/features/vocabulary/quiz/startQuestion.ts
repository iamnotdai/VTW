import { getAllWordIds, getWord } from '@/data/content';
import { createQuizQuestion } from '@/lib/quiz';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Scene, Word } from '@/types/models';
import { useQuizSessionStore } from './quizSession';

/**
 * Creates a new question for `word` using the CURRENT profile/settings — so changing
 * "Can you type words?" in Settings applies to the very next question (spec §18) — and starts
 * a quiz session with it. Its prompt is never one of the last few asked.
 */
export function startQuestion(scene: Scene, word: Word): void {
  const canTypeWords = useProfileStore.getState().profile?.canTypeWords ?? false;
  const { quizTypingProbability } = useSettingsStore.getState().settings;
  const question = createQuizQuestion({
    sceneId: scene.id,
    word,
    getWord,
    sceneWordIds: scene.wordIds,
    allWordIds: getAllWordIds(),
    canTypeWords,
    typingProbability: quizTypingProbability,
    recentPromptIds: useQuizSessionStore.getState().recentPromptIds,
  });
  useQuizSessionStore.getState().start(question);
}
