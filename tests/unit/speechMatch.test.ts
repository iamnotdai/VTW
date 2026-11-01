import { describe, expect, it } from 'vitest';
import { getSpeechFeedbackLevel, scoreSpeechMatch, speechTokens } from '@/lib/speechMatch';

describe('speechTokens', () => {
  it('drops punctuation and expands contractions and small numbers', () => {
    expect(speechTokens("It's on the desk, next to 2 books!")).toEqual([
      'it',
      'is',
      'on',
      'the',
      'desk',
      'next',
      'to',
      'two',
      'books',
    ]);
  });
});

describe('scoreSpeechMatch', () => {
  const sample = 'The lamp is on the nightstand.';

  it('scores a perfect match as 1', () => {
    const result = scoreSpeechMatch(sample, 'the lamp is on the nightstand');
    expect(result.score).toBe(1);
    expect(result.words.every((word) => word.matched)).toBe(true);
  });

  it('marks missing words', () => {
    const result = scoreSpeechMatch(sample, 'the lamp is on');
    expect(result.score).toBeCloseTo(4 / 6);
    expect(result.words.find((word) => word.text === 'nightstand.')?.matched).toBe(false);
  });

  it('treats contractions as equal', () => {
    expect(scoreSpeechMatch("It's sunny today.", 'it is sunny today').score).toBe(1);
  });

  it('keeps the best of several recognizer alternatives', () => {
    const result = scoreSpeechMatch(sample, [
      'the lamb is on the night stand',
      'the lamp is on the nightstand',
    ]);
    expect(result.score).toBe(1);
    expect(result.heard).toBe('the lamp is on the nightstand');
  });

  it('returns 0 for silence', () => {
    expect(scoreSpeechMatch(sample, ['', '  ']).score).toBe(0);
  });
});

describe('getSpeechFeedbackLevel', () => {
  it('maps scores to friendly levels', () => {
    expect(getSpeechFeedbackLevel(1)).toBe('great');
    expect(getSpeechFeedbackLevel(0.6)).toBe('good');
    expect(getSpeechFeedbackLevel(0.2)).toBe('try-again');
  });
});

describe('Chinese speech matching', () => {
  it('splits Chinese into single characters and reads digits as numbers', () => {
    expect(speechTokens('我有3本书！')).toEqual(['我', '有', '三', '本', '书']);
    expect(speechTokens('两个枕头')).toEqual(['二', '个', '枕', '头']);
  });

  it('scores each character of the sample', () => {
    expect(scoreSpeechMatch('台灯在床头柜上。', '台灯在床头柜上').score).toBe(1);
    expect(scoreSpeechMatch('台灯在床头柜上。', '台灯在床上').score).toBeCloseTo(5 / 7);
    expect(scoreSpeechMatch('我有两本书。', '我有2本书').score).toBe(1);
  });
});
