import { SPEAKING_SCORE } from '@/config/app';
import { hanNumber, hanUnit, speechTokens } from './speechMatch';

/**
 * Speaking score of Word Speaking and Role-play (spec §7.7, §9.5).
 *
 * The browser's speech recognizer only returns text: its best guesses of what was said. The score
 * estimates from those guesses how close the learner came. The target is aligned with each guess —
 * letters for a vocabulary word, words for an English sentence, characters for Chinese — and every
 * piece of the target is marked good / fair / bad, so the screen can colour the sounds to practise.
 *
 * It is a learning aid, NOT an acoustic pronunciation assessment: a recognizer may guess a word
 * from context or miss a well-said rare one. The screens say so (see `SpeakingScoreNote`).
 */

export interface HeardAlternative {
  transcript: string;
  /** 0–1 as reported by the recognizer; 0 = not reported. */
  confidence: number;
}

export type SoundStatus = 'good' | 'fair' | 'bad';

export interface ScoredPart {
  /** A piece of the target as written: a sound group of a word, a word, a Chinese character. */
  text: string;
  /** `null` for spaces and punctuation, which are not scored. */
  status: SoundStatus | null;
}

export type SpeakingLevel = 'great' | 'good' | 'try-again';

export interface SpeakingScore {
  /** 0–100. */
  score: number;
  level: SpeakingLevel;
  /** The recognizer guess the score is based on. */
  heard: string;
  /** The target, piece by piece, each marked good / fair / bad. */
  parts: ScoredPart[];
  /** Chinese: a character was heard with the right sound but another tone. */
  toneHint: boolean;
}

/** Tone-numbered pinyin of each character of a Chinese text, e.g. "台灯" → ["tai2", "deng1"]. */
export type PinyinOf = (text: string) => readonly string[];

export interface SpeakingTarget {
  /** What the learner should say. */
  text: string;
  /** `word`: a vocabulary item (one word or a short phrase); `sentence`: a dialogue line. */
  kind: 'word' | 'sentence';
  /** Other ways of saying a word that count as exact: accepted answers, words that sound the same. */
  variants?: readonly string[];
}

export function speakingLevel(score: number): SpeakingLevel {
  if (score >= SPEAKING_SCORE.great) return 'great';
  if (score >= SPEAKING_SCORE.good) return 'good';
  return 'try-again';
}

/**
 * Scores what the recognizer heard against the target. `heard` lists the recognizer's guesses, best
 * first. Returns `null` when nothing usable was heard. `pinyinOf` (Chinese course) lets characters
 * that sound the same count as right and spots tone mistakes; without it characters must match.
 */
export function scoreSpeaking(
  target: SpeakingTarget,
  heard: readonly HeardAlternative[],
  pinyinOf?: PinyinOf | null,
): SpeakingScore | null {
  const han = HAN.test(target.text);
  const prepared = han
    ? prepareHan(target.text)
    : target.kind === 'word'
      ? prepareLetters(target.text)
      : prepareWords(target.text);
  if (prepared.units.length === 0) return null;

  const matcher: Matcher = han
    ? hanMatcher(prepared, target.kind, target.variants ?? [], pinyinOf ?? null)
    : target.kind === 'word'
      ? letterMatcher(prepared, [target.text, ...(target.variants ?? [])])
      : wordMatcher(prepared);

  const attempts: Attempt[] = [];
  heard.forEach((alternative, rank) => {
    const transcript = alternative.transcript.trim();
    const match = transcript ? matcher(transcript) : null;
    if (!match) return;
    const score = attemptScore(match, rank, alternative.confidence, target.kind);
    attempts.push({ ...match, rank, transcript, score });
  });
  if (attempts.length === 0) return null;

  const best = attempts.reduce((current, next) => (next.score > current.score ? next : current));
  let { statuses, inserted, toneHint } = best;
  if (best.exact) {
    statuses = statuses.map(() => 'good');
    inserted = inserted.map(() => false);
    toneHint = false;
    // Right only on a later guess: the voice sounded more like the first guess, so its mistakes are
    // shown gently, as "almost".
    const first = attempts[0];
    if (first !== best && !first.exact) {
      statuses = first.statuses.map((status) => (status === 'bad' ? 'fair' : status));
      inserted = first.inserted;
      toneHint = first.toneHint;
    }
  }

  const partStatuses = groupStatuses(prepared, statuses, inserted);
  const parts = prepared.parts.map((part, index) =>
    part.status === null ? part : { text: part.text, status: partStatuses[index] },
  );
  // "Excellent!" never sits next to a red mark: a missed part keeps the score under it.
  const missed = parts.some((part) => part.status === 'bad');
  const score = missed ? Math.min(best.score, SPEAKING_SCORE.great - 1) : best.score;
  return { score, level: speakingLevel(score), heard: best.transcript, parts, toneHint };
}

/* -------------------------------------------------------------------------------------------------
 * Targets: the pieces shown on screen and the units that are aligned.
 * -----------------------------------------------------------------------------------------------*/

const HAN = /\p{Script=Han}/u;

interface PreparedTarget {
  /** `letters`: a vocabulary word; `words`: an English sentence; `han`: Chinese text. */
  mode: 'letters' | 'words' | 'han';
  /** Pieces in display order; scored pieces start as 'good'. */
  parts: ScoredPart[];
  /** What is aligned: letters, word tokens or characters. */
  units: string[];
  /** Index of the part each unit belongs to. */
  partOfUnit: number[];
  /** Number of spoken words (letters mode). */
  wordCount: number;
}

/** Lower-case a–z / 0–9 of one character, without accents ("é" → "e"); '' for anything else. */
function letterOf(char: string): string {
  const base = char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return /^[a-z0-9]$/.test(base) ? base : '';
}

const lettersOf = (text: string) => Array.from(text).map(letterOf).join('');

/**
 * Spelling groups that usually make one sound, so a whole "th" or "ee" lights up together, like the
 * sounds of a pronunciation app. Only for colouring: the score itself compares letters.
 */
const SOUND_GROUPS = new Set([
  'ough',
  'augh',
  'eigh',
  'tch',
  'dge',
  'igh',
  'ch',
  'sh',
  'th',
  'ph',
  'wh',
  'ck',
  'ng',
  'qu',
  'kn',
  'wr',
  'gh',
  'ee',
  'ea',
  'oo',
  'ou',
  'ow',
  'oi',
  'oy',
  'ai',
  'ay',
  'au',
  'aw',
  'ew',
  'oa',
  'ie',
  'ue',
  'er',
  'ir',
  'ur',
  'ar',
  'or',
]);

/** Lengths of the sound groups of a lower-case word, e.g. "theater" → th|ea|t|er = [2, 2, 1, 2]. */
export function soundGroupLengths(word: string): number[] {
  const lengths: number[] = [];
  for (let i = 0; i < word.length;) {
    let size = 1;
    for (const length of [4, 3, 2]) {
      const chunk = word.slice(i, i + length);
      if (chunk.length !== length) continue;
      const doubled = length === 2 && chunk[0] === chunk[1] && !/[aeiou]/.test(chunk[0]);
      if (SOUND_GROUPS.has(chunk) || doubled) {
        size = length;
        break;
      }
    }
    lengths.push(size);
    i += size;
  }
  return lengths;
}

function prepareLetters(text: string): PreparedTarget {
  const target: PreparedTarget = {
    mode: 'letters',
    parts: [],
    units: [],
    partOfUnit: [],
    wordCount: 0,
  };
  const chars = Array.from(text.trim());
  for (let i = 0; i < chars.length;) {
    if (!letterOf(chars[i])) {
      let gap = '';
      while (i < chars.length && !letterOf(chars[i])) gap += chars[i++];
      target.parts.push({ text: gap, status: null });
      continue;
    }
    const run: string[] = [];
    while (i < chars.length && letterOf(chars[i])) run.push(chars[i++]);
    const lower = run.map(letterOf).join('');
    target.wordCount += 1;
    let offset = 0;
    for (const length of soundGroupLengths(lower)) {
      const partIndex = target.parts.length;
      target.parts.push({ text: run.slice(offset, offset + length).join(''), status: 'good' });
      for (let k = offset; k < offset + length; k += 1) {
        target.units.push(lower[k]);
        target.partOfUnit.push(partIndex);
      }
      offset += length;
    }
  }
  return target;
}

function prepareWords(text: string): PreparedTarget {
  const target: PreparedTarget = {
    mode: 'words',
    parts: [],
    units: [],
    partOfUnit: [],
    wordCount: 0,
  };
  for (const piece of text.trim().split(/(\s+)/)) {
    if (!piece) continue;
    const tokens = /^\s+$/.test(piece) ? [] : speechTokens(piece);
    if (tokens.length === 0) {
      target.parts.push({ text: piece, status: null });
      continue;
    }
    const partIndex = target.parts.length;
    target.parts.push({ text: piece, status: 'good' });
    for (const token of tokens) {
      target.units.push(token);
      target.partOfUnit.push(partIndex);
    }
  }
  target.wordCount = target.parts.filter((part) => part.status !== null).length;
  return target;
}

/**
 * One part per character; punctuation stays attached to the character before it. A number written
 * in digits is one part whose units are its Chinese numerals ("30" → 三, 十).
 */
function prepareHan(text: string): PreparedTarget {
  const target: PreparedTarget = {
    mode: 'han',
    parts: [],
    units: [],
    partOfUnit: [],
    wordCount: 0,
  };
  const chars = Array.from(text.trim());
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    if (/\d/.test(char)) {
      let digits = char;
      while (i + 1 < chars.length && /\d/.test(chars[i + 1])) digits += chars[++i];
      const units = digits.length <= 4 ? Array.from(hanNumber(Number(digits))) : [...digits];
      for (const unit of units) {
        target.partOfUnit.push(target.parts.length);
        target.units.push(unit);
      }
      target.parts.push({ text: digits, status: 'good' });
      continue;
    }
    if (HAN.test(char)) {
      target.partOfUnit.push(target.parts.length);
      target.parts.push({ text: char, status: 'good' });
      target.units.push(hanUnit(char));
      continue;
    }
    const previous = target.parts.at(-1);
    if (previous && (previous.status === null || /\p{P}/u.test(char))) previous.text += char;
    else target.parts.push({ text: char, status: null });
  }
  return target;
}

/* -------------------------------------------------------------------------------------------------
 * Alignment
 * -----------------------------------------------------------------------------------------------*/

interface Cost {
  cost: number;
  status: SoundStatus;
}

const GOOD: Cost = { cost: 0, status: 'good' };
const BAD: Cost = { cost: 1, status: 'bad' };

interface Alignment {
  cost: number;
  /** Per target unit. Missing units are 'bad'. */
  statuses: SoundStatus[];
  /** Per target unit: something extra was said right after it. */
  inserted: boolean[];
}

/**
 * Weighted edit distance between `n` target units and `m` heard units, with the path. A missing unit
 * costs 1, an extra one `insertCost`. With `freeEnds`, extra units before and after the target are
 * free (the learner said more than the target, e.g. "这是台灯" for 台灯).
 */
function align(
  n: number,
  m: number,
  substitute: (i: number, j: number) => Cost,
  insertCost: number,
  freeEnds: boolean,
): Alignment {
  const subs = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => substitute(i, j)),
  );
  const insertion = (i: number) => (freeEnds && (i === 0 || i === n) ? 0 : insertCost);
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let j = 1; j <= m; j += 1) dp[0][j] = dp[0][j - 1] + insertion(0);
  for (let i = 1; i <= n; i += 1) {
    dp[i][0] = i;
    for (let j = 1; j <= m; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subs[i - 1][j - 1].cost,
        dp[i - 1][j] + 1,
        dp[i][j - 1] + insertion(i),
      );
    }
  }

  // Walk back along a cheapest path. On ties: a matching unit first, then an extra unit (so extra
  // sounds land at the end, "rock" for "rug" = r·u→o·g→c +k), then a swap, then a missing unit.
  const statuses = new Array<SoundStatus>(n).fill('bad');
  const inserted = new Array<boolean>(n).fill(false);
  const same = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  for (let i = n, j = m; i > 0 || j > 0;) {
    const diagonal = i > 0 && j > 0 ? subs[i - 1][j - 1] : null;
    const viaDiagonal = !!diagonal && same(dp[i][j], dp[i - 1][j - 1] + diagonal.cost);
    if (diagonal && viaDiagonal && diagonal.cost === 0) {
      statuses[i - 1] = diagonal.status;
      i -= 1;
      j -= 1;
    } else if (j > 0 && same(dp[i][j], dp[i][j - 1] + insertion(i))) {
      if (insertion(i) > 0) inserted[Math.max(0, i - 1)] = true;
      j -= 1;
    } else if (diagonal && viaDiagonal) {
      statuses[i - 1] = diagonal.status;
      i -= 1;
      j -= 1;
    } else {
      statuses[i - 1] = 'bad';
      i -= 1;
    }
  }
  return { cost: dp[n][m], statuses, inserted };
}

/** What a matcher found for one recognizer guess. */
interface Match {
  /** 0–1: share of the target that was said right. */
  accuracy: number;
  exact: boolean;
  statuses: SoundStatus[];
  inserted: boolean[];
  toneHint: boolean;
}

interface Attempt extends Match {
  rank: number;
  transcript: string;
  score: number;
}

type Matcher = (transcript: string) => Match | null;

function toMatch(alignment: Alignment, n: number, toneHint = false): Match {
  return {
    accuracy: Math.max(0, 1 - alignment.cost / n),
    exact: alignment.cost === 0,
    statuses: alignment.statuses,
    inserted: alignment.inserted,
    toneHint,
  };
}

const exactMatch = (n: number): Match => ({
  accuracy: 1,
  exact: true,
  statuses: new Array<SoundStatus>(n).fill('good'),
  inserted: new Array<boolean>(n).fill(false),
  toneHint: false,
});

/**
 * A vocabulary word: the closest run of heard words (so "it's a lamp" finds "lamp", "night stand"
 * finds "nightstand"), compared letter by letter. A variant heard exactly counts as exact.
 */
function letterMatcher(target: PreparedTarget, variants: readonly string[]): Matcher {
  const n = target.units.length;
  const exactForms = new Set(
    variants.map((variant) => speechTokens(variant).map(lettersOf).join('')),
  );
  const maxWords = target.wordCount + 2;
  return (transcript) => {
    const words = speechTokens(transcript).map(lettersOf).filter(Boolean);
    if (words.length === 0) return null;
    let best: Alignment | null = null;
    for (let start = 0; start < words.length; start += 1) {
      for (let count = 1; count <= maxWords && start + count <= words.length; count += 1) {
        const heard = words.slice(start, start + count).join('');
        if (exactForms.has(heard)) return exactMatch(n);
        const alignment = align(
          n,
          heard.length,
          (i, j) => (target.units[i] === heard[j] ? GOOD : BAD),
          1,
          false,
        );
        if (!best || alignment.cost < best.cost) best = alignment;
      }
    }
    return best && toMatch(best, n);
  };
}

/** Levenshtein distance between two short strings. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/** 0–1 by letters: "your" / "you" = 0.75. */
export function letterSimilarity(a: string, b: string): number {
  const length = Math.max(a.length, b.length);
  return length === 0 ? 1 : 1 - editDistance(a, b) / length;
}

/** An English sentence, word by word; a close word ("you" for "your") is "almost". */
function wordMatcher(target: PreparedTarget): Matcher {
  const n = target.units.length;
  return (transcript) => {
    const heard = speechTokens(transcript);
    if (heard.length === 0) return null;
    const alignment = align(
      n,
      heard.length,
      (i, j) => {
        if (target.units[i] === heard[j]) return GOOD;
        const similarity = letterSimilarity(target.units[i], heard[j]);
        return similarity >= SPEAKING_SCORE.fairWordSimilarity
          ? { cost: 1 - similarity, status: 'fair' }
          : BAD;
      },
      SPEAKING_SCORE.insertionCost,
      true,
    );
    return toMatch(alignment, n);
  };
}

const withoutTone = (pinyin: string) => pinyin.replace(/\d$/, '');

/** Pinyin of each unit, or `null` when it can't be worked out (no pinyin loaded, odd input). */
function pinyinOfUnits(units: readonly string[], pinyinOf: PinyinOf | null): (string | null)[] {
  const result = units.map((): string | null => null);
  if (!pinyinOf) return result;
  const hanIndexes = units.flatMap((unit, index) =>
    /^\p{Script=Han}$/u.test(unit) ? [index] : [],
  );
  if (hanIndexes.length === 0) return result;
  try {
    const pinyin = pinyinOf(hanIndexes.map((index) => units[index]).join(''));
    if (pinyin.length !== hanIndexes.length) return result;
    hanIndexes.forEach((unitIndex, k) => {
      result[unitIndex] = /^[a-zü]+\d$/.test(pinyin[k]) ? pinyin[k] : null;
    });
  } catch {
    // Treat as unknown: characters must then match exactly.
  }
  return result;
}

/**
 * Chinese, character by character. A different character with the same sound counts as right
 * (recognizers pick among homophones); the same syllable with another tone is "almost". A variant
 * (accepted answer) heard anywhere in the guess counts as exact.
 */
function hanMatcher(
  target: PreparedTarget,
  kind: SpeakingTarget['kind'],
  variants: readonly string[],
  pinyinOf: PinyinOf | null,
): Matcher {
  const n = target.units.length;
  const targetPinyin = pinyinOfUnits(target.units, pinyinOf);
  const insertCost = kind === 'word' ? 1 : SPEAKING_SCORE.insertionCost;
  const exactForms = variants.map((variant) => speechTokens(variant).join('')).filter(Boolean);
  return (transcript) => {
    const heard = speechTokens(transcript);
    if (heard.length === 0) return null;
    const joined = heard.join('');
    if (exactForms.some((form) => joined.includes(form))) return exactMatch(n);
    const heardPinyin = pinyinOfUnits(heard, pinyinOf);
    const alignment = align(
      n,
      heard.length,
      (i, j) => {
        if (target.units[i] === heard[j]) return GOOD;
        const a = targetPinyin[i];
        const b = heardPinyin[j];
        if (a && b && a === b) return GOOD;
        if (a && b && withoutTone(a) === withoutTone(b)) {
          return { cost: SPEAKING_SCORE.toneSlipCost, status: 'fair' };
        }
        return BAD;
      },
      insertCost,
      true,
    );
    return toMatch(alignment, n, alignment.statuses.includes('fair'));
  };
}

/* -------------------------------------------------------------------------------------------------
 * Scores
 * -----------------------------------------------------------------------------------------------*/

function attemptScore(
  match: Match,
  rank: number,
  confidence: number,
  kind: SpeakingTarget['kind'],
): number {
  let raw = match.exact
    ? 100
    : match.accuracy * (kind === 'word' ? SPEAKING_SCORE.nearMissMax : 100);
  if (confidence > 0) raw *= 1 - SPEAKING_SCORE.confidenceWeight * (1 - Math.min(1, confidence));
  const penalties = SPEAKING_SCORE.rankPenalty[kind];
  raw -= penalties[Math.min(rank, penalties.length - 1)];
  return Math.max(0, Math.min(100, Math.round(raw)));
}

const SEVERITY: Record<SoundStatus, number> = { good: 0, fair: 1, bad: 2 };

/**
 * Status of each part from its units. A sound group is bad when at least half of its letters were
 * wrong, fair for a smaller slip or an extra sound right after it. A word or a character takes the
 * worst status of its units.
 */
function groupStatuses(
  target: PreparedTarget,
  statuses: readonly SoundStatus[],
  inserted: readonly boolean[],
): SoundStatus[] {
  return target.parts.map((_, partIndex) => {
    const units = target.partOfUnit.flatMap((part, unit) => (part === partIndex ? [unit] : []));
    if (units.length === 0) return 'good';
    if (target.mode === 'letters') {
      const bad = units.filter((unit) => statuses[unit] === 'bad').length;
      if (bad > 0 && bad * 2 >= units.length) return 'bad';
      const slip = bad > 0 || units.some((unit) => statuses[unit] === 'fair' || inserted[unit]);
      return slip ? 'fair' : 'good';
    }
    return units
      .map((unit) => statuses[unit])
      .reduce((worst, status) => (SEVERITY[status] > SEVERITY[worst] ? status : worst), 'good');
  });
}
