import type { VoiceStyle } from '@/types/models';

/* Names match from a word start only (no trailing \b) so Edge's "AvaMultilingual" still counts.
 * Browsers expose no "child" voices and no gender field, so the boy/girl option picks a male/female
 * adult voice by its name and raises the pitch (see `SPEECH_CONFIG.stylePitch`). */

const FEMALE_NAMES =
  /\b(female|ana\b|zira|aria|jenny|michelle|ava|emma|samantha|allison|susan|hazel|heera|joanna|ivy|kendra|kimberly|salli|nicole|victoria|karen|moira|tessa|google us english)/;
const MALE_NAMES =
  /\b(male|david|mark|guy|eric|davis|tony|jason|christopher|roger|steffan|alex|fred|tom|daniel|ryan|joey|matthew|justin|kevin|andrew|brian|brandon)/;

/** Voices that already sound like a child (Edge's Ana), so they need no extra pitch. */
export const isChildVoice = (voiceName: string): boolean => /\bana\b/i.test(voiceName);

/** Which kind of voice a browser voice name sounds like, or `null` when the name does not say. */
export function voiceStyleOf(voiceName: string): VoiceStyle | null {
  const name = voiceName.toLowerCase();
  if (FEMALE_NAMES.test(name)) return 'girl';
  if (MALE_NAMES.test(name)) return 'boy';
  return null;
}
