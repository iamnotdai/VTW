import { SPEAKING_FEEDBACK } from '@/config/app';

/**
 * Simple word matching between a sample sentence and what the speech recognizer heard
 * (spec §9.4). This is a learning aid, NOT a pronunciation score: it only checks whether the
 * expected words were recognized, in any order.
 */

const CONTRACTIONS: Record<string, string[]> = {
  "i'm": ['i', 'am'],
  "it's": ['it', 'is'],
  "that's": ['that', 'is'],
  "there's": ['there', 'is'],
  "what's": ['what', 'is'],
  "where's": ['where', 'is'],
  "he's": ['he', 'is'],
  "she's": ['she', 'is'],
  "let's": ['let', 'us'],
  "don't": ['do', 'not'],
  "doesn't": ['does', 'not'],
  "didn't": ['did', 'not'],
  "isn't": ['is', 'not'],
  "aren't": ['are', 'not'],
  "can't": ['can', 'not'],
  cannot: ['can', 'not'],
  "won't": ['will', 'not'],
  "i'll": ['i', 'will'],
  "you're": ['you', 'are'],
  "we're": ['we', 'are'],
  "they're": ['they', 'are'],
  "i've": ['i', 'have'],
};

/* Recognizers write numbers as digits ("30 minutes", "30分钟"); the samples spell them out. Both
 * sides are compared spelled out, up to 9999. */
const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 30 → ["thirty"], 24 → ["twenty", "four"] (like "twenty-four"), 105 → ["one", "hundred", "five"]. */
export function numberWords(value: number): string[] {
  if (value < 20) return [ONES[value]];
  if (value < 100) {
    const tens = TENS[Math.floor(value / 10)];
    return value % 10 ? [tens, ONES[value % 10]] : [tens];
  }
  const [unit, size] = value < 1000 ? [100, 'hundred'] : [1000, 'thousand'];
  const rest = value % unit;
  return [...numberWords(Math.floor(value / unit)), size, ...(rest ? numberWords(rest) : [])];
}

/* Chinese has no spaces between words: each character is matched on its own. Digits become Chinese
 * numerals (30 → 三十), and 两 / 二 ("two") are counted as the same. */
const HAN = /\p{Script=Han}/u;
const HAN_DIGITS = '零一二三四五六七八九';

/** 30 → 三十, 15 → 十五, 105 → 一百零五, 110 → 一百一十. */
export function hanNumber(value: number): string {
  if (value < 10) return HAN_DIGITS[value];
  if (value < 100) {
    const tens = Math.floor(value / 10);
    return `${tens === 1 ? '' : HAN_DIGITS[tens]}十${value % 10 ? HAN_DIGITS[value % 10] : ''}`;
  }
  const [unit, size] = value < 1000 ? [100, '百'] : [1000, '千'];
  const rest = value % unit;
  const restText =
    rest === 0
      ? ''
      : `${rest < unit / 10 ? '零' : ''}${rest >= 10 && rest < 20 ? '一' : ''}${hanNumber(rest)}`;
  return `${HAN_DIGITS[Math.floor(value / unit)]}${size}${restText}`;
}

/** A Chinese character as both sides count it: 两 → 二, other characters unchanged. */
export function hanUnit(char: string): string {
  return char === '两' ? '二' : char;
}

const DIGITS = /^\d{1,4}$/;

function hanTokens(word: string): string[] {
  const parts = word.match(/\p{Script=Han}|[^\p{Script=Han}]+/gu) ?? [];
  return parts.flatMap((part) =>
    DIGITS.test(part) ? Array.from(hanNumber(Number(part))) : [hanUnit(part)],
  );
}

/**
 * Lower-cases, strips punctuation, expands common contractions and numbers. Text with Chinese
 * characters is split into single characters instead.
 */
export function speechTokens(text: string): string[] {
  const han = HAN.test(text);
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^'+|'+$/g, ''))
    .filter(Boolean)
    .flatMap((word) =>
      han
        ? hanTokens(word)
        : (CONTRACTIONS[word] ?? (DIGITS.test(word) ? numberWords(Number(word)) : [word])),
    );
}

/** The sample's words as written; for Chinese, one character each (punctuation stays attached). */
function displayWords(expected: string): string[] {
  if (!HAN.test(expected)) return expected.trim().split(/\s+/).filter(Boolean);
  return expected.match(/\p{Script=Han}[^\p{Script=Han}\s]*|[^\p{Script=Han}\s]+/gu) ?? [];
}

export interface SpeechMatchWord {
  /** Word as written in the sample sentence (with punctuation). */
  text: string;
  matched: boolean;
}

export interface SpeechMatchResult {
  /** Share of sample words that were recognized, 0–1. */
  score: number;
  words: SpeechMatchWord[];
  /** The recognizer alternative that matched best. */
  heard: string;
}

export function scoreSpeechMatch(
  expected: string,
  heardAlternatives: string | readonly string[],
): SpeechMatchResult {
  const alternatives = (
    typeof heardAlternatives === 'string' ? [heardAlternatives] : [...heardAlternatives]
  ).filter((value) => value.trim() !== '');
  const sampleWords = displayWords(expected);

  let best: SpeechMatchResult = {
    score: 0,
    words: sampleWords.map((text) => ({ text, matched: false })),
    heard: alternatives[0] ?? '',
  };

  for (const heard of alternatives) {
    const pool = countTokens(speechTokens(heard));
    let scoredWords = 0;
    let matchedWords = 0;
    const words = sampleWords.map((text) => {
      const needed = countTokens(speechTokens(text));
      if (needed.size === 0) return { text, matched: true };
      scoredWords += 1;
      const matched = [...needed].every(([token, count]) => (pool.get(token) ?? 0) >= count);
      if (matched) {
        matchedWords += 1;
        for (const [token, count] of needed) pool.set(token, (pool.get(token) ?? 0) - count);
      }
      return { text, matched };
    });
    const score = scoredWords === 0 ? 0 : matchedWords / scoredWords;
    if (score > best.score) best = { score, words, heard };
  }

  return best;
}

function countTokens(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}

export type SpeechFeedbackLevel = 'great' | 'good' | 'try-again';

export function getSpeechFeedbackLevel(score: number): SpeechFeedbackLevel {
  if (score >= SPEAKING_FEEDBACK.great) return 'great';
  if (score >= SPEAKING_FEEDBACK.good) return 'good';
  return 'try-again';
}
