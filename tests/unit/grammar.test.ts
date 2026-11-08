import { describe, expect, it } from 'vitest';
import { contentByCourse } from '@/data/content';
import { validateContent } from '@/data/validateContent';
import {
  createEmptyGrammarProgress,
  getGrammarTopicPercent,
  isGrammarChoiceRight,
  isOrderRight,
  markGrammarExercise,
  mergeGrammarProgress,
  sanitizeGrammarProgress,
  sentenceTiles,
  shuffledTiles,
} from '@/lib/grammar';
import { createSeededRandom } from '@/lib/random';
import type { GrammarExercise, GrammarTopic } from '@/types/models';

const NOW = new Date('2026-11-08T10:00:00.000Z');
const english = contentByCourse.en;
const topic = (id: string) => english.grammarTopics.find((item) => item.id === id)!;

describe('grammar progress (spec §25)', () => {
  it('counts an exercise once, after a right answer', () => {
    let progress = createEmptyGrammarProgress(NOW);
    progress = markGrammarExercise(progress, 'present-simple', 'ps-1', NOW);
    expect(markGrammarExercise(progress, 'present-simple', 'ps-1', NOW)).toBe(progress);
    progress = markGrammarExercise(progress, 'present-simple', 'ps-2', NOW);
    expect(getGrammarTopicPercent(progress, topic('present-simple'))).toBe(20);
    expect(getGrammarTopicPercent(progress, topic('present-perfect'))).toBe(0);
  });

  it('ignores ids of exercises that no longer exist', () => {
    const progress = markGrammarExercise(
      createEmptyGrammarProgress(NOW),
      'past-simple',
      'gone',
      NOW,
    );
    expect(getGrammarTopicPercent(progress, topic('past-simple'))).toBe(0);
  });

  it('merges two saved versions and sanitizes stored data', () => {
    const a = markGrammarExercise(createEmptyGrammarProgress(NOW), 't', 'e1', NOW);
    const b = markGrammarExercise(createEmptyGrammarProgress(NOW), 't', 'e2', NOW);
    expect(mergeGrammarProgress(a, b).correctExerciseIdsByTopic).toEqual({ t: ['e1', 'e2'] });
    expect(sanitizeGrammarProgress(null)).toBeNull();
    expect(
      sanitizeGrammarProgress({ correctExerciseIdsByTopic: { t: ['e1', 'e1', 3, ''], u: 'x' } }),
    ).toEqual({ correctExerciseIdsByTopic: { t: ['e1'] }, updatedAt: new Date(0).toISOString() });
  });
});

describe('exercises', () => {
  const choose: GrammarExercise = {
    id: 'x',
    kind: 'choose',
    sentence: 'She ___ her teeth.',
    options: ['brush', 'brushes'],
    answer: 'brushes',
    textVi: '',
  };

  it('checks a choice and the heard sentence', () => {
    expect(isGrammarChoiceRight(choose, 'brushes')).toBe(true);
    expect(isGrammarChoiceRight(choose, ' Brushes ')).toBe(true);
    expect(isGrammarChoiceRight(choose, 'brush')).toBe(false);
    const heard: GrammarExercise = {
      id: 'y',
      kind: 'listen-choose',
      sentence: 'Dad washed the car.',
      options: ['Dad washed the car.', 'Dad washes the car.'],
      textVi: '',
    };
    expect(isGrammarChoiceRight(heard, 'Dad washed the car.')).toBe(true);
    expect(isGrammarChoiceRight(heard, 'Dad washes the car.')).toBe(false);
  });

  it('shuffles the tiles of an order sentence, never already in order', () => {
    const sentence = 'I water the plants every day.';
    expect(sentenceTiles(sentence)).toEqual(['I', 'water', 'the', 'plants', 'every', 'day.']);
    for (let seed = 0; seed < 50; seed += 1) {
      const tiles = shuffledTiles(sentence, createSeededRandom(seed));
      expect(tiles.map((tile) => tile.text).sort()).toEqual(sentenceTiles(sentence).sort());
      expect(
        isOrderRight(
          sentence,
          tiles.map((tile) => tile.text),
        ),
      ).toBe(false);
    }
    expect(isOrderRight(sentence, sentenceTiles(sentence))).toBe(true);
  });
});

describe('grammar content', () => {
  it('has the 12 tenses in chart order; 4 lessons are ready', () => {
    expect(english.grammarTopics.map((item) => item.id)).toEqual([
      'past-simple',
      'past-continuous',
      'past-perfect',
      'past-perfect-continuous',
      'present-simple',
      'present-continuous',
      'present-perfect',
      'present-perfect-continuous',
      'future-simple',
      'future-continuous',
      'future-perfect',
      'future-perfect-continuous',
    ]);
    expect(
      english.grammarTopics.filter((item) => item.status === 'available').map((item) => item.id),
    ).toEqual(['past-simple', 'present-simple', 'present-continuous', 'future-simple']);
    expect(contentByCourse.zh.grammarTopics).toEqual([]);
  });

  it('content:check rejects an answer outside the options and a missing tense', () => {
    const broken: GrammarTopic[] = english.grammarTopics
      .filter((item) => item.id !== 'future-perfect')
      .map((item) =>
        item.id === 'present-simple'
          ? {
              ...item,
              exercises: item.exercises.map((exercise) =>
                exercise.id === 'ps-1' && exercise.kind === 'choose'
                  ? { ...exercise, answer: 'brushed' }
                  : exercise,
              ),
            }
          : item,
      );
    const errors = validateContent({ ...english, grammarTopics: broken });
    expect(errors).toContain(
      'grammar/present-simple.json › ps-1: the answer must be one of the options',
    );
    expect(errors).toContain('grammar: no tense for "future/perfect" (the chart has 12 tenses)');
  });
});
