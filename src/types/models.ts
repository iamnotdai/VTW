/**
 * Domain model for Village to World (spec §10.1).
 * Additions beyond the spec are marked with `@extension`.
 */

/** @extension The language being learned. Meanings and translations stay in Vietnamese. */
export type CourseId = 'en' | 'zh';

export type AgeGroup = 'under-6' | '6-8' | '9-12' | '13-17' | '18-plus';
export type AvatarChoice = 'boy' | 'girl';
export type SceneGroup = 'home' | 'garden' | 'village' | 'school' | 'town';

/** @extension Scenes without real content are listed as "Coming soon" and cannot be opened (spec §7.1). */
export type SceneStatus = 'available' | 'coming-soon';

export interface UserProfile {
  id: 'local-user';
  fullName: string;
  ageGroup: AgeGroup;
  avatar: AvatarChoice;
  canTypeWords: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WordExample {
  /** Sentence in the course language. */
  text: string;
  /** @extension Pinyin of `text` (Chinese course). */
  pinyin?: string;
  vi?: string;
  audio?: string;
}

export interface Word {
  /** e.g. "lamp" */
  id: string;
  /** e.g. "lamp" (or "台灯" in the Chinese course) */
  text: string;
  /** @extension The word names several things ("curtains") → "They’re curtains." */
  plural?: boolean;
  /** @extension The word takes no article ("toothpaste") → "It’s toothpaste." */
  uncountable?: boolean;
  /** e.g. "/læmp/" */
  ipa?: string;
  /** @extension Chinese course: e.g. "táidēng" — shown instead of `ipa`. */
  pinyin?: string;
  /** @extension Chinese course: classifier of the answer sentence, e.g. "盏" → "这是一盏台灯。" */
  measure?: string;
  /** e.g. "đèn" */
  meaningVi: string;
  /** e.g. "/assets/scenes/bedroom/objects/04_lamp.webp" */
  image: string;
  /** e.g. "/assets/audio/words/lamp.mp3" — optional, Web Speech is the fallback */
  audio?: string;
  acceptedAnswers: string[];
  /**
   * @extension Words that sound exactly the same ("pear" → "pair"). A speech recognizer may write
   * one of them for a well-said word, so Word Speaking counts them as the word (spec §7.7).
   */
  soundsLike?: string[];
  examples: WordExample[];
  relatedWordIds: string[];
  distractorWordIds?: string[];
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SceneHotspot {
  wordId: string;
  /** Exact object contour in the background's natural pixel coordinates (= SVG viewBox). */
  svgPath: string;
  /** Transparent sprite of the object, drawn on top when highlighted. */
  sprite?: string;
  spriteBounds?: Bounds;
  /** Higher values sit on top: they receive the pointer first and hide lower objects' highlight. */
  zIndex?: number;
  /** Extra invisible hit area (in viewBox units) for touch on small objects. Never changes the outline. */
  touchPadding?: number;
  /**
   * @extension Where the "found" check and the label sit (viewBox units). Defaults to the top
   * centre of the first sub-path — set it when that point is covered by another object.
   */
  anchor?: { x: number; y: number };
}

export interface Scene {
  /** e.g. "bedroom" */
  id: string;
  title: string;
  group: SceneGroup;
  /** @extension Sort order inside its group. */
  order: number;
  description: string;
  /** @extension */
  status: SceneStatus;
  thumbnail: string;
  background: string;
  /** Natural width of `background` — also the SVG viewBox width. */
  width: number;
  /** Natural height of `background` — also the SVG viewBox height. */
  height: number;
  wordIds: string[];
  conversationIds: string[];
  hotspots: SceneHotspot[];
}

/** @extension Speakers referenced by `DialogueLine.speakerId`. */
export interface Speaker {
  id: string;
  name: string;
  /** Accent color for the speaker's avatar bubble. */
  color: string;
  avatar?: string;
  /** Browser-voice tuning so speakers sound different when no recorded audio exists. */
  voice?: { pitch?: number; rate?: number };
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  /** Line in the course language. */
  text: string;
  /** @extension Pinyin of `text` (Chinese course). */
  pinyin?: string;
  textVi?: string;
  audio?: string;
  startSeconds?: number;
  endSeconds?: number;
}

export interface PracticeQuestion {
  id: string;
  prompt: string;
  suggestedAnswer: string;
  /** @extension Pinyin of `prompt` / `suggestedAnswer` (Chinese course). */
  promptPinyin?: string;
  suggestedAnswerPinyin?: string;
  audio?: string;
}

export interface Conversation {
  id: string;
  sceneId: string;
  title: string;
  order: number;
  poster: string;
  /** @extension One-line summary shown on cards. */
  description?: string;
  videoSrc?: string;
  youtubeId?: string;
  /** @extension WebVTT captions for `videoSrc`. */
  captionsSrc?: string;
  lines: DialogueLine[];
  practiceQuestions: PracticeQuestion[];
}

export interface LearningProgress {
  completedWordIdsByScene: Record<string, string[]>;
  foundWordIdsByScene: Record<string, string[]>;
  completedConversationIds: string[];
  lastVisitedSceneId?: string;
  lastFlashcardIndexByScene: Record<string, number>;
  /** @extension Words the learner marked with the heart on a flashcard. */
  favoriteWordIds: string[];
  /**
   * @extension Scenes whose "Completed!" popup was already shown for the current Explore round.
   * Cleared by "Play again" so the next round celebrates again.
   */
  celebratedSceneIds: string[];
  updatedAt: string;
}

/**
 * @extension Best speaking score (0–100) of each word, from Word Speaking (spec §24.1). Kept apart
 * from `LearningProgress`: speaking never counts as a learned word.
 */
export interface SpeakingProgress {
  bestScoreByWordId: Record<string, number>;
  updatedAt: string;
}

/** Boy = male-sounding browser voice, girl = female-sounding one, both with a child-like pitch. */
export type VoiceStyle = 'boy' | 'girl';

export interface AppSettings {
  /** @extension The course being learned. Each course keeps its own progress. */
  course: CourseId;
  soundEnabled: boolean;
  showVietnameseMeaning: boolean;
  /** `voiceURI` of the chosen browser voice (US English or Mandarin, per course); `null` = pick the best one automatically. */
  voiceURI: string | null;
  /** `null` = no preference (adult voice, normal pitch). */
  voiceStyle: VoiceStyle | null;
}
