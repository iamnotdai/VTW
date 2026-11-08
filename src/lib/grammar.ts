import type { GrammarExercise, GrammarProgress, GrammarTopic } from '@/types/models';
import { shuffle, type RandomFn } from './random';
import { normalizeAnswer } from './text';

/**
 * Grammar (spec §25), English course only and optional: progress per tense counts an exercise
 * once, after a right answer — never toward the Level or a scene's %.
 */

export function createEmptyGrammarProgress(now: Date = new Date()): GrammarProgress {
  return { correctExerciseIdsByTopic: {}, updatedAt: now.toISOString() };
}

/** Call after a RIGHT answer only (not when the answer was shown). Same object if already counted. */
export function markGrammarExercise(
  progress: GrammarProgress,
  topicId: string,
  exerciseId: string,
  now: Date = new Date(),
): GrammarProgress {
  const done = progress.correctExerciseIdsByTopic[topicId] ?? [];
  if (done.includes(exerciseId)) return progress;
  return {
    correctExerciseIdsByTopic: {
      ...progress.correctExerciseIdsByTopic,
      [topicId]: [...done, exerciseId],
    },
    updatedAt: now.toISOString(),
  };
}

/** Share of the topic's exercises answered right (only exercises that still exist count). */
export function getGrammarTopicPercent(progress: GrammarProgress, topic: GrammarTopic): number {
  if (topic.exercises.length === 0) return 0;
  const done = new Set(progress.correctExerciseIdsByTopic[topic.id] ?? []);
  const count = topic.exercises.filter((exercise) => done.has(exercise.id)).length;
  return Math.round((count / topic.exercises.length) * 100);
}

export function mergeGrammarProgress(a: GrammarProgress, b: GrammarProgress): GrammarProgress {
  const result: Record<string, string[]> = {};
  for (const key of new Set([
    ...Object.keys(a.correctExerciseIdsByTopic),
    ...Object.keys(b.correctExerciseIdsByTopic),
  ])) {
    result[key] = [
      ...new Set([
        ...(a.correctExerciseIdsByTopic[key] ?? []),
        ...(b.correctExerciseIdsByTopic[key] ?? []),
      ]),
    ];
  }
  return {
    correctExerciseIdsByTopic: result,
    updatedAt: a.updatedAt > b.updatedAt ? a.updatedAt : b.updatedAt,
  };
}

export function sanitizeGrammarProgress(raw: unknown): GrammarProgress | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const byTopic = record.correctExerciseIdsByTopic;
  const correctExerciseIdsByTopic: Record<string, string[]> = {};
  if (typeof byTopic === 'object' && byTopic !== null && !Array.isArray(byTopic)) {
    for (const [topicId, ids] of Object.entries(byTopic)) {
      if (!Array.isArray(ids)) continue;
      const valid = [
        ...new Set(ids.filter((id): id is string => typeof id === 'string' && id !== '')),
      ];
      if (valid.length > 0) correctExerciseIdsByTopic[topicId] = valid;
    }
  }
  return {
    correctExerciseIdsByTopic,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date(0).toISOString(),
  };
}

/* Exercises ----------------------------------------------------------------------------------- */

/** The answer of a choice question: the word for the gap, or the sentence that was heard. */
export function exerciseAnswer(exercise: GrammarExercise): string {
  return exercise.kind === 'choose' ? exercise.answer : exercise.sentence;
}

/** Choices compare like quiz answers: case and extra spaces don't matter. */
export function isGrammarChoiceRight(exercise: GrammarExercise, choice: string): boolean {
  return normalizeAnswer(choice) === normalizeAnswer(exerciseAnswer(exercise));
}

/** The words of an "order" sentence, as written (capital letter and full stop stay on their tile). */
export function sentenceTiles(sentence: string): string[] {
  return sentence.trim().split(/\s+/);
}

export interface OrderTile {
  /** Stable key: the word's position in the sentence (words like "the" can repeat). */
  id: number;
  text: string;
}

/**
 * The tiles of an "order" exercise, shuffled once per question — never already in the right
 * order when the words can be shuffled at all.
 */
export function shuffledTiles(sentence: string, random: RandomFn = Math.random): OrderTile[] {
  const tiles = sentenceTiles(sentence).map((text, id) => ({ id, text }));
  const words = (list: OrderTile[]) => list.map((tile) => tile.text).join(' ');
  const canChange = new Set(tiles.map((tile) => tile.text)).size > 1;
  let result = shuffle(tiles, random);
  for (let tries = 0; canChange && words(result) === words(tiles) && tries < 20; tries += 1) {
    result = shuffle(tiles, random);
  }
  if (canChange && words(result) === words(tiles)) result = [...tiles.slice(1), tiles[0]];
  return result;
}

/** The tapped words make the sentence (the exact words, in order). */
export function isOrderRight(sentence: string, tiles: readonly string[]): boolean {
  return tiles.join(' ') === sentenceTiles(sentence).join(' ');
}
