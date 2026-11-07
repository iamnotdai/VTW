import { describe, expect, it } from 'vitest';
import {
  createEmptySpeakingProgress,
  getSceneSpeakingStats,
  mergeSpeakingProgress,
  recordSpeakingScore,
  sanitizeSpeakingProgress,
} from '@/lib/speakingProgress';

const NOW = new Date('2026-11-07T10:00:00.000Z');
const LATER = new Date('2026-11-07T11:00:00.000Z');

describe('pronunciation progress (spec §24.1)', () => {
  it('keeps the best score of each word, rounded', () => {
    let progress = createEmptySpeakingProgress(NOW);
    progress = recordSpeakingScore(progress, 'bed', 61.4, NOW);
    progress = recordSpeakingScore(progress, 'bed', 88.6, LATER);
    expect(progress.bestScoreByWordId).toEqual({ bed: 89 });
    expect(progress.updatedAt).toBe(LATER.toISOString());
  });

  it('returns the same object when the score is not better or not valid', () => {
    const progress = recordSpeakingScore(createEmptySpeakingProgress(NOW), 'bed', 80, NOW);
    expect(recordSpeakingScore(progress, 'bed', 70, LATER)).toBe(progress);
    expect(recordSpeakingScore(progress, 'bed', 80, LATER)).toBe(progress);
    expect(recordSpeakingScore(progress, 'lamp', Number.NaN, LATER)).toBe(progress);
    expect(recordSpeakingScore(progress, 'lamp', 120, LATER)).toBe(progress);
    expect(recordSpeakingScore(progress, '', 90, LATER)).toBe(progress);
  });

  it('counts the scene words said well (best score ≥ 80)', () => {
    const progress = {
      bestScoreByWordId: { bed: 80, pillow: 79, lamp: 100, sofa: 95 },
      updatedAt: NOW.toISOString(),
    };
    expect(getSceneSpeakingStats(progress, ['bed', 'pillow', 'lamp', 'desk'])).toEqual({
      total: 4,
      saidWell: 2,
      percent: 50,
    });
    expect(getSceneSpeakingStats(progress, [])).toEqual({ total: 0, saidWell: 0, percent: 0 });
  });

  it('merges two saved versions by keeping the higher score', () => {
    const a = { bestScoreByWordId: { bed: 90, lamp: 40 }, updatedAt: NOW.toISOString() };
    const b = {
      bestScoreByWordId: { bed: 70, lamp: 85, desk: 60 },
      updatedAt: LATER.toISOString(),
    };
    expect(mergeSpeakingProgress(a, b)).toEqual({
      bestScoreByWordId: { bed: 90, lamp: 85, desk: 60 },
      updatedAt: LATER.toISOString(),
    });
  });

  it('sanitizes stored data', () => {
    expect(sanitizeSpeakingProgress(null)).toBeNull();
    expect(sanitizeSpeakingProgress([])).toBeNull();
    expect(
      sanitizeSpeakingProgress({
        bestScoreByWordId: { bed: 91.2, lamp: 'x', desk: -1, sofa: 101, '': 50 },
        updatedAt: 3,
      }),
    ).toEqual({ bestScoreByWordId: { bed: 91 }, updatedAt: new Date(0).toISOString() });
  });
});
