import { LEVEL_CONFIG } from '@/config/app';
import type { LearningProgress } from '@/types/models';

export function createEmptyProgress(now: Date = new Date()): LearningProgress {
  return {
    completedWordIdsByScene: {},
    foundWordIdsByScene: {},
    completedConversationIds: [],
    lastFlashcardIndexByScene: {},
    favoriteWordIds: [],
    updatedAt: now.toISOString(),
  };
}

/** Spec §11.2 — only words that belong to the scene count, so the result never exceeds 100%. */
export function getSceneProgressPercent(
  sceneWordIds: readonly string[],
  completedWordIds: readonly string[],
): number {
  if (sceneWordIds.length === 0) return 0;
  return Math.round(
    (getCompletedCount(sceneWordIds, completedWordIds) / sceneWordIds.length) * 100,
  );
}

export function getCompletedCount(
  sceneWordIds: readonly string[],
  completedWordIds: readonly string[],
): number {
  const done = new Set(completedWordIds);
  return new Set(sceneWordIds.filter((id) => done.has(id))).size;
}

const EMPTY: readonly string[] = Object.freeze([]);

export function getCompletedWordIds(
  progress: LearningProgress,
  sceneId: string,
): readonly string[] {
  return progress.completedWordIdsByScene[sceneId] ?? EMPTY;
}

export function getFoundWordIds(progress: LearningProgress, sceneId: string): readonly string[] {
  return progress.foundWordIdsByScene[sceneId] ?? EMPTY;
}

export function isWordCompleted(
  progress: LearningProgress,
  sceneId: string,
  wordId: string,
): boolean {
  return getCompletedWordIds(progress, sceneId).includes(wordId);
}

/**
 * Marks a word as learned after a CORRECT answer. Per the MVP rule (spec §11.2) the word is added
 * to both `completed` and `found` so "Objects Found" and the % never disagree.
 * Idempotent: returns the same object when the word was already completed.
 */
export function markWordCompleted(
  progress: LearningProgress,
  sceneId: string,
  wordId: string,
  now: Date = new Date(),
): LearningProgress {
  const completed = getCompletedWordIds(progress, sceneId);
  const found = getFoundWordIds(progress, sceneId);
  if (completed.includes(wordId) && found.includes(wordId)) return progress;

  return {
    ...progress,
    completedWordIdsByScene: {
      ...progress.completedWordIdsByScene,
      [sceneId]: completed.includes(wordId) ? [...completed] : [...completed, wordId],
    },
    foundWordIdsByScene: {
      ...progress.foundWordIdsByScene,
      [sceneId]: found.includes(wordId) ? [...found] : [...found, wordId],
    },
    updatedAt: now.toISOString(),
  };
}

/** Call when the learner finishes the last step of a conversation — not when the video opens. */
export function markConversationCompleted(
  progress: LearningProgress,
  conversationId: string,
  now: Date = new Date(),
): LearningProgress {
  if (progress.completedConversationIds.includes(conversationId)) return progress;
  return {
    ...progress,
    completedConversationIds: [...progress.completedConversationIds, conversationId],
    updatedAt: now.toISOString(),
  };
}

export function setLastFlashcardIndex(
  progress: LearningProgress,
  sceneId: string,
  index: number,
  now: Date = new Date(),
): LearningProgress {
  const safeIndex = Math.max(0, Math.floor(index));
  if (progress.lastFlashcardIndexByScene[sceneId] === safeIndex) return progress;
  return {
    ...progress,
    lastFlashcardIndexByScene: { ...progress.lastFlashcardIndexByScene, [sceneId]: safeIndex },
    updatedAt: now.toISOString(),
  };
}

export function setLastVisitedScene(
  progress: LearningProgress,
  sceneId: string,
  now: Date = new Date(),
): LearningProgress {
  if (progress.lastVisitedSceneId === sceneId) return progress;
  return { ...progress, lastVisitedSceneId: sceneId, updatedAt: now.toISOString() };
}

/** Hearts / un-hearts a word on its flashcard. */
export function toggleFavoriteWord(
  progress: LearningProgress,
  wordId: string,
  now: Date = new Date(),
): LearningProgress {
  const favorites = progress.favoriteWordIds;
  return {
    ...progress,
    favoriteWordIds: favorites.includes(wordId)
      ? favorites.filter((id) => id !== wordId)
      : [...favorites, wordId],
    updatedAt: now.toISOString(),
  };
}

/** Number of different words learned in every scene. */
export function getTotalCompletedWords(progress: LearningProgress): number {
  return new Set(Object.values(progress.completedWordIdsByScene).flat()).size;
}

/**
 * Learner level shown under the name: Level 1 to start, +1 for every `wordsPerLevel` words
 * learned. Always derived from the stored learned words, never stored itself.
 */
export function getLearnerLevel(
  progress: LearningProgress,
  wordsPerLevel: number = LEVEL_CONFIG.wordsPerLevel,
): number {
  if (wordsPerLevel <= 0) return 1;
  return 1 + Math.floor(getTotalCompletedWords(progress) / wordsPerLevel);
}

/** Merges two progress snapshots (e.g. another tab saved meanwhile) without losing learned items. */
export function mergeProgress(a: LearningProgress, b: LearningProgress): LearningProgress {
  const [older, newer] = a.updatedAt > b.updatedAt ? [b, a] : [a, b];
  return {
    completedWordIdsByScene: mergeRecordOfLists(
      a.completedWordIdsByScene,
      b.completedWordIdsByScene,
    ),
    foundWordIdsByScene: mergeRecordOfLists(a.foundWordIdsByScene, b.foundWordIdsByScene),
    completedConversationIds: unique([
      ...a.completedConversationIds,
      ...b.completedConversationIds,
    ]),
    lastVisitedSceneId: newer.lastVisitedSceneId ?? older.lastVisitedSceneId,
    lastFlashcardIndexByScene: {
      ...older.lastFlashcardIndexByScene,
      ...newer.lastFlashcardIndexByScene,
    },
    // Hearts can be removed, so the newest list wins instead of a union.
    favoriteWordIds: [...newer.favoriteWordIds],
    updatedAt: newer.updatedAt,
  };
}

function mergeRecordOfLists(
  a: Record<string, string[]>,
  b: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    result[key] = unique([...(a[key] ?? []), ...(b[key] ?? [])]);
  }
  return result;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/** Validates data read from storage. Returns `null` when it is unusable. */
export function sanitizeProgress(raw: unknown): LearningProgress | null {
  if (!isPlainObject(raw)) return null;
  return {
    completedWordIdsByScene: sanitizeRecordOfLists(raw.completedWordIdsByScene),
    foundWordIdsByScene: sanitizeRecordOfLists(raw.foundWordIdsByScene),
    completedConversationIds: sanitizeStringList(raw.completedConversationIds),
    lastVisitedSceneId:
      typeof raw.lastVisitedSceneId === 'string' ? raw.lastVisitedSceneId : undefined,
    lastFlashcardIndexByScene: sanitizeIndexRecord(raw.lastFlashcardIndexByScene),
    favoriteWordIds: sanitizeStringList(raw.favoriteWordIds),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(0).toISOString(),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return unique(value.filter((item): item is string => typeof item === 'string' && item !== ''));
}

function sanitizeRecordOfLists(value: unknown): Record<string, string[]> {
  if (!isPlainObject(value)) return {};
  const result: Record<string, string[]> = {};
  for (const [key, list] of Object.entries(value)) result[key] = sanitizeStringList(list);
  return result;
}

function sanitizeIndexRecord(value: unknown): Record<string, number> {
  if (!isPlainObject(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, index] of Object.entries(value)) {
    if (typeof index === 'number' && Number.isInteger(index) && index >= 0) result[key] = index;
  }
  return result;
}
