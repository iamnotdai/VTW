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

const NUMBER_WORDS: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',
  '11': 'eleven',
  '12': 'twelve',
};

/** Lower-cases, strips punctuation, expands common contractions and small numbers. */
export function speechTokens(text: string): string[] {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^'+|'+$/g, ''))
    .filter(Boolean)
    .flatMap((word) => CONTRACTIONS[word] ?? [NUMBER_WORDS[word] ?? word]);
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
  const displayWords = expected.trim().split(/\s+/).filter(Boolean);

  let best: SpeechMatchResult = {
    score: 0,
    words: displayWords.map((text) => ({ text, matched: false })),
    heard: alternatives[0] ?? '',
  };

  for (const heard of alternatives) {
    const pool = countTokens(speechTokens(heard));
    let scoredWords = 0;
    let matchedWords = 0;
    const words = displayWords.map((text) => {
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
