import { FILL_BLANKS_CONFIG } from '@/config/app';
import type { DialogueLine } from '@/types/models';
import { shuffle, type RandomFn } from './random';

/**
 * Fill in the blanks (spec §9.6): one word of each dialogue line is hidden; the learner chooses it
 * among a few words (everyone) or types it back (learners who can type). Words of the scene's vocabulary are hidden first (they practise the words just learned),
 * then longer content words; little words ("the", "is", 的…) and the speakers' names never are.
 */

export type BlankPiece =
  { kind: 'text'; text: string } | { kind: 'blank'; id: string; answer: string };

export interface BlankLine {
  lineId: string;
  pieces: BlankPiece[];
}

/** A hidden word. */
export type Blank = Extract<BlankPiece, { kind: 'blank' }>;

/** The blanks of a round, in dialogue order. */
export function blanksOf(blankLines: readonly BlankLine[]): Blank[] {
  return blankLines.flatMap((line) =>
    line.pieces.filter((piece): piece is Blank => piece.kind === 'blank'),
  );
}

export interface BuildBlanksOptions {
  /** The scene's vocabulary in the course language, e.g. "bed", "台灯". */
  vocabulary: readonly string[];
  /** Speaker names, never hidden. */
  names: readonly string[];
  /** Language of the lines (word boundaries), e.g. "en-US" or "zh-CN". */
  lang: string;
  random?: RandomFn;
}

const HAN = /\p{Script=Han}/u;

const STOP_WORDS_EN = new Set(
  (
    'the and but for nor yet you your yours are was were been being this that these those what ' +
    'where who whom whose how why when which with from into onto about have has had can could ' +
    'will would shall should may might must not its our ours their theirs them they there here ' +
    'his her hers she him mine yes yeah okay wow hey hello please thanks thank too very all some ' +
    "any just also then than now out off over under does did let lets it’s it's i’m i'm " +
    "don’t don't let’s let's that’s that's what’s what's where’s where's here’s here's " +
    "there’s there's isn’t isn't aren’t aren't can’t can't won’t won't you’re you're " +
    "we’re we're they’re they're i’ll i'll you’ll you'll we’ll we'll"
  ).split(/\s+/),
);

const STOP_WORDS_ZH = new Set([
  '我们',
  '你们',
  '他们',
  '她们',
  '它们',
  '这个',
  '那个',
  '这些',
  '那些',
  '什么',
  '怎么',
  '为什么',
  '哪里',
  '那里',
  '这里',
  '可以',
  '一起',
  '一下',
  '一个',
  '好的',
  '谢谢',
  '对呀',
  '是的',
  '不是',
  '没有',
  '现在',
  '还有',
  '我的',
  '你的',
  '他的',
  '她的',
]);

interface Candidate {
  start: number;
  end: number;
  vocabulary: boolean;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Finds `word` in `text`: English as a whole word (plurals too, case-insensitive), Chinese as is.
 * No lookbehind (older Safari): the character before the word is captured instead.
 */
function findAll(text: string, word: string, plurals = false): { start: number; end: number }[] {
  const pattern = HAN.test(word)
    ? new RegExp(`()(${escapeRegExp(word)})`, 'gu')
    : new RegExp(
        `(^|[^\\p{L}\\p{N}'’-])(${escapeRegExp(word)}${plurals ? '(?:e?s)?' : ''})(?![\\p{L}\\p{N}'’-])`,
        'giu',
      );
  return [...text.matchAll(pattern)].map((match) => {
    const start = match.index + match[1].length;
    return { start, end: start + match[2].length };
  });
}

const hasSegmenter = () => typeof Intl !== 'undefined' && 'Segmenter' in Intl;

/** One word segmenter per language: creating them is slow. */
const segmenters = new Map<string, Intl.Segmenter>();
function wordSegmenter(lang: string): Intl.Segmenter {
  let segmenter = segmenters.get(lang);
  if (!segmenter) {
    segmenter = new Intl.Segmenter(lang, { granularity: 'word' });
    segmenters.set(lang, segmenter);
  }
  return segmenter;
}

/** Every word boundary of the line, or `null` without Intl.Segmenter. */
function wordBoundaries(text: string, lang: string): Set<number> | null {
  if (!hasSegmenter()) return null;
  const boundaries = new Set([0, text.length]);
  for (const segment of wordSegmenter(lang).segment(text)) {
    boundaries.add(segment.index);
    boundaries.add(segment.index + segment.segment.length);
  }
  return boundaries;
}

/** A place word a Chinese noun can carry in the same segment: 书桌上, 盒子里. */
const HAN_PLACE_WORD = /^[上里下边旁前后中外儿]$/u;
/** Right after a verb, not a noun: 画着, 画了. */
const HAN_ASPECT = /^[着了过]$/u;

/** Where vocabulary words appear in the line. Chinese: whole words only, never 床 inside 起床. */
function vocabularyCandidates(
  text: string,
  vocabulary: readonly string[],
  boundaries: Set<number> | null,
): Candidate[] {
  const found: Candidate[] = [];
  const longestFirst = [...new Set(vocabulary.map((word) => word.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  for (const word of longestFirst) {
    for (const { start, end } of findAll(text, word, true)) {
      if (HAN.test(word) && boundaries) {
        const next = text[end] ?? '';
        const endsWord =
          boundaries.has(end) || (HAN_PLACE_WORD.test(next) && boundaries.has(end + 1));
        if (!boundaries.has(start) || !endsWord || HAN_ASPECT.test(next)) continue;
      }
      if (found.some((other) => start < other.end && other.start < end)) continue;
      found.push({ start, end, vocabulary: true });
    }
  }
  return found;
}

interface WordSpan {
  start: number;
  end: number;
  text: string;
}

/** Words of the line with their positions (Intl.Segmenter splits Chinese into words too). */
function wordSpans(text: string, lang: string): WordSpan[] {
  if (hasSegmenter()) {
    const segmenter = wordSegmenter(lang);
    return [...segmenter.segment(text)]
      .filter((segment) => segment.isWordLike)
      .map((segment) => ({
        start: segment.index,
        end: segment.index + segment.segment.length,
        text: segment.segment,
      }));
  }
  // Old browsers: English words only; Chinese lines then rely on the vocabulary.
  return [...text.matchAll(/[A-Za-z][A-Za-z'’-]*/g)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    text: match[0],
  }));
}

function contentCandidates(text: string, lang: string): Candidate[] {
  return wordSpans(text, lang).flatMap((span) => {
    const word = span.text.toLowerCase();
    if (HAN.test(word)) {
      // Not a pronoun + something ("我先") nor something + particle ("点了"): the segmenter's
      // leftovers rather than words.
      const usable =
        /^\p{Script=Han}+$/u.test(word) &&
        Array.from(word).length >= FILL_BLANKS_CONFIG.minHanLength &&
        !STOP_WORDS_ZH.has(word) &&
        !/^[我你他她它]|[了的吗呢吧呀啊哦么嘛]$/u.test(word);
      return usable ? [{ start: span.start, end: span.end, vocabulary: false }] : [];
    }
    const usable =
      /^\p{L}[\p{L}'’-]*$/u.test(span.text) &&
      span.text.length >= FILL_BLANKS_CONFIG.minWordLength &&
      !STOP_WORDS_EN.has(word);
    return usable ? [{ start: span.start, end: span.end, vocabulary: false }] : [];
  });
}

/**
 * A blank must not touch a speaker's name ("lily" the flower vs Lily) nor have its answer written
 * elsewhere in the same line ("I clean the ___ with the toilet brush.").
 */
function usableCandidate(text: string, candidate: Candidate, names: readonly string[]): boolean {
  const { start, end } = candidate;
  const touchesName = names.some((name) =>
    findAll(text, name).some((span) => start < span.end && span.start < end),
  );
  if (touchesName) return false;
  const answer = text.slice(start, end);
  const rest = `${text.slice(0, start)}   ${text.slice(end)}`;
  return findAll(rest, answer).length === 0;
}

/** Picks the blank of one line: a vocabulary word if there is one, else one of the longest words. */
function pickCandidate(
  text: string,
  options: BuildBlanksOptions,
  random: RandomFn,
): Candidate | null {
  const names = options.names.map((name) => name.trim()).filter(Boolean);
  const usable = (candidate: Candidate) => usableCandidate(text, candidate, names);
  const boundaries = wordBoundaries(text, options.lang);
  const vocabulary = vocabularyCandidates(text, options.vocabulary, boundaries).filter(usable);
  if (vocabulary.length > 0) return vocabulary[Math.floor(random() * vocabulary.length)];
  const content = contentCandidates(text, options.lang)
    .filter(usable)
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .slice(0, 3);
  if (content.length === 0) return null;
  return content[Math.floor(random() * content.length)];
}

/** One blank per line where a good word exists. Call once per exercise (it is random). */
export function buildBlankLines(
  lines: readonly DialogueLine[],
  options: BuildBlanksOptions,
): BlankLine[] {
  const random = options.random ?? Math.random;
  return lines.map((line) => {
    const candidate = pickCandidate(line.text, options, random);
    if (!candidate) return { lineId: line.id, pieces: [{ kind: 'text', text: line.text }] };
    const pieces: BlankPiece[] = [];
    const before = line.text.slice(0, candidate.start);
    const after = line.text.slice(candidate.end);
    if (before) pieces.push({ kind: 'text', text: before });
    pieces.push({
      kind: 'blank',
      id: `${line.id}:blank`,
      answer: line.text.slice(candidate.start, candidate.end),
    });
    if (after) pieces.push({ kind: 'text', text: after });
    return { lineId: line.id, pieces };
  });
}

/** Lower-case, same apostrophes, no punctuation or extra spaces — nothing else is forgiven. */
export function normalizeBlankAnswer(value: string): string {
  return value
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isBlankAnswerCorrect(answer: string, typed: string): boolean {
  const value = normalizeBlankAnswer(typed);
  return value !== '' && value === normalizeBlankAnswer(answer);
}

const syllableLetters = (token: string) => token.replace(/[^\p{L}\p{M}]/gu, '').toLowerCase();

interface SyllableMap {
  /** The pinyin split into syllables and the spaces between them. */
  tokens: string[];
  /** Index in `text` of each Chinese character → index of its syllable in `tokens`. */
  tokenAt: Map<number, number>;
}

/**
 * Pairs each Chinese character of `text` with its syllable in `pinyin`. Each character takes one
 * syllable; 儿 after a syllable ending in "r" shares it (哪儿 = nǎr). `null` when they don't match
 * one by one.
 */
function mapSyllables(text: string, pinyin: string): SyllableMap | null {
  const tokens = pinyin.split(/(\s+)/);
  const syllables = tokens.flatMap((token, index) => (/\p{L}/u.test(token) ? [index] : []));
  const tokenAt = new Map<number, number>();
  let next = 0;
  let position = 0;
  for (const char of text) {
    const at = position;
    position += char.length;
    if (!HAN.test(char)) continue;
    const previous = next > 0 ? syllables[next - 1] : undefined;
    const erhua =
      char === '儿' &&
      previous !== undefined &&
      /r$/u.test(syllableLetters(tokens[previous])) &&
      !/^[eéěèē]r$/u.test(syllableLetters(tokens[syllables[next]] ?? ''));
    const token = erhua ? previous : syllables[next++];
    if (token === undefined) return null;
    tokenAt.set(at, token);
  }
  return next === syllables.length ? { tokens, tokenAt } : null;
}

/**
 * Chinese course: the line's pinyin with the blank's syllables hidden — "Wā, nǐ de ___ hǎo dà ya!"
 * — so it shows how to read the line without giving the answer away. Returns the pinyin unchanged
 * when it doesn't match the characters one by one, and `undefined` without pinyin.
 */
export function blankLinePinyin(
  line: BlankLine,
  text: string,
  pinyin: string | undefined,
): string | undefined {
  if (!pinyin) return undefined;
  const hidden = new Set<number>();
  let offset = 0;
  for (const piece of line.pieces) {
    const length = piece.kind === 'text' ? piece.text.length : piece.answer.length;
    if (piece.kind === 'blank') for (let i = offset; i < offset + length; i += 1) hidden.add(i);
    offset += length;
  }
  if (hidden.size === 0) return pinyin;

  const map = mapSyllables(text, pinyin);
  if (!map) return pinyin;
  const masked = new Set([...hidden].flatMap((at) => map.tokenAt.get(at) ?? []));
  return map.tokens
    .map((token, index) => (masked.has(index) ? token.replace(/[\p{L}\p{M}]+/gu, '___') : token))
    .join('');
}

/** Word-style pinyin ("wòshì") of `text.slice(start, end)`, read from the line's pinyin. */
function spanPinyin(
  text: string,
  pinyin: string | undefined,
  start: number,
  end: number,
): string | undefined {
  if (!pinyin) return undefined;
  const map = mapSyllables(text, pinyin);
  if (!map) return undefined;
  const indexes: number[] = [];
  for (let at = start; at < end; at += 1) {
    const token = map.tokenAt.get(at);
    if (token !== undefined && !indexes.includes(token)) indexes.push(token);
  }
  if (indexes.length === 0) return undefined;
  return indexes.map((index) => syllableLetters(map.tokens[index])).join('');
}

/* -------------------------------------------------------------------------------------------------
 * Choice mode (spec §9.6): each blank offers a few words to choose from, one of them right.
 * -----------------------------------------------------------------------------------------------*/

export interface BlankChoice {
  text: string;
  /** Chinese course. */
  pinyin?: string;
}

export interface BuildBlankChoicesOptions {
  /** The scene's vocabulary, used after the other blanks' answers. */
  vocabulary: readonly BlankChoice[];
  /** Language of the lines (word boundaries), e.g. "en-US" or "zh-CN". */
  lang: string;
  /** Options per blank, the right one included. */
  count?: number;
  random?: RandomFn;
}

/** "books" and "book" are the same word to tell apart: never offered together. */
const englishStem = (value: string) => normalizeBlankAnswer(value).replace(/(?:es|s)$/u, '');

/** A distractor written like the answer: capital at the start of a line, else lower-case. */
function matchCase(answer: string, word: string): string {
  if (HAN.test(answer) || !word) return word;
  const first = answer.charAt(0);
  const capital = first !== first.toLowerCase();
  const head = capital ? word.charAt(0).toUpperCase() : word.charAt(0).toLowerCase();
  return head + word.slice(1);
}

/**
 * The options of every blank, shuffled once (call once per round, like quiz options): the answer
 * and distractors taken from, in order, the other blanks' answers, the scene's vocabulary, then the
 * other content words of the conversation. Never two options with the same text, never a
 * distractor in another script, never "book" next to "books".
 */
export function buildBlankChoices(
  lines: readonly DialogueLine[],
  blankLines: readonly BlankLine[],
  options: BuildBlankChoicesOptions,
): Record<string, BlankChoice[]> {
  const random = options.random ?? Math.random;
  const count = options.count ?? FILL_BLANKS_CONFIG.choiceCount;
  const lineById = new Map(lines.map((line) => [line.id, line]));

  const answers: (BlankChoice & { id: string })[] = blankLines.flatMap((blankLine) => {
    const line = lineById.get(blankLine.lineId);
    let offset = 0;
    return blankLine.pieces.flatMap((piece) => {
      const start = offset;
      offset += piece.kind === 'text' ? piece.text.length : piece.answer.length;
      if (piece.kind === 'text') return [];
      const pinyin = line && spanPinyin(line.text, line.pinyin, start, offset);
      return [{ id: piece.id, text: piece.answer, ...(pinyin ? { pinyin } : {}) }];
    });
  });

  const contentWords: BlankChoice[] = lines.flatMap((line) =>
    contentCandidates(line.text, options.lang).map(({ start, end }) => {
      const pinyin = spanPinyin(line.text, line.pinyin, start, end);
      return { text: line.text.slice(start, end), ...(pinyin ? { pinyin } : {}) };
    }),
  );

  const result: Record<string, BlankChoice[]> = {};
  for (const answer of answers) {
    const han = HAN.test(answer.text);
    const used = new Set([normalizeBlankAnswer(answer.text)]);
    const stems = new Set([englishStem(answer.text)]);
    const distractors: BlankChoice[] = [];
    const tryAdd = (word: BlankChoice) => {
      if (distractors.length >= count - 1) return;
      const text = matchCase(answer.text, word.text.trim());
      const normalized = normalizeBlankAnswer(text);
      if (!normalized || used.has(normalized) || HAN.test(text) !== han) return;
      if (!han && stems.has(englishStem(text))) return;
      used.add(normalized);
      if (!han) stems.add(englishStem(text));
      distractors.push({ text, ...(word.pinyin ? { pinyin: word.pinyin } : {}) });
    };
    for (const other of shuffle(answers, random)) if (other.id !== answer.id) tryAdd(other);
    for (const word of shuffle(options.vocabulary, random)) tryAdd(word);
    for (const word of shuffle(contentWords, random)) tryAdd(word);
    const right: BlankChoice = {
      text: answer.text,
      ...(answer.pinyin ? { pinyin: answer.pinyin } : {}),
    };
    result[answer.id] = shuffle([right, ...distractors], random);
  }
  return result;
}
