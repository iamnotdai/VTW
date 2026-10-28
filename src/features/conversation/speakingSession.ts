import { create } from 'zustand';

/**
 * Speaking Practice flow (spec §9.4): practice question → result → retry / next → finish.
 * Kept in memory only — no recording or transcript is ever stored or uploaded.
 */
export interface SpeakingResult {
  questionId: string;
  /** "speech": the browser recognized words; "practiced": Listen & Repeat fallback. */
  mode: 'speech' | 'practiced';
  /** Recognized alternatives, best first (speech mode). */
  heard?: string[];
}

interface SpeakingSessionState {
  conversationId: string | null;
  questionIndex: number;
  result: SpeakingResult | null;
  /** Starts (or continues) practicing a conversation. */
  begin: (conversationId: string) => void;
  setResult: (result: SpeakingResult) => void;
  retry: () => void;
  next: () => void;
  reset: () => void;
}

export const useSpeakingSessionStore = create<SpeakingSessionState>()((set, get) => ({
  conversationId: null,
  questionIndex: 0,
  result: null,
  begin: (conversationId) => {
    if (get().conversationId !== conversationId) {
      set({ conversationId, questionIndex: 0, result: null });
    }
  },
  setResult: (result) => set({ result }),
  retry: () => set({ result: null }),
  next: () => set((state) => ({ questionIndex: state.questionIndex + 1, result: null })),
  reset: () => set({ conversationId: null, questionIndex: 0, result: null }),
}));
