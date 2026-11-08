import type { SoundTokens } from './soundChart';

/**
 * The pinyin chart of the Chinese course (spec §24.3): splits a word's pinyin ("chuángtóuguì")
 * into syllables, and each syllable into its initial (声母), final (韵母) and tone (声调), as taught
 * in Vietnamese textbooks: 21 initials, 36 finals plus the "-i" of zhi/chi/shi/ri/zi/ci/si, 4 tones
 * and the neutral tone.
 */

/** The 21 initials, longest first so "zh" wins over "z". */
export const PINYIN_INITIALS = [
  'zh',
  'ch',
  'sh',
  'b',
  'p',
  'm',
  'f',
  'd',
  't',
  'n',
  'l',
  'g',
  'k',
  'h',
  'j',
  'q',
  'x',
  'r',
  'z',
  'c',
  's',
] as const;

/** The finals in their full spelling ("iou", not the "iu" written after an initial). */
export const PINYIN_FINALS = [
  'a',
  'o',
  'e',
  'i',
  'u',
  'ü',
  'ai',
  'ei',
  'ao',
  'ou',
  'ia',
  'ie',
  'ua',
  'uo',
  'üe',
  'iao',
  'iou',
  'uai',
  'uei',
  'an',
  'en',
  'in',
  'ün',
  'ian',
  'uan',
  'üan',
  'uen',
  'ang',
  'eng',
  'ing',
  'ong',
  'iang',
  'uang',
  'ueng',
  'iong',
  'er',
  '-i',
] as const;

export type PinyinTone = 1 | 2 | 3 | 4 | 5;

const FINALS = new Set<string>(PINYIN_FINALS);

const TONE_MARKS: Record<string, [string, PinyinTone]> = {
  ā: ['a', 1],
  á: ['a', 2],
  ǎ: ['a', 3],
  à: ['a', 4],
  ē: ['e', 1],
  é: ['e', 2],
  ě: ['e', 3],
  è: ['e', 4],
  ī: ['i', 1],
  í: ['i', 2],
  ǐ: ['i', 3],
  ì: ['i', 4],
  ō: ['o', 1],
  ó: ['o', 2],
  ǒ: ['o', 3],
  ò: ['o', 4],
  ū: ['u', 1],
  ú: ['u', 2],
  ǔ: ['u', 3],
  ù: ['u', 4],
  ǖ: ['ü', 1],
  ǘ: ['ü', 2],
  ǚ: ['ü', 3],
  ǜ: ['ü', 4],
};

/** Syllables written without an initial: y/w spellings and vowel-only syllables. */
const NO_INITIAL: Record<string, string> = {
  yi: 'i',
  ya: 'ia',
  ye: 'ie',
  yao: 'iao',
  you: 'iou',
  yan: 'ian',
  yin: 'in',
  yang: 'iang',
  ying: 'ing',
  yong: 'iong',
  yu: 'ü',
  yue: 'üe',
  yuan: 'üan',
  yun: 'ün',
  wu: 'u',
  wa: 'ua',
  wo: 'uo',
  wai: 'uai',
  wei: 'uei',
  wan: 'uan',
  wen: 'uen',
  wang: 'uang',
  weng: 'ueng',
  a: 'a',
  o: 'o',
  e: 'e',
  ai: 'ai',
  ei: 'ei',
  ao: 'ao',
  ou: 'ou',
  an: 'an',
  en: 'en',
  ang: 'ang',
  eng: 'eng',
  er: 'er',
};

const APICAL = new Set(['zh', 'ch', 'sh', 'r', 'z', 'c', 's']);
const PALATAL = new Set(['j', 'q', 'x']);

/** Tone-mark-free letters and the tone of a written syllable ("chuáng" → "chuang", 2). */
function untone(syllable: string): { base: string; tone: PinyinTone } {
  let base = '';
  let tone: PinyinTone = 5;
  for (const char of syllable.normalize('NFC').toLowerCase()) {
    const mark = TONE_MARKS[char];
    if (mark) {
      base += mark[0];
      tone = mark[1];
    } else base += char;
  }
  return { base, tone };
}

/** The initial and final (full spelling) of a toneless syllable, or `null` if it isn't pinyin. */
export function parsePinyinSyllable(base: string): { initial: string; final: string } | null {
  const bare = NO_INITIAL[base];
  if (bare) return { initial: '', final: bare };
  const initial = PINYIN_INITIALS.find((item) => base.startsWith(item));
  if (!initial) return null;
  let final = base.slice(initial.length);
  if (!final) return null;
  if (APICAL.has(initial) && final === 'i') final = '-i';
  if (PALATAL.has(initial) && final.startsWith('u')) final = `ü${final.slice(1)}`;
  if (final === 'iu') final = 'iou';
  else if (final === 'ui') final = 'uei';
  else if (final === 'un') final = 'uen';
  return FINALS.has(final) ? { initial, final } : null;
}

export interface PinyinSyllable {
  /** Position in the pinyin text. */
  start: number;
  end: number;
  /** End of the written initial (= `start` when the syllable has none). */
  initialEnd: number;
  initial: string;
  final: string;
  tone: PinyinTone;
}

/**
 * Cuts pinyin into syllables. Words are written joined ("táidēng"); a syllable starting with a,
 * o or e inside a word needs an apostrophe ("dàn'gāo" vs "dàngāo" = dàn + gāo), so it is never
 * read there. `expected` (the number of characters) picks the right cut when several fit.
 * Returns `null` when the text isn't pinyin.
 */
export function splitPinyin(pinyin: string, expected?: number): PinyinSyllable[] | null {
  const result: PinyinSyllable[] = [];
  // Runs of letters, split at spaces, apostrophes and hyphens.
  for (const match of pinyin.matchAll(/[\p{L}\p{M}]+/gu)) {
    const run = match[0];
    const offset = match.index;
    const cuts: number[][] = [];
    const go = (at: number, acc: number[]) => {
      if (cuts.length >= 8) return;
      if (at === run.length) {
        cuts.push(acc);
        return;
      }
      for (let length = Math.min(6, run.length - at); length >= 1; length -= 1) {
        const piece = run.slice(at, at + length);
        if (at > 0 && /^[aoeāáǎàōóǒòēéěè]/iu.test(piece)) continue;
        if (parsePinyinSyllable(untone(piece).base)) go(at + length, [...acc, length]);
      }
    };
    go(0, []);
    if (cuts.length === 0) return null;
    const lengths = cuts[0];
    let at = 0;
    for (const length of lengths) {
      const piece = run.slice(at, at + length);
      const { base, tone } = untone(piece);
      const parsed = parsePinyinSyllable(base)!;
      const start = offset + at;
      result.push({
        start,
        end: start + length,
        initialEnd: start + parsed.initial.length,
        initial: parsed.initial,
        final: parsed.final,
        tone,
      });
      at += length;
    }
  }
  if (expected !== undefined && result.length !== expected) return null;
  return result;
}

/** A chart sound as far as the tokenizer needs it. */
export interface PinyinChartSound {
  id: string;
  symbol: string;
  group: string;
  tone?: number;
}

/**
 * Pinyin cut into chart sounds: an initial token, a final token and a tone token (the whole
 * syllable) per syllable. Unknown parts are reported for `content:check`.
 */
export function tokenizePinyin(
  pinyin: string,
  sounds: readonly PinyinChartSound[],
  expected?: number,
): SoundTokens {
  const syllables = splitPinyin(pinyin, expected);
  if (!syllables) return { tokens: [], unknown: [pinyin] };
  const find = (group: string, symbol: string) =>
    sounds.find((sound) => sound.group === group && sound.symbol === symbol)?.id;
  const findTone = (tone: number) =>
    sounds.find((sound) => sound.group === 'tone' && sound.tone === tone)?.id;
  const tokens = [];
  const unknown: string[] = [];
  for (const syllable of syllables) {
    const text = pinyin.slice(syllable.start, syllable.end);
    if (syllable.initial) {
      const id = find('initial', syllable.initial);
      if (id) tokens.push({ soundId: id, start: syllable.start, end: syllable.initialEnd });
      else unknown.push(syllable.initial);
    }
    const final = find('final', syllable.final);
    if (final) tokens.push({ soundId: final, start: syllable.initialEnd, end: syllable.end });
    else unknown.push(syllable.final);
    const tone = findTone(syllable.tone);
    if (tone) tokens.push({ soundId: tone, start: syllable.start, end: syllable.end });
    else unknown.push(`${text} (tone ${syllable.tone})`);
  }
  return { tokens, unknown };
}
