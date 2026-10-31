import { create } from 'zustand';
import { QUIZ_CONFIG } from '@/config/app';
import { isChoiceCorrect, isTypedAnswerCorrect, type QuizQuestion } from '@/lib/quiz';
import type { Word } from '@/types/models';

/**
 * Quiz part of the Explore state machine (spec §16):
 *
 *   QUIZ_READY ("answering") ── wrong ──▶ QUIZ_INCORRECT ── Try Again ──▶ QUIZ_READY
 *        │                                     └── Show Answer ──▶ REVEALED (no progress)
 *        └── right ──▶ QUIZ_CORRECT ──▶ WORD_DETAIL ── Next Object ──▶ SCENE_READY
 *
 * The question (answer mode + option order) is created once and never changes until the
 * session ends, whatever happens to the components that render it.
 */
export type QuizStatus = 'answering' | 'incorrect' | 'correct' | 'revealed';

export interface QuizSession {
  question: QuizQuestion;
  status: QuizStatus;
  attempts: number;
  /** Last submitted answer (typed text or chosen word id). */
  lastAnswer: string | null;
  /** Set after a correct answer: `true` when it completed the word for the first time. */
  newlyCompleted?: boolean;
}

export type QuizAnswer = { kind: 'typed'; text: string } | { kind: 'choice'; wordId: string };

export type QuizAction =
  { type: 'submit'; answer: QuizAnswer; word: Word } | { type: 'retry' } | { type: 'reveal' };

export function createSession(question: QuizQuestion): QuizSession {
  return { question, status: 'answering', attempts: 0, lastAnswer: null };
}

/** Pure reducer — easy to unit test and impossible to put into contradictory states. */
export function quizReducer(session: QuizSession, action: QuizAction): QuizSession {
  switch (action.type) {
    case 'submit': {
      if (session.status !== 'answering') return session;
      const correct =
        action.answer.kind === 'typed'
          ? isTypedAnswerCorrect(action.word, action.answer.text)
          : isChoiceCorrect(session.question, action.answer.wordId);
      return {
        ...session,
        status: correct ? 'correct' : 'incorrect',
        attempts: session.attempts + 1,
        lastAnswer: action.answer.kind === 'typed' ? action.answer.text : action.answer.wordId,
      };
    }
    case 'retry':
      return session.status === 'incorrect' ? { ...session, status: 'answering' } : session;
    case 'reveal':
      return session.status === 'incorrect' ? { ...session, status: 'revealed' } : session;
  }
}

interface QuizSessionState {
  session: QuizSession | null;
  /** Prompt ids of the latest questions (oldest first, in memory only) so prompts don't repeat. */
  recentPromptIds: readonly string[];
  start: (question: QuizQuestion) => void;
  dispatch: (action: QuizAction) => QuizSession | null;
  setNewlyCompleted: (newlyCompleted: boolean) => void;
  clear: () => void;
}

export const useQuizSessionStore = create<QuizSessionState>()((set, get) => ({
  session: null,
  recentPromptIds: [],
  start: (question) =>
    set((state) => ({
      session: createSession(question),
      recentPromptIds: [...state.recentPromptIds, question.prompt.id].slice(
        -QUIZ_CONFIG.promptNoRepeatWindow,
      ),
    })),
  dispatch: (action) => {
    const current = get().session;
    if (!current) return null;
    const next = quizReducer(current, action);
    if (next !== current) set({ session: next });
    return next;
  },
  setNewlyCompleted: (newlyCompleted) => {
    const current = get().session;
    if (current) set({ session: { ...current, newlyCompleted } });
  },
  clear: () => set({ session: null }),
}));

export function isSessionFor(
  session: QuizSession | null,
  sceneId: string,
  wordId: string,
): session is QuizSession {
  return !!session && session.question.sceneId === sceneId && session.question.wordId === wordId;
}
