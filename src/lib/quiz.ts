import { DEFAULT_SETTINGS, QUIZ_CONFIG } from '@/config/app';
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

export interface QuizQuestion {
  id: string;
  sceneId: string;
  wordId: string;
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
  random?: RandomFn;
}

let questionCounter = 0;

/**
 * Creates an immutable question: the answer mode and the option order are fixed here, so
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
  random = Math.random,
}: CreateQuizQuestionParams): QuizQuestion {
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
    mode,
    choices: Object.freeze(choices),
  });
}

export function isChoiceCorrect(question: Pick<QuizQuestion, 'wordId'>, wordId: string): boolean {
  return question.wordId === wordId;
}
