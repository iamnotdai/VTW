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
  /** Read the question aloud when it appears (only if sound is on in Settings). */
  speakQuestion: true,
  /** No prompt appears twice within this many consecutive questions. */
  promptNoRepeatWindow: 5,
  /** When the learner can type: share of typing questions (30%); the rest are multiple-choice. */
  typingProbability: 0.3,
} as const;

/** Feedback sounds: correct / wrong answer, completed (synthesized, see `src/lib/sfx.ts`). */
export const SFX_CONFIG = {
  enabled: true,
  /** 0–1. Kept gentle: they play right next to the words' pronunciation. */
  volume: 0.45,
} as const;

/**
 * Questions asked on an English quiz card: one is picked at random per question (see
 * `pickQuizPrompt`). Each course has its own list in `COURSES`.
 */
export const QUIZ_PROMPTS = [
  { id: 'what-object', text: 'What is this object?', textVi: 'Đồ vật này là gì?' },
  { id: 'know-what', text: 'Do you know what this is?', textVi: 'Bạn có biết đây là gì không?' },
  {
    id: 'tell-what',
    text: 'Can you tell me what this is?',
    textVi: 'Bạn có thể cho biết đây là gì không?',
  },
  {
    id: 'called-english',
    text: 'What is this called in English?',
    textVi: 'Cái này được gọi là gì trong tiếng Anh?',
  },
  { id: 'call-this', text: 'What do you call this?', textVi: 'Bạn gọi cái này là gì?' },
  {
    id: 'name-object',
    text: 'Can you name this object?',
    textVi: 'Bạn có thể gọi tên đồ vật này không?',
  },
  {
    id: 'see-picture',
    text: 'What do you see in the picture?',
    textVi: 'Bạn nhìn thấy gì trong bức hình?',
  },
  {
    id: 'know-name',
    text: 'Do you know the name of this object?',
    textVi: 'Bạn có biết tên của đồ vật này không?',
  },
  {
    id: 'english-word',
    text: 'What is the English word for this?',
    textVi: 'Từ tiếng Anh cho đồ vật này là gì?',
  },
  {
    id: 'tell-name',
    text: 'Can you tell me the name of this object?',
    textVi: 'Bạn có thể cho biết tên của đồ vật này không?',
  },
] as const satisfies readonly { id: string; text: string; textVi: string }[];

export const DEFAULT_SETTINGS: AppSettings = {
  course: 'en',
  soundEnabled: true,
  showVietnameseMeaning: true,
  voiceURI: null,
  voiceStyle: null,
};

/** Explore scene zoom limits (spec §7.4 item 8). */
export const ZOOM_CONFIG = {
  min: 1,
  max: 3,
  step: 0.5,
} as const;

/** Flashcard word title: kept on one line, shrunk to fit the card down to this fraction of its size. */
export const FLASHCARD_TITLE_MIN_SCALE = 0.4;

/** Related word chips: a long word shrinks to fit its chip, down to this fraction of its size. */
export const RELATED_WORD_MIN_SCALE = 0.6;

/** Conversation video player: speeds offered by the "1.0x" button, and what counts as "HD". */
export const VIDEO_CONFIG = {
  playbackRates: [1, 0.75, 0.5],
  hdMinHeight: 720,
} as const;

/** The spoken language comes from the course (`COURSES[course].lang`). */
export const SPEECH_CONFIG = {
  /** Slightly slower than normal for young learners. */
  rate: 0.9,
  /** The snail button: browser voice speed, and recorded files' playback speed. */
  slowRate: 0.55,
  slowFileRate: 0.7,
  /** Pitch that makes an adult browser voice sound like a boy / girl (1 = unchanged). */
  stylePitch: { boy: 1.25, girl: 1.4 },
} as const;

/** Thresholds for the simple word-match feedback in Speaking Practice (not pronunciation scoring). */
export const SPEAKING_FEEDBACK = {
  great: 0.8,
  good: 0.5,
} as const;

/**
 * Speaking scores of Word Speaking and Role-play (spec §7.7, §9.5), 0–100. They are estimated from
 * what the browser's speech recognizer heard, so the screens present them as a guide — never as
 * an acoustic pronunciation test.
 */
export const SPEAKING_SCORE = {
  /** Levels: "Excellent!" from `great`, "Almost there!" from `good`, else "Let’s try again!". */
  great: 80,
  good: 55,
  /** Recognizer alternatives to compare: more of them help with words that sound alike. */
  maxAlternatives: 5,
  /** Highest score of a word that was heard close to, but not exactly as, the target. */
  nearMissMax: 85,
  /**
   * Points lost when the target was only the recognizer's 2nd, 3rd… guess (index = guess − 1):
   * the learner's voice sounded more like the other guesses.
   */
  rankPenalty: { word: [0, 15, 22, 27, 30], sentence: [0, 4, 7, 9, 10] },
  /** Share of the score that follows the recognizer's confidence, when it reports one. */
  confidenceWeight: 0.15,
  /** A word in a sentence at least this similar (letters) counts as "almost", not as missing. */
  fairWordSimilarity: 0.5,
  /** Cost of an extra word or character in the middle of a sentence (a missing one costs 1). */
  insertionCost: 0.5,
  /** Chinese: cost of a character heard with the right syllable but another tone (0–1). */
  toneSlipCost: 0.3,
} as const;

/** "Listen to yourself" (Word Speaking, Role-play). The recording only lives in memory. */
export const RECORDING_CONFIG = {
  /** A recording whose loudest moment stays under this level (0–1) is silence. */
  silencePeak: 0.02,
  /** How often the loudness is sampled while recording (ms). */
  levelSampleMs: 100,
} as const;

/** Role-play (spec §9.5). */
export const ROLE_PLAY_CONFIG = {
  /** Pause before the next line, so turns don't run into each other (ms). */
  lineGapMs: 450,
} as const;

/** Fill in the blanks (spec §9.6). */
export const FILL_BLANKS_CONFIG = {
  /** Options of a blank in choice mode, the right one included. */
  choiceCount: 3,
  /** Shortest English word that may become a blank (vocabulary words always can). */
  minWordLength: 3,
  /** Shortest Chinese word, in characters, that may become a blank. */
  minHanLength: 2,
} as const;
