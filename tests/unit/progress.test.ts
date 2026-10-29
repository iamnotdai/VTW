import { describe, expect, it } from 'vitest';
import {
  createEmptyProgress,
  getFoundWordIds,
  getLearnerLevel,
  getTotalCompletedWords,
  getSceneProgressPercent,
  markConversationCompleted,
  markSceneCelebrated,
  markWordCompleted,
  mergeProgress,
  resetSceneRound,
  sanitizeProgress,
  setLastFlashcardIndex,
  toggleFavoriteWord,
} from '@/lib/progress';

const SCENE = Array.from({ length: 24 }, (_, i) => `w${i + 1}`);

describe('getSceneProgressPercent (spec §11.2)', () => {
  it('matches the spec example: 6 of 24 words → 25%', () => {
    expect(getSceneProgressPercent(SCENE, SCENE.slice(0, 6))).toBe(25);
  });

  it('is 0 for an empty scene and never exceeds 100', () => {
    expect(getSceneProgressPercent([], ['a'])).toBe(0);
    expect(getSceneProgressPercent(SCENE, [...SCENE, ...SCENE, 'other', 'ids'])).toBe(100);
  });

  it('ignores ids from other scenes and duplicates', () => {
    expect(getSceneProgressPercent(['a', 'b', 'c', 'd'], ['a', 'a', 'x', 'y'])).toBe(25);
  });
});

describe('markWordCompleted', () => {
  it('adds the word to completed and found lists', () => {
    const next = markWordCompleted(createEmptyProgress(), 'bedroom', 'lamp');
    expect(next.completedWordIdsByScene.bedroom).toEqual(['lamp']);
    expect(next.foundWordIdsByScene.bedroom).toEqual(['lamp']);
  });

  it('is idempotent: answering again never counts twice', () => {
    const once = markWordCompleted(createEmptyProgress(), 'bedroom', 'lamp');
    const twice = markWordCompleted(once, 'bedroom', 'lamp');
    expect(twice).toBe(once);
    expect(
      getSceneProgressPercent(SCENE.concat('lamp'), twice.completedWordIdsByScene.bedroom),
    ).toBe(4);
  });

  it('does not mutate the previous snapshot', () => {
    const empty = createEmptyProgress();
    markWordCompleted(empty, 'bedroom', 'bed');
    expect(empty.completedWordIdsByScene).toEqual({});
  });
});

describe('other progress updates', () => {
  it('marks a conversation once', () => {
    const once = markConversationCompleted(createEmptyProgress(), 'my-bedroom');
    expect(markConversationCompleted(once, 'my-bedroom')).toBe(once);
    expect(once.completedConversationIds).toEqual(['my-bedroom']);
  });

  it('stores a non-negative flashcard index', () => {
    const next = setLastFlashcardIndex(createEmptyProgress(), 'bedroom', -3);
    expect(next.lastFlashcardIndexByScene.bedroom).toBe(0);
  });

  it('merges two snapshots without losing learned words', () => {
    const a = markWordCompleted(
      createEmptyProgress(new Date('2026-01-01')),
      'bedroom',
      'lamp',
      new Date('2026-01-01'),
    );
    const b = markWordCompleted(
      createEmptyProgress(new Date('2026-01-02')),
      'bedroom',
      'bed',
      new Date('2026-01-02'),
    );
    const merged = mergeProgress(a, b);
    expect(merged.completedWordIdsByScene.bedroom.sort()).toEqual(['bed', 'lamp']);
    expect(merged.updatedAt).toBe(b.updatedAt);
  });
});

describe('learner level', () => {
  it('starts at Level 1 and goes up every 10 learned words, across scenes', () => {
    let progress = createEmptyProgress();
    expect(getLearnerLevel(progress)).toBe(1);
    for (const id of SCENE.slice(0, 9)) progress = markWordCompleted(progress, 'bedroom', id);
    expect(getLearnerLevel(progress)).toBe(1);
    progress = markWordCompleted(progress, 'kitchen', 'w10');
    expect(getLearnerLevel(progress)).toBe(2);
    // The same word learned twice still counts once.
    progress = markWordCompleted(progress, 'bedroom', 'w10');
    expect(getLearnerLevel(progress)).toBe(2);
    expect(getLearnerLevel(progress, 5)).toBe(3);
  });
});

describe('favorite words', () => {
  it('toggles a heart on and off', () => {
    const on = toggleFavoriteWord(createEmptyProgress(), 'bed');
    expect(on.favoriteWordIds).toEqual(['bed']);
    expect(toggleFavoriteWord(on, 'bed').favoriteWordIds).toEqual([]);
  });

  it('keeps the newest list when merging, so a removed heart stays removed', () => {
    const older = toggleFavoriteWord(createEmptyProgress(), 'bed', new Date('2026-01-01'));
    const newer = toggleFavoriteWord(older, 'bed', new Date('2026-01-02'));
    expect(mergeProgress(older, newer).favoriteWordIds).toEqual([]);
    expect(mergeProgress(newer, older).favoriteWordIds).toEqual([]);
  });
});

describe('sanitizeProgress', () => {
  it('rejects values that are not objects', () => {
    expect(sanitizeProgress(null)).toBeNull();
    expect(sanitizeProgress('oops')).toBeNull();
    expect(sanitizeProgress([1, 2])).toBeNull();
  });

  it('drops invalid fields instead of crashing', () => {
    const result = sanitizeProgress({
      completedWordIdsByScene: { bedroom: ['lamp', 3, null, 'lamp'], kitchen: 'nope' },
      completedConversationIds: 'not-a-list',
      lastFlashcardIndexByScene: { bedroom: 4, kitchen: -1, garden: 1.5 },
    });
    expect(result).not.toBeNull();
    expect(result!.completedWordIdsByScene).toEqual({ bedroom: ['lamp'], kitchen: [] });
    expect(result!.completedConversationIds).toEqual([]);
    expect(result!.lastFlashcardIndexByScene).toEqual({ bedroom: 4 });
    expect(result!.favoriteWordIds).toEqual([]);
  });
});

describe('Explore round (Completed popup + Play again)', () => {
  it('celebrates a scene once until it is reset', () => {
    const once = markSceneCelebrated(createEmptyProgress(), 'bedroom');
    expect(once.celebratedSceneIds).toEqual(['bedroom']);
    expect(markSceneCelebrated(once, 'bedroom')).toBe(once);
  });

  it('reset empties Objects Found but keeps learned words, the % and the level', () => {
    let progress = createEmptyProgress();
    for (const id of SCENE) progress = markWordCompleted(progress, 'bedroom', id);
    progress = markSceneCelebrated(progress, 'bedroom');
    const level = getLearnerLevel(progress);

    const reset = resetSceneRound(progress, 'bedroom');
    expect(getFoundWordIds(reset, 'bedroom')).toEqual([]);
    expect(reset.celebratedSceneIds).toEqual([]);
    expect(reset.completedWordIdsByScene.bedroom).toHaveLength(24);
    expect(getTotalCompletedWords(reset)).toBe(24);
    expect(getLearnerLevel(reset)).toBe(level);

    // Answering again refills Objects Found without counting the word twice.
    const again = markWordCompleted(reset, 'bedroom', 'w1');
    expect(getFoundWordIds(again, 'bedroom')).toEqual(['w1']);
    expect(getTotalCompletedWords(again)).toBe(24);
  });
});
