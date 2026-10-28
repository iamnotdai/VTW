import { describe, expect, it } from 'vitest';
import { QUIZ_CONFIG } from '@/config/app';
import { content, getAllWordIds, getScene, getWord } from '@/data/content';
import { buildChoices, createQuizQuestion, isTypedAnswerCorrect, pickAnswerMode } from '@/lib/quiz';
import { createSeededRandom } from '@/lib/random';
import { normalizeAnswer } from '@/lib/text';
import type { Word } from '@/types/models';

const bedroom = getScene('bedroom')!;
const lamp = getWord('lamp')!;

describe('pickAnswerMode (spec §8)', () => {
  it('always returns multiple-choice when the learner cannot type', () => {
    for (const value of [0, 0.1, 0.49, 0.5, 0.99]) {
      expect(pickAnswerMode(false, value)).toBe('multiple-choice');
    }
  });

  it('splits 50/50 by default when the learner can type', () => {
    expect(pickAnswerMode(true, 0.2)).toBe('typing');
    expect(pickAnswerMode(true, 0.49)).toBe('typing');
    expect(pickAnswerMode(true, 0.5)).toBe('multiple-choice');
    expect(pickAnswerMode(true, 0.9)).toBe('multiple-choice');
  });

  it('honours a configured typing probability', () => {
    expect(pickAnswerMode(true, 0.7, 0.8)).toBe('typing');
    expect(pickAnswerMode(true, 0.1, 0)).toBe('multiple-choice');
    expect(pickAnswerMode(true, 0.99, 1)).toBe('typing');
  });
});

describe('typed answers', () => {
  it('normalizes only whitespace and case', () => {
    expect(normalizeAnswer('  A   Lamp ')).toBe('a lamp');
    expect(normalizeAnswer('Đèn')).toBe('đèn');
  });

  it('accepts declared answers and nothing else', () => {
    expect(isTypedAnswerCorrect(lamp, 'lamp')).toBe(true);
    expect(isTypedAnswerCorrect(lamp, '  LAMP ')).toBe(true);
    expect(isTypedAnswerCorrect(lamp, 'a lamp')).toBe(true);
    expect(isTypedAnswerCorrect(lamp, 'lam')).toBe(false);
    expect(isTypedAnswerCorrect(lamp, 'lampp')).toBe(false);
    expect(isTypedAnswerCorrect(lamp, 'lamp.')).toBe(false);
    expect(isTypedAnswerCorrect(lamp, '')).toBe(false);
  });
});

describe('buildChoices', () => {
  it('returns the configured number of unique options with exactly one correct answer, for every Bedroom word', () => {
    for (const wordId of bedroom.wordIds) {
      const word = getWord(wordId)!;
      for (let seed = 1; seed <= 20; seed += 1) {
        const choices = buildChoices({
          word,
          getWord,
          sceneWordIds: bedroom.wordIds,
          allWordIds: getAllWordIds(),
          random: createSeededRandom(seed),
        });
        expect(choices).toHaveLength(QUIZ_CONFIG.choiceCount);
        expect(choices.filter((choice) => choice.wordId === word.id)).toHaveLength(1);
        const texts = choices.map((choice) => normalizeAnswer(choice.text));
        expect(new Set(texts).size).toBe(texts.length);
        // A distractor must never be an accepted answer of the correct word.
        const accepted = new Set(word.acceptedAnswers.map(normalizeAnswer));
        for (const choice of choices.filter((c) => c.wordId !== word.id)) {
          expect(accepted.has(normalizeAnswer(choice.text))).toBe(false);
        }
      }
    }
  });

  it('prefers the curated distractors', () => {
    const choices = buildChoices({ word: lamp, getWord, sceneWordIds: bedroom.wordIds, count: 4 });
    const ids = choices.map((choice) => choice.wordId).sort();
    expect(ids).toEqual(['clock', 'lamp', 'pencil-cup', 'plant']);
  });

  it('skips a distractor that is a synonym of the answer', () => {
    const rug: Word = { ...getWord('rug')! };
    const carpet: Word = {
      ...rug,
      id: 'carpet',
      text: 'carpet',
      acceptedAnswers: ['carpet', 'rug'],
    };
    const words: Record<string, Word> = { ...content.words, carpet };
    const choices = buildChoices({
      word: rug,
      getWord: (id) => words[id],
      sceneWordIds: ['carpet', ...bedroom.wordIds],
      random: createSeededRandom(3),
    });
    expect(choices.some((choice) => choice.wordId === 'carpet')).toBe(false);
  });

  it('is deterministic for the same random source', () => {
    const make = () =>
      buildChoices({
        word: lamp,
        getWord,
        sceneWordIds: bedroom.wordIds,
        random: createSeededRandom(42),
      });
    expect(make()).toEqual(make());
  });
});

describe('createQuizQuestion', () => {
  const base = {
    sceneId: 'bedroom',
    word: lamp,
    getWord,
    sceneWordIds: bedroom.wordIds,
    allWordIds: getAllWordIds(),
  };

  it('never asks a typing question when canTypeWords is false', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const question = createQuizQuestion({
        ...base,
        canTypeWords: false,
        random: createSeededRandom(seed),
      });
      expect(question.mode).toBe('multiple-choice');
      expect(question.choices).toHaveLength(QUIZ_CONFIG.choiceCount);
    }
  });

  it('mixes typing and multiple-choice when canTypeWords is true', () => {
    const modes = new Set(
      Array.from(
        { length: 50 },
        (_, seed) =>
          createQuizQuestion({ ...base, canTypeWords: true, random: createSeededRandom(seed + 1) })
            .mode,
      ),
    );
    expect(modes).toEqual(new Set(['typing', 'multiple-choice']));
  });

  it('falls back to typing when too few options exist and the learner can type', () => {
    const lonely = createQuizQuestion({
      sceneId: 'tiny',
      word: lamp,
      getWord: (id) => (id === 'lamp' ? lamp : undefined),
      sceneWordIds: ['lamp'],
      canTypeWords: true,
      typingProbability: 0,
    });
    expect(lonely.mode).toBe('typing');
    expect(lonely.choices).toHaveLength(0);
  });

  it('is frozen so the mode and option order cannot change after creation', () => {
    const question = createQuizQuestion({ ...base, canTypeWords: false });
    expect(Object.isFrozen(question)).toBe(true);
    expect(Object.isFrozen(question.choices)).toBe(true);
  });
});
