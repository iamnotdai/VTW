import { getActiveCourse } from '@/lib/course';
import { zh } from './zh';

/**
 * UI copy of the active course. English is the source: components keep their English text and wrap
 * it, e.g. `t('Start Quiz')` or `t('{count} words', { count })`. In the Chinese course the same text
 * is looked up in `src/i18n/zh/` (one file per area); a missing entry falls back to English.
 * Pass the English literal directly so tests/unit/i18n.test.ts can check every entry exists.
 * Course content (words, sentences, `meaningVi`) never goes through `t()`.
 */
export type CopyValues = Readonly<Record<string, string | number>>;

const DICTIONARIES: Partial<Record<string, Readonly<Record<string, string>>>> = { zh };

const reported = new Set<string>();

export function t(source: string, values?: CopyValues): string {
  const course = getActiveCourse();
  const dictionary = DICTIONARIES[course];
  const text = dictionary?.[source] ?? source;
  if (import.meta.env.DEV && dictionary && !(source in dictionary) && !reported.has(source)) {
    reported.add(source);
    console.warn(`[i18n] missing ${course} copy for: ${source}`);
  }
  return values ? fill(text, values) : text;
}

function fill(text: string, values: CopyValues): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
