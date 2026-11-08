/**
 * Shared shape of the Pronunciation sound charts (spec §24.2): the IPA chart of the English course
 * and the pinyin chart of the Chinese course. A transcription ("/læmp/", "chuángtóuguì") is cut
 * into tokens, each pointing at a sound of the chart, so the chart can find example words and
 * highlight the sound in them.
 */

export interface SoundToken {
  soundId: string;
  /** Position in the transcription. */
  start: number;
  end: number;
}

export interface SoundTokens {
  tokens: SoundToken[];
  /** Parts that belong to no sound of the chart (`content:check` reports them). */
  unknown: string[];
}

export interface SoundPart {
  text: string;
  /** This part is the sound being studied. */
  highlight: boolean;
}

/** The transcription cut into parts, with the given sound highlighted. */
export function highlightSound(
  text: string,
  tokens: readonly SoundToken[],
  soundId: string,
): SoundPart[] {
  const parts: SoundPart[] = [];
  let last = 0;
  const marked = tokens
    .filter((token) => token.soundId === soundId)
    .sort((a, b) => a.start - b.start);
  for (const token of marked) {
    if (token.start < last) continue;
    if (token.start > last) parts.push({ text: text.slice(last, token.start), highlight: false });
    parts.push({ text: text.slice(token.start, token.end), highlight: true });
    last = token.end;
  }
  if (last < text.length) parts.push({ text: text.slice(last), highlight: false });
  return parts;
}
