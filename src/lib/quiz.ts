import { DEFAULT_SETTINGS, QUIZ_CONFIG, QUIZ_PROMPTS } from '@/config/app';
import type { Word } from '@/types/models';
import { shuffle, type RandomFn } from './random';
import { normalizeAnswer } from './text';

export type AnswerMode = 'typing' | 'multiple-choice';

/**
 * Picks the question type (spec §8):
 * - `canTypeWords = false` → always multiple-choice.
 * - `canTypeWords = true`  → typing with probability `typingProbability` (default 50%).
 * Call it ONCE when the question is created, never during render.
 */
export function pickAnswerMode(
  canTypeWords: boolean,
  randomValue: number = Math.random(),
  typingProbability: number = DEFAULT_SETTINGS.quizTypingProbability,
): AnswerMode {
  if (!canTypeWords) return 'multiple-choice';
  const probability = Number.isFinite(typingProbability)
    ? Math.min(1, Math.max(0, typingProbability))
    : DEFAULT_SETTINGS.quizTypingProbability;
  return randomValue < probability ? 'typing' : 'multiple-choice';
}

/** Typed answers are compared with the explicitly declared `acceptedAnswers` only. */
export function isTypedAnswerCorrect(word: Pick<Word, 'acceptedAnswers'>, input: string): boolean {
  const answer = normalizeAnswer(input);
  if (!answer) return false;
  return word.acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === answer);
}

export interface Choice {
  wordId: string;
  text: string;
}

export interface BuildChoicesParams {
  word: Word;
  getWord: (id: string) => Word | undefined;
  /** Words of the same scene — used after the curated `distractorWordIds`. */
  sceneWordIds: readonly string[];
  /** Every word in the dictionary — last-resort pool. */
  allWordIds?: readonly string[];
  /** Total number of options including the correct one. */
  count?: number;
  random?: RandomFn;
}

/**
 * Builds the shuffled options of a multiple-choice question: exactly one correct option and up to
 * `count - 1` distractors, never two options with the same normalized text, never a distractor that
 * would also be an accepted answer. Distractors come from (in order) the curated list, the same
 * scene, then the whole dictionary.
 */
export function buildChoices({
  word,
  getWord,
  sceneWordIds,
  allWordIds = [],
  count = QUIZ_CONFIG.choiceCount,
  random = Math.random,
}: BuildChoicesParams): Choice[] {
  const correctText = normalizeAnswer(word.text);
  const usedTexts = new Set<string>([correctText, ...word.acceptedAnswers.map(normalizeAnswer)]);
  const usedIds = new Set<string>([word.id]);
  const distractors: Choice[] = [];

  const tryAdd = (id: string) => {
    if (distractors.length >= count - 1 || usedIds.has(id)) return;
    usedIds.add(id);
    const candidate = getWord(id);
    if (!candidate) return;
    const text = normalizeAnswer(candidate.text);
    if (!text || usedTexts.has(text)) return;
    // A synonym of the correct word would be a second correct answer.
    if (candidate.acceptedAnswers.some((answer) => normalizeAnswer(answer) === correctText)) return;
    usedTexts.add(text);
    distractors.push({ wordId: candidate.id, text: candidate.text });
  };

  for (const id of shuffle(word.distractorWordIds ?? [], random)) tryAdd(id);
  for (const id of shuffle(sceneWordIds, random)) tryAdd(id);
  for (const id of shuffle(allWordIds, random)) tryAdd(id);

  return shuffle([{ wordId: word.id, text: word.text }, ...distractors], random);
}

export interface QuizPrompt {
  id: string;
  text: string;
  textVi: string;
}

/**
 * Picks the question prompt at random, skipping the ones used in the last `window - 1` questions,
 * so no prompt repeats within `window` consecutive questions. `recentIds` is oldest first.
 */
export function pickQuizPrompt(
  recentIds: readonly string[],
  prompts: readonly QuizPrompt[] = QUIZ_PROMPTS,
  window: number = QUIZ_CONFIG.promptNoRepeatWindow,
  random: RandomFn = Math.random,
): QuizPrompt {
  const blocked = new Set(window > 1 ? recentIds.slice(-(window - 1)) : []);
  const fresh = prompts.filter((prompt) => !blocked.has(prompt.id));
  // Fewer prompts than the window: settle for anything but the previous one.
  const pool = fresh.length > 0 ? fresh : prompts.filter((p) => p.id !== recentIds.at(-1));
  const candidates = pool.length > 0 ? pool : prompts;
  return candidates[Math.floor(random() * candidates.length)];
}

export interface QuizQuestion {
  id: string;
  sceneId: string;
  wordId: string;
  /** The question asked ("What is this object?"), picked once at creation. */
  prompt: QuizPrompt;
  mode: AnswerMode;
  /** Shuffled once at creation and never re-shuffled. Empty in typing mode. */
  choices: readonly Choice[];
}

export interface CreateQuizQuestionParams {
  sceneId: string;
  word: Word;
  getWord: (id: string) => Word | undefined;
  sceneWordIds: readonly string[];
  allWordIds?: readonly string[];
  canTypeWords: boolean;
  typingProbability?: number;
  choiceCount?: number;
  minChoiceCount?: number;
  /** Prompt ids of the previous questions (oldest first), so a prompt isn't repeated too soon. */
  recentPromptIds?: readonly string[];
  random?: RandomFn;
}

let questionCounter = 0;

/**
 * Creates an immutable question: the prompt, the answer mode and the option order are fixed here, so
 * re-renders cannot change them (spec §8, §16).
 */
export function createQuizQuestion({
  sceneId,
  word,
  getWord,
  sceneWordIds,
  allWordIds,
  canTypeWords,
  typingProbability,
  choiceCount = QUIZ_CONFIG.choiceCount,
  minChoiceCount = QUIZ_CONFIG.minChoiceCount,
  recentPromptIds = [],
  random = Math.random,
}: CreateQuizQuestionParams): QuizQuestion {
  const prompt = pickQuizPrompt(recentPromptIds, QUIZ_PROMPTS, undefined, random);
  let mode = pickAnswerMode(canTypeWords, random(), typingProbability);
  let choices: Choice[] = [];

  if (mode === 'multiple-choice') {
    choices = buildChoices({
      word,
      getWord,
      sceneWordIds,
      allWordIds,
      count: choiceCount,
      random,
    });
    // Not enough valid options: fall back to typing when the learner can type (spec §8).
    if (choices.length < minChoiceCount && canTypeWords) {
      mode = 'typing';
      choices = [];
    }
  }

  questionCounter += 1;
  return Object.freeze({
    id: `${sceneId}:${word.id}:${questionCounter}`,
    sceneId,
    wordId: word.id,
    prompt,
    mode,
    choices: Object.freeze(choices),
  });
}

export function isChoiceCorrect(question: Pick<QuizQuestion, 'wordId'>, wordId: string): boolean {
  return question.wordId === wordId;
}
