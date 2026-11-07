import { SPEAKING_SCORE } from '@/config/app';
import type { SpeakingProgress } from '@/types/models';

/**
 * Pronunciation progress (spec §24.1): the best Word Speaking score of each word. It is a separate
 * figure — it never marks a word as learned and never changes the Vocabulary % or the Level.
 */

export function createEmptySpeakingProgress(now: Date = new Date()): SpeakingProgress {
  return { bestScoreByWordId: {}, updatedAt: now.toISOString() };
}

const isScore = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

/** Keeps the higher score. Returns the same object when nothing changed. */
export function recordSpeakingScore(
  progress: SpeakingProgress,
  wordId: string,
  score: number,
  now: Date = new Date(),
): SpeakingProgress {
  if (!wordId || !isScore(score)) return progress;
  const rounded = Math.round(score);
  if ((progress.bestScoreByWordId[wordId] ?? -1) >= rounded) return progress;
  return {
    bestScoreByWordId: { ...progress.bestScoreByWordId, [wordId]: rounded },
    updatedAt: now.toISOString(),
  };
}

export interface SceneSpeakingStats {
  total: number;
  /** Words whose best score reaches `threshold` ("Excellent!"). */
  saidWell: number;
  percent: number;
}

export function getSceneSpeakingStats(
  progress: SpeakingProgress,
  sceneWordIds: readonly string[],
  threshold: number = SPEAKING_SCORE.great,
): SceneSpeakingStats {
  const total = sceneWordIds.length;
  const saidWell = sceneWordIds.filter(
    (id) => (progress.bestScoreByWordId[id] ?? -1) >= threshold,
  ).length;
  return { total, saidWell, percent: total === 0 ? 0 : Math.round((saidWell / total) * 100) };
}

/** Combines two saved versions (e.g. two tabs): the higher score of each word wins. */
export function mergeSpeakingProgress(a: SpeakingProgress, b: SpeakingProgress): SpeakingProgress {
  const bestScoreByWordId = { ...a.bestScoreByWordId };
  for (const [id, score] of Object.entries(b.bestScoreByWordId)) {
    bestScoreByWordId[id] = Math.max(bestScoreByWordId[id] ?? 0, score);
  }
  return { bestScoreByWordId, updatedAt: a.updatedAt > b.updatedAt ? a.updatedAt : b.updatedAt };
}

/** Validates data read from storage. Returns `null` when it is unusable. */
export function sanitizeSpeakingProgress(raw: unknown): SpeakingProgress | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const scores = record.bestScoreByWordId;
  const bestScoreByWordId: Record<string, number> = {};
  if (typeof scores === 'object' && scores !== null && !Array.isArray(scores)) {
    for (const [id, score] of Object.entries(scores)) {
      if (id && isScore(score)) bestScoreByWordId[id] = Math.round(score);
    }
  }
  return {
    bestScoreByWordId,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date(0).toISOString(),
  };
}
