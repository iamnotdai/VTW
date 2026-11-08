import type { SoundToken, SoundTokens } from './soundChart';

/**
 * IPA of the English course (spec §24.2): splits a word's transcription ("/ˈlæmp/") into the
 * sounds of the American English chart, so the chart can find example words for each sound and
 * highlight it. Pure logic: the chart itself is content (`src/data/pronunciation/ipa.json`).
 */

export interface IpaSymbol {
  /** The chart sound this spelling belongs to. */
  soundId: string;
  /** As written in the transcription, e.g. "tʃ", or an alias like "i" for "iː". */
  spelling: string;
}

/** Stress marks, slashes and spaces carry no sound. */
const IGNORED = new Set(['/', 'ˈ', 'ˌ', ' ']);

/** The spellings of a chart, longest first so "tʃ" wins over "t" and "aɪ" over "a". */
export function ipaSpellings(
  sounds: readonly { id: string; symbol: string; aliases?: readonly string[] }[],
): IpaSymbol[] {
  return sounds
    .flatMap((sound) =>
      [sound.symbol, ...(sound.aliases ?? [])].map((spelling) => ({
        soundId: sound.id,
        spelling,
      })),
    )
    .sort((a, b) => b.spelling.length - a.spelling.length);
}

/** Splits a transcription into chart sounds, longest spelling first. */
export function tokenizeIpa(ipa: string, spellings: readonly IpaSymbol[]): SoundTokens {
  const tokens: SoundToken[] = [];
  const unknown: string[] = [];
  let at = 0;
  while (at < ipa.length) {
    if (IGNORED.has(ipa[at])) {
      at += 1;
      continue;
    }
    const match = spellings.find((symbol) => ipa.startsWith(symbol.spelling, at));
    if (match) {
      tokens.push({ soundId: match.soundId, start: at, end: at + match.spelling.length });
      at += match.spelling.length;
    } else {
      const char = String.fromCodePoint(ipa.codePointAt(at) ?? 0);
      unknown.push(char);
      at += char.length;
    }
  }
  return { tokens, unknown };
}
