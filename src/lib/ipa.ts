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

export interface IpaToken {
  soundId: string;
  /** Position in the transcription, for highlighting. */
  start: number;
  end: number;
}

export interface IpaTokens {
  tokens: IpaToken[];
  /** Characters that belong to no sound of the chart (`content:check` reports them). */
  unknown: string[];
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
export function tokenizeIpa(ipa: string, spellings: readonly IpaSymbol[]): IpaTokens {
  const tokens: IpaToken[] = [];
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

export interface IpaPart {
  text: string;
  /** This part is the sound being studied. */
  highlight: boolean;
}

/** The transcription cut into parts, with the given sound highlighted ("/l", "æ", "mp/"). */
export function highlightIpaSound(
  ipa: string,
  soundId: string,
  spellings: readonly IpaSymbol[],
): IpaPart[] {
  const parts: IpaPart[] = [];
  let last = 0;
  for (const token of tokenizeIpa(ipa, spellings).tokens) {
    if (token.soundId !== soundId) continue;
    if (token.start > last) parts.push({ text: ipa.slice(last, token.start), highlight: false });
    parts.push({ text: ipa.slice(token.start, token.end), highlight: true });
    last = token.end;
  }
  if (last < ipa.length) parts.push({ text: ipa.slice(last), highlight: false });
  return parts;
}

export function ipaHasSound(
  ipa: string,
  soundId: string,
  spellings: readonly IpaSymbol[],
): boolean {
  return tokenizeIpa(ipa, spellings).tokens.some((token) => token.soundId === soundId);
}
