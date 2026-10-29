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
 */
export function describeWord(word: {
  text: string;
  plural?: boolean;
  uncountable?: boolean;
}): string {
  if (word.plural) return `They’re ${word.text}.`;
  if (word.uncountable) return `It’s ${word.text}.`;
  const article = /^[aeiou]/i.test(word.text) ? 'an' : 'a';
  return `It’s ${article} ${word.text}.`;
}
