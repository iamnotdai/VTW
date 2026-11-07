import { describe, expect, it } from 'vitest';
import { getConversation } from '@/data/content';
import {
  addLineScore,
  averageLineScore,
  conversationRoles,
} from '@/features/conversation/rolePlay';
import {
  betterResult,
  createWordSpeakingState,
  summarizeWordSpeaking,
  trickyWordIds,
  wordSpeakingReducer,
} from '@/features/vocabulary/speaking/wordSpeakingSession';
import type { SpeakingScore } from '@/lib/speakingScore';
import { canRecordAlongsideRecognition, peakLevel } from '@/lib/voiceRecorder';

const score = (value: number): SpeakingScore => ({
  score: value,
  level: value >= 80 ? 'great' : value >= 55 ? 'good' : 'try-again',
  heard: '',
  parts: [],
  toneHint: false,
});

describe('Word Speaking session', () => {
  it('moves through the words and finishes after the last one', () => {
    let state = createWordSpeakingState(['bed', 'lamp']);
    state = wordSpeakingReducer(state, { type: 'next' });
    expect(state.position).toBe(1);
    state = wordSpeakingReducer(state, { type: 'next' });
    expect(state.finished).toBe(true);
  });

  it('keeps the best result of each word', () => {
    expect(betterResult({ kind: 'scored', score: 90 }, { kind: 'scored', score: 60 })).toEqual({
      kind: 'scored',
      score: 90,
    });
    expect(betterResult({ kind: 'skipped' }, { kind: 'practiced' })).toEqual({ kind: 'practiced' });
    expect(betterResult({ kind: 'scored', score: 40 }, { kind: 'skipped' })).toEqual({
      kind: 'scored',
      score: 40,
    });
  });

  it('restarts with the tricky words only', () => {
    let state = createWordSpeakingState(['bed', 'lamp', 'desk']);
    state = wordSpeakingReducer(state, {
      type: 'record',
      wordId: 'bed',
      result: { kind: 'scored', score: 95 },
    });
    state = wordSpeakingReducer(state, {
      type: 'record',
      wordId: 'lamp',
      result: { kind: 'scored', score: 60 },
    });
    state = wordSpeakingReducer(state, {
      type: 'record',
      wordId: 'desk',
      result: { kind: 'skipped' },
    });
    const ids = ['bed', 'lamp', 'desk'];
    expect(trickyWordIds(state.results, ids)).toEqual(['lamp', 'desk']);
    expect(summarizeWordSpeaking(state.results, ids)).toEqual({
      average: 78,
      great: 1,
      good: 1,
      tryAgain: 0,
      practiced: 0,
      skipped: 1,
    });

    state = wordSpeakingReducer(state, { type: 'restart', queue: ['lamp', 'desk'] });
    expect(state).toMatchObject({
      queue: ['lamp', 'desk'],
      position: 0,
      finished: false,
      round: 1,
    });
    // Results of the earlier round are kept.
    expect(state.results.bed).toEqual({ kind: 'scored', score: 95 });
  });
});

describe('Role-play helpers', () => {
  it('lists the characters in order with their number of lines', () => {
    expect(conversationRoles(getConversation('my-bedroom')!)).toEqual([
      { speakerId: 'ben', lineCount: 3 },
      { speakerId: 'lily', lineCount: 3 },
    ]);
  });

  it('keeps the latest score for display and the best for the summary', () => {
    const first = addLineScore(undefined, score(90));
    const second = addLineScore(first, score(50));
    expect(second).toMatchObject({ kind: 'scored', latest: { score: 50 }, best: { score: 90 } });
    expect(
      averageLineScore({
        a: second,
        b: addLineScore(undefined, score(70)),
        c: { kind: 'skipped' },
      }),
    ).toBe(80);
    expect(averageLineScore({ a: { kind: 'practiced' } })).toBeNull();
  });
});

describe('voice recorder helpers', () => {
  it('never records next to the recognizer on Android', () => {
    expect(
      canRecordAlongsideRecognition('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/140.0'),
    ).toBe(false);
  });

  it('measures the loudest sample', () => {
    expect(peakLevel([0.01, -0.4, 0.2])).toBe(0.4);
    expect(peakLevel([])).toBe(0);
  });
});
