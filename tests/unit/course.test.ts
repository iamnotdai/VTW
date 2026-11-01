import { describe, expect, it } from 'vitest';
import { COURSES } from '@/config/courses';
import { getScene, getSceneGroupTitle, getWord } from '@/data/content';
import { t } from '@/i18n';
import { getActiveCourse } from '@/lib/course';
import { createQuizQuestion } from '@/lib/quiz';
import { STORAGE_KEYS } from '@/lib/storage';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

/** Switches course like Settings does. `resetAppState` (after each test) goes back to English. */
const switchCourse = (course: 'en' | 'zh') =>
  useSettingsStore.getState().updateSettings({ course });

describe('course switching', () => {
  it('starts in English', () => {
    expect(getActiveCourse()).toBe('en');
    expect(t('Vocabulary')).toBe('Vocabulary');
    expect(getWord('bed')?.text).toBe('bed');
  });

  it('serves the Chinese content, copy and language', () => {
    switchCourse('zh');
    expect(getActiveCourse()).toBe('zh');
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(t('Vocabulary')).toBe('词汇');
    expect(getScene('bedroom')?.title).toBe('卧室');
    expect(getSceneGroupTitle(getScene('bedroom')!)).toBe('家');
    // Pictures and hotspots are shared with the English course.
    expect(getScene('bedroom')?.hotspots).toBe(getScene('bedroom') && getSceneHotspotsEn());
  });

  it('keeps each course’s progress apart', () => {
    useProgressStore.getState().completeWord('bedroom', 'bed');
    expect(localStorage.getItem(STORAGE_KEYS.progress)).toContain('bed');

    switchCourse('zh');
    expect(useProgressStore.getState().progress.completedWordIdsByScene.bedroom).toBeUndefined();
    useProgressStore.getState().completeWord('bedroom', 'pillow');
    expect(localStorage.getItem(STORAGE_KEYS.progressZh)).toContain('pillow');

    switchCourse('en');
    expect(useProgressStore.getState().progress.completedWordIdsByScene.bedroom).toEqual(['bed']);
  });

  it('asks the course’s quiz questions', () => {
    switchCourse('zh');
    const word = getWord('bed')!;
    const question = createQuizQuestion({
      sceneId: 'bedroom',
      word,
      getWord,
      sceneWordIds: getScene('bedroom')!.wordIds,
      canTypeWords: false,
    });
    expect(COURSES.zh.quizPrompts.map((prompt) => prompt.id)).toContain(question.prompt.id);
    expect(question.prompt.text).toMatch(/\p{Script=Han}/u);
  });
});

function getSceneHotspotsEn() {
  const course = getActiveCourse();
  switchCourse('en');
  const hotspots = getScene('bedroom')?.hotspots;
  switchCourse(course);
  return hotspots;
}
