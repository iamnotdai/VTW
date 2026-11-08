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
  /**
   * @extension Steps of a conversation's path the learner finished (spec §9.7): "listen", "fill",
   * "read". The last step, "speak", is `completedConversationIds`.
   */
  conversationStepsById: Record<string, TrackedConversationStep[]>;
  updatedAt: string;
}

/** @extension The four steps of a conversation (spec §9.7), in order. */
export type ConversationStep = 'listen' | 'fill' | 'read' | 'speak';
/** Steps stored in `conversationStepsById`; "speak" is the completed conversation itself. */
export type TrackedConversationStep = Exclude<ConversationStep, 'speak'>;

/** @extension Group of a sound in the IPA chart (spec §24.2). */
export type IpaSoundGroup = 'vowel' | 'diphthong' | 'consonant';

/** @extension A word that shows a sound when no scene word has it (e.g. /ð/ "mother"). */
export interface IpaExtraExample {
  text: string;
  ipa: string;
  meaningVi: string;
}

/** @extension One sound of the American English IPA chart (spec §24.2), English course only. */
export interface IpaSound {
  /** URL-safe id, e.g. "ae" for /æ/. */
  id: string;
  /** As written in `Word.ipa`, e.g. "æ", "tʃ". */
  symbol: string;
  /** Other spellings of the same sound in `Word.ipa`, e.g. "i" (happy) for "iː". */
  aliases?: string[];
  group: IpaSoundGroup;
  /** How to make the sound, in Vietnamese (content, reviewed by a teacher). */
  tipVi: string;
  /** Extra example words, only for sounds the scenes' words don't have. */
  extraExamples?: IpaExtraExample[];
  /** Recorded sound (a browser voice can't say a sound on its own). */
  audio?: string;
  /** Picture of the mouth; never a placeholder. */
  mouthImage?: string;
}

/* Grammar (spec §25) — English course only, optional. ---------------------------------------- */

/** @extension Row of the tense chart. */
export type GrammarTime = 'past' | 'present' | 'future';
/** @extension Column of the tense chart. */
export type GrammarAspect = 'simple' | 'continuous' | 'perfect' | 'perfect-continuous';
export type GrammarLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type GrammarFormKind = 'affirmative' | 'negative' | 'question';

/** @extension One form of a tense: its pattern (explained in Vietnamese) and an example. */
export interface GrammarForm {
  kind: GrammarFormKind;
  /** e.g. "Chủ ngữ + will + động từ nguyên mẫu". */
  pattern: string;
  example: string;
  exampleVi: string;
}

/** @extension A lesson sentence; `wordIds` show the scene objects it talks about. */
export interface GrammarExample {
  text: string;
  textVi: string;
  wordIds?: string[];
}

/**
 * @extension A practice question. `choose`: pick the word for the "___"; `listen-choose`: hear
 * `sentence`, pick it among `options`; `order`: tap the shuffled words of `sentence` in order.
 */
export type GrammarExercise =
  | {
      id: string;
      kind: 'choose';
      sentence: string;
      options: string[];
      answer: string;
      textVi: string;
    }
  | { id: string; kind: 'listen-choose'; sentence: string; options: string[]; textVi: string }
  | { id: string; kind: 'order'; sentence: string; textVi: string };

/** @extension One of the 12 tenses. `coming-soon` topics have no lesson yet (not openable). */
export interface GrammarTopic {
  id: string;
  time: GrammarTime;
  aspect: GrammarAspect;
  /** English name, e.g. "Present Simple" (content, never run through `t()`). */
  title: string;
  titleVi: string;
  level: GrammarLevel;
  status: SceneStatus;
  usageVi: string[];
  forms: GrammarForm[];
  signalWords: string[];
  examples: GrammarExample[];
  exercises: GrammarExercise[];
}

/** @extension Exercises answered right, per topic, each counted once (spec §25). */
export interface GrammarProgress {
  correctExerciseIdsByTopic: Record<string, string[]>;
  updatedAt: string;
}

/** @extension The four language skills (spec §4), shown on each activity. */
export type Skill = 'listening' | 'speaking' | 'reading' | 'writing';

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
