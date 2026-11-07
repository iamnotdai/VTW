import { SPEAKING_SCORE } from '@/config/app';

/**
 * Word Speaking round (spec §7.7): the scene's words one by one; each keeps its best result.
 * Kept in memory only — leaving the screen starts a new round next time.
 */
export type WordSpeakingResult =
  | { kind: 'scored'; score: number }
  /** Listen & Repeat fallback: said out loud without a microphone score. */
  | { kind: 'practiced' }
  | { kind: 'skipped' };

export interface WordSpeakingState {
  /** Word ids of this round, in order. */
  queue: string[];
  position: number;
  /** Best result of each word over all rounds. */
  results: Record<string, WordSpeakingResult>;
  finished: boolean;
  /** Increases on every restart (remounts the word card). */
  round: number;
}

export type WordSpeakingAction =
  | { type: 'record'; wordId: string; result: WordSpeakingResult }
  | { type: 'next' }
  | { type: 'restart'; queue: string[] };

export function createWordSpeakingState(queue: string[]): WordSpeakingState {
  return { queue, position: 0, results: {}, finished: queue.length === 0, round: 0 };
}

const RANK = { skipped: 0, practiced: 1, scored: 2 } as const;

/** A score beats Listen & Repeat, which beats a skip; between scores the higher one wins. */
export function betterResult(
  current: WordSpeakingResult | undefined,
  next: WordSpeakingResult,
): WordSpeakingResult {
  if (!current || RANK[next.kind] > RANK[current.kind]) return next;
  if (current.kind === 'scored' && next.kind === 'scored' && next.score > current.score)
    return next;
  return current;
}

export function wordSpeakingReducer(
  state: WordSpeakingState,
  action: WordSpeakingAction,
): WordSpeakingState {
  switch (action.type) {
    case 'record':
      return {
        ...state,
        results: {
          ...state.results,
          [action.wordId]: betterResult(state.results[action.wordId], action.result),
        },
      };
    case 'next': {
      if (state.finished) return state;
      const position = state.position + 1;
      return position >= state.queue.length ? { ...state, finished: true } : { ...state, position };
    }
    case 'restart':
      return {
        ...state,
        queue: action.queue,
        position: 0,
        finished: action.queue.length === 0,
        round: state.round + 1,
      };
  }
}

export interface WordSpeakingSummary {
  /** Average best score of the scored words, or `null` when none was scored. */
  average: number | null;
  great: number;
  good: number;
  tryAgain: number;
  practiced: number;
  skipped: number;
}

export function summarizeWordSpeaking(
  results: Readonly<Record<string, WordSpeakingResult>>,
  wordIds: readonly string[],
): WordSpeakingSummary {
  const summary: WordSpeakingSummary = {
    average: null,
    great: 0,
    good: 0,
    tryAgain: 0,
    practiced: 0,
    skipped: 0,
  };
  const scores: number[] = [];
  for (const id of wordIds) {
    const result = results[id];
    if (!result || result.kind === 'skipped') summary.skipped += 1;
    else if (result.kind === 'practiced') summary.practiced += 1;
    else {
      scores.push(result.score);
      if (result.score >= SPEAKING_SCORE.great) summary.great += 1;
      else if (result.score >= SPEAKING_SCORE.good) summary.good += 1;
      else summary.tryAgain += 1;
    }
  }
  if (scores.length > 0) {
    summary.average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }
  return summary;
}

/** Words worth another try: skipped, or scored under "Excellent". */
export function trickyWordIds(
  results: Readonly<Record<string, WordSpeakingResult>>,
  wordIds: readonly string[],
): string[] {
  return wordIds.filter((id) => {
    const result = results[id];
    if (!result || result.kind === 'skipped') return true;
    return result.kind === 'scored' && result.score < SPEAKING_SCORE.great;
  });
}
