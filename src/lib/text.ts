import type { CourseId } from '@/types/models';
import { getActiveCourse } from './course';

/**
 * Normalizes a typed quiz answer (spec §8 "Typing mode"): trim, lower-case, collapse whitespace.
 * It deliberately does NOT strip diacritics, punctuation or fix spelling — accepted variants must be
 * listed explicitly in `Word.acceptedAnswers`.
 */
export function normalizeAnswer(value: string): string {
  return value.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Collapses inner whitespace and trims, e.g. for names typed into the profile form. */
export function cleanSpaces(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ');
}

/** Counts user-perceived characters reasonably well (code points, not UTF-16 units). */
export function characterCount(value: string): number {
  return Array.from(value).length;
}

/**
 * The short answer sentence of the answer card, e.g. "It’s a lamp.", "It’s an armchair." or
 * "They’re curtains." for words marked `plural`, "It’s toothpaste." for words marked `uncountable`.
 * Chinese course: "这是一盏台灯。" with the word's `measure`, or "这是牙膏。" without one.
 */
export function describeWord(
  word: { text: string; plural?: boolean; uncountable?: boolean; measure?: string },
  course: CourseId = getActiveCourse(),
): string {
  if (course === 'zh') return `这是${word.measure ? `一${word.measure}` : ''}${word.text}。`;
  if (word.plural) return `They’re ${word.text}.`;
  if (word.uncountable) return `It’s ${word.text}.`;
  const article = /^[aeiou]/i.test(word.text) ? 'an' : 'a';
  return `It’s ${article} ${word.text}.`;
}

/** Pinyin of the classifiers used by the Chinese words. Extend it when a word uses a new one. */
const MEASURE_PINYIN: Record<string, string> = {
  个: 'gè',
  张: 'zhāng',
  条: 'tiáo',
  盏: 'zhǎn',
  台: 'tái',
  只: 'zhī',
  面: 'miàn',
  把: 'bǎ',
  本: 'běn',
  幅: 'fú',
  块: 'kuài',
  双: 'shuāng',
  盆: 'pén',
  份: 'fèn',
  扇: 'shàn',
  级: 'jí',
  片: 'piàn',
  棵: 'kē',
  朵: 'duǒ',
  丛: 'cóng',
  道: 'dào',
  根: 'gēn',
};

/**
 * Pinyin of the Chinese answer sentence: "Zhè shì yì zhǎn táidēng." (一 is yí before a fourth tone,
 * 个 is read neutral). `undefined` for the English course, words without pinyin or an unknown classifier.
 */
export function describeWordPinyin(
  word: { pinyin?: string; measure?: string },
  course: CourseId = getActiveCourse(),
): string | undefined {
  if (course !== 'zh' || !word.pinyin) return undefined;
  if (!word.measure) return `Zhè shì ${word.pinyin}.`;
  const measure = MEASURE_PINYIN[word.measure];
  if (!measure) return undefined;
  const fourthTone = /[àèìòùǜ]/.test(measure);
  const spoken = word.measure === '个' ? 'ge' : measure;
  return `Zhè shì ${fourthTone ? 'yí' : 'yì'} ${spoken} ${word.pinyin}.`;
}
