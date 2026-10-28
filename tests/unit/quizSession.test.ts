import { describe, expect, it } from 'vitest';
import { getAllWordIds, getScene, getWord } from '@/data/content';
import { createSession, quizReducer } from '@/features/vocabulary/quiz/quizSession';
import { createQuizQuestion } from '@/lib/quiz';

const bedroom = getScene('bedroom')!;
const lamp = getWord('lamp')!;
const question = createQuizQuestion({
  sceneId: 'bedroom',
  word: lamp,
  getWord,
  sceneWordIds: bedroom.wordIds,
  allWordIds: getAllWordIds(),
  canTypeWords: false,
});

describe('quiz state machine (spec §16)', () => {
  it('answering correctly ends in "correct"', () => {
    const next = quizReducer(createSession(question), {
      type: 'submit',
      answer: { kind: 'choice', wordId: 'lamp' },
      word: lamp,
    });
    expect(next.status).toBe('correct');
    expect(next.attempts).toBe(1);
  });

  it('a wrong answer allows Try Again or Show Answer', () => {
    const wrong = quizReducer(createSession(question), {
      type: 'submit',
      answer: { kind: 'typed', text: 'lightbulb' },
      word: lamp,
    });
    expect(wrong.status).toBe('incorrect');
    expect(quizReducer(wrong, { type: 'retry' }).status).toBe('answering');
    expect(quizReducer(wrong, { type: 'reveal' }).status).toBe('revealed');
  });

  it('ignores repeated submits while not answering (no double counting)', () => {
    const correct = quizReducer(createSession(question), {
      type: 'submit',
      answer: { kind: 'choice', wordId: 'lamp' },
      word: lamp,
    });
    expect(
      quizReducer(correct, {
        type: 'submit',
        answer: { kind: 'choice', wordId: 'lamp' },
        word: lamp,
      }),
    ).toBe(correct);
  });

  it('keeps the same question object for the whole session', () => {
    const session = createSession(question);
    const wrong = quizReducer(session, {
      type: 'submit',
      answer: { kind: 'choice', wordId: 'bed' },
      word: lamp,
    });
    const retried = quizReducer(wrong, { type: 'retry' });
    expect(retried.question).toBe(question);
  });
});
