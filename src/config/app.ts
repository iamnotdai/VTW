import type { AgeGroup, AppSettings, SceneGroup } from '@/types/models';

export const APP_NAME = 'Village to World';
export const APP_SLOGAN = 'Explore Life. Learn English.';

export const PROFILE_NAME_MAX_LENGTH = 60;

export const AGE_GROUP_OPTIONS: readonly { value: AgeGroup; label: string }[] = [
  { value: 'under-6', label: 'Under 6' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
  { value: '13-17', label: '13–17' },
  { value: '18-plus', label: '18+' },
];

/**
 * Card grid of the scene lists (Vocabulary, Conversation): one column on narrow phones, two from
 * 480px (wide phones and tablets), four on desktop.
 */
export const SCENE_GRID_CLASS =
  'grid grid-cols-1 gap-4 min-[30rem]:grid-cols-2 lg:grid-cols-4 lg:gap-5';

/**
 * Display order and titles of scene groups (spec §7.1). `icon` is the group's picture shown next
 * to its heading; groups without one yet simply omit it.
 */
export const SCENE_GROUPS: readonly { id: SceneGroup; title: string; icon?: string }[] = [
  { id: 'home', title: 'Home', icon: '/assets/icons/group-home.webp' },
  { id: 'garden', title: 'Garden', icon: '/assets/icons/group-garden.webp' },
  { id: 'village', title: 'Village' },
  { id: 'school', title: 'School' },
  { id: 'town', title: 'Town' },
];

/** Learner level shown under the name ("Level 1"), earned from learned words — never stored. */
export const LEVEL_CONFIG = {
  wordsPerLevel: 10,
} as const;

/** Quiz rules (spec §8). Change here instead of hard-coding in components. */
export const QUIZ_CONFIG = {
  /** Number of options in a multiple-choice question (3 or 4). The design shows 3 (A, B, C). */
  choiceCount: 3,
  /** Fewest options we accept before falling back to typing. */
  minChoiceCount: 3,
  /** Offer "Show Answer" after a wrong answer. Showing the answer never completes the word. */
  allowShowAnswer: true,
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  showVietnameseMeaning: true,
  quizTypingProbability: 0.5,
};

/** Explore scene zoom limits (spec §7.4 item 8). */
export const ZOOM_CONFIG = {
  min: 1,
  max: 3,
  step: 0.5,
} as const;

/** Conversation video player: speeds offered by the "1.0x" button, and what counts as "HD". */
export const VIDEO_CONFIG = {
  playbackRates: [1, 0.75, 0.5],
  hdMinHeight: 720,
} as const;

export const SPEECH_CONFIG = {
  lang: 'en-US',
  /** Slightly slower than normal for young learners. */
  rate: 0.9,
} as const;

/** Thresholds for the simple word-match feedback in Speaking Practice (not pronunciation scoring). */
export const SPEAKING_FEEDBACK = {
  great: 0.8,
  good: 0.5,
} as const;
